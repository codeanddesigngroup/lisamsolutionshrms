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
const { processAttendanceRecords } = require('../services/attendanceService');

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
      designation: data.designation,
      department: data.department,
      shift_type: data.shift_type,
    },
  };
};

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getBackfillRange(months = 6) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - months);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function backfillEmployeeAttendance(employeeId) {
  const { startDate, endDate } = getBackfillRange(6);

  setImmediate(async () => {
    try {
      const result = await processAttendanceRecords({
        employeeId,
        startDate,
        endDate,
      });

      console.log(`Employee attendance backfill completed. employeeId=${employeeId}, processed=${result.processed}`);
    } catch (err) {
      console.error(`Employee attendance backfill failed. employeeId=${employeeId}`, err);
    }
  });
}

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
    backfillEmployeeAttendance(employee.employee_id);
    const createdEmployee = employee.toJSON();
    delete createdEmployee.password;

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
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
    const employee = await Employee.findOne({
      where: {
        [Op.or]: [
          { id: Number(req.params.employeeId) || 0 },
          { employee_id: String(req.params.employeeId) },
        ],
      },
      attributes: ['id', 'company_id', 'employee_id', 'name', 'email'],
    });

    const attendanceEmployeeId = employee?.employee_id || String(req.params.employeeId);
    const records = await AttendanceRecords.findAll({
      where: {
        ...(employee?.company_id ? { companyId: employee.company_id } : {}),
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
