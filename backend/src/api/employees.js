const crypto = require('crypto');
const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const sequelize = require('../config/db');
const Company = require('../models/Company');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
const EmployeePermission = require('../models/EmployeePermission');
const AttendanceRecords = require('../models/AttendanceRecords');
const ShiftType = require('../models/ShiftType');
const applyAssociations = require('../models/associations');
const { syncEmployeeHistoricalAttendance } = require('../services/attendanceService');

applyAssociations();

const requiredFields = ['company_id', 'employee_id', 'name', 'email', 'password'];

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2_sha512$100000$${salt}$${hash}`;
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];

  return Array.from(
    new Set(
      permissions
        .map((permission) => String(permission || '').trim())
        .filter(Boolean),
    ),
  );
};

const buildEmployeePayload = (body) => ({
  company_id: body.company_id,
  employee_id: String(body.employee_id).trim(),
  name: String(body.name).trim(),
  email: String(body.email).trim().toLowerCase(),
  password: hashPassword(body.password),
  gender: body.gender || null,
  designation_id: body.designation_id || body.designation || null,
  department_id: body.department_id || body.department || null,
  shift_type_id: body.shift_type_id || null,
  joining_date: body.joining_date || null,
  hourly_rate: body.hourly_rate || null,
  mobile: body.mobile || null,
  emergency_phone: body.emergency_phone || null,
  address: body.address || null,
  nic: body.nic || null,
  father_name: body.father_name || null,
  status: body.status === 'deactive' ? 'deactive' : 'active',
  login: body.login === 'disable' ? 'disable' : 'enable',
});

const buildEmployeeUpdatePayload = (body) => {
  const detail = body.employee_detail || {};
  const payload = {
    employee_id: String(body.employee_id || detail.employee_id || '').trim(),
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    gender: body.gender || null,
    designation_id: body.designation_id || detail.designation_id || body.designation || null,
    department_id: body.department_id || detail.department_id || body.department || null,
    shift_type_id: body.shift_type_id || detail.shift_type_id || null,
    joining_date: body.joining_date || detail.joining_date || null,
    hourly_rate: body.hourly_rate || detail.hourly_rate || null,
    mobile: body.mobile || detail.mobile || null,
    emergency_phone: body.emergency_phone || detail.emergency_phone || null,
    address: body.address || detail.address || null,
    nic: body.nic || detail.nic || null,
    father_name: body.father_name || detail.father_name || null,
    status: body.status === 'deactive' ? 'deactive' : 'active',
    login: body.login === 'disable' ? 'disable' : 'enable',
  };

  if (String(body.password || '').trim()) {
    payload.password = hashPassword(body.password);
  }

  return payload;
};

const serializeEmployee = (employee) => {
  const data = employee?.toJSON ? employee.toJSON() : employee;
  if (!data) return data;
  delete data.password;

  return {
    ...data,
    role: 'employee',
    permissions: data.permission_record?.permission_keys || [],
    employee_detail: {
      employee_id: data.employee_id,
      joining_date: data.joining_date,
      department_id: data.department_id,
      designation_id: data.designation_id,
      shift_type_id: data.shift_type_id,
      mobile: data.mobile,
      hourly_rate: data.hourly_rate,
      emergency_phone: data.emergency_phone,
      address: data.address,
      nic: data.nic,
      father_name: data.father_name,
      designation: data.designation,
      department: data.department,
      shift_type: data.shift_type,
    },
  };
};

router.post('/', async (req, res, next) => {
  const transaction = await sequelize.transaction();
  let transactionCommitted = false;

  try {
    const missingFields = requiredFields.filter((field) => !String(req.body[field] || '').trim());

    if (missingFields.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`,
      });
    }

    const employeePayload = buildEmployeePayload(req.body);
    const permissions = normalizePermissions(req.body.permissions);

    const employee = await Employee.create(employeePayload, { transaction });

    await EmployeePermission.create({
      employee_id: employee.id,
      permission_keys: permissions,
    }, { transaction });

    await transaction.commit();
    transactionCommitted = true;
    let attendanceSync;
    try {
      const syncResult = await syncEmployeeHistoricalAttendance(employee.employee_id);
      attendanceSync = {
        status: syncResult.queued.length > 0 ? 'queued' : 'no_device_found',
        employeeId: syncResult.employeeId,
        startDate: syncResult.startDate,
        endDate: syncResult.endDate,
        processedFromStoredLogs: syncResult.processed.processed,
        deviceQueries: syncResult.queued.length,
      };
      console.log(`Employee attendance backfill started. employeeId=${employee.employee_id}, processed=${syncResult.processed.processed}, deviceQueries=${syncResult.queued.length}`);
    } catch (syncError) {
      attendanceSync = { status: 'failed', employeeId: employee.employee_id, error: syncError.message };
      console.error(`Employee attendance backfill failed. employeeId=${employee.employee_id}`, syncError);
    }
    const createdEmployee = employee.toJSON();
    delete createdEmployee.password;

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      attendanceSync,
      data: serializeEmployee({
        ...createdEmployee,
        permission_record: {
          employee_id: employee.id,
          permission_keys: permissions,
        },
      }),
    });
  } catch (err) {
    if (!transactionCommitted) {
      await transaction.rollback();
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Employee ID or email already exists',
      });
    }

    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const employees = await Employee.findAll({
      where: req.query.company_id ? { company_id: req.query.company_id } : {},
      attributes: { exclude: ['password'] },
      include: [
        { model: Company, as: 'company' },
        { model: Designation, as: 'designation' },
        { model: Department, as: 'department' },
        { model: ShiftType, as: 'shift_type' },
        { model: EmployeePermission, as: 'permission_record' },
      ],
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees.map(serializeEmployee),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:employeeId/attendance', async (req, res, next) => {
  try {
    const numericId = Number(req.params.employeeId);
    const attributes = ['id', 'company_id', 'employee_id', 'name', 'email'];

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid employee database ID is required',
      });
    }

    const employee = await Employee.findByPk(numericId, { attributes });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const attendanceEmployeeId = employee.employee_id;
    const records = await AttendanceRecords.findAll({
      where: {
        ...(employee.company_id ? { companyId: employee.company_id } : {}),
        employeeId: attendanceEmployeeId,
      },
      order: [['workDate', 'DESC']],
      limit: Math.min(Math.max(Number(req.query.limit) || 100, 1), 500),
    });

    return res.status(200).json({
      success: true,
      count: records.length,
      employee: employee || null,
      data: records,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/sync-attendance', async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      attributes: ['id', 'company_id', 'employee_id'],
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const result = await syncEmployeeHistoricalAttendance(employee.employee_id);
    return res.status(202).json({
      success: true,
      message: result.queued.length > 0
        ? 'Historical attendance synchronization queued'
        : 'Stored punches processed, but no attendance device was discovered',
      data: {
        status: result.queued.length > 0 ? 'queued' : 'no_device_found',
        employeeId: result.employeeId,
        startDate: result.startDate,
        endDate: result.endDate,
        processedFromStoredLogs: result.processed.processed,
        deviceQueries: result.queued.length,
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid employee ID is required',
      });
    }

    const employee = await Employee.findByPk(employeeId, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Company, as: 'company' },
        { model: Designation, as: 'designation' },
        { model: Department, as: 'department' },
        { model: ShiftType, as: 'shift_type' },
        { model: EmployeePermission, as: 'permission_record' },
      ],
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeEmployee(employee),
    });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const transaction = await sequelize.transaction();
  let transactionCommitted = false;

  try {
    const where = { id: req.params.id };
    const companyId = req.body.company_id || req.query.company_id;

    if (companyId) {
      where.company_id = companyId;
    }

    const employee = await Employee.findOne({ where, transaction });

    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const payload = buildEmployeeUpdatePayload(req.body);
    const missingFields = ['employee_id', 'name', 'email'].filter((field) => !String(payload[field] || '').trim());

    if (missingFields.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(', ')} ${missingFields.length === 1 ? 'is' : 'are'} required`,
      });
    }

    await employee.update(payload, { transaction });

    if (Array.isArray(req.body.permissions)) {
      await EmployeePermission.upsert({
        employee_id: employee.id,
        permission_keys: normalizePermissions(req.body.permissions),
      }, { transaction });
    }

    await transaction.commit();
    transactionCommitted = true;

    const updatedEmployee = await Employee.findByPk(employee.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Company, as: 'company' },
        { model: Designation, as: 'designation' },
        { model: Department, as: 'department' },
        { model: ShiftType, as: 'shift_type' },
        { model: EmployeePermission, as: 'permission_record' },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: serializeEmployee(updatedEmployee),
    });
  } catch (err) {
    if (!transactionCommitted) {
      await transaction.rollback();
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Employee ID or email already exists',
      });
    }

    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const where = { id: req.params.id };
    const companyId = req.body.company_id || req.query.company_id;

    if (companyId) {
      where.company_id = companyId;
    }

    const employee = await Employee.findOne({ where });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    await employee.destroy();

    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
