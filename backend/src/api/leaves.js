const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const Leave = require('../models/Leave');
const LeaveType = require('../models/LeaveType');
const Employee = require('../models/Employee');

const normalizeStatus = (value) => {
  if (['approved', 'rejected', 'cancelled'].includes(value)) return value;
  return 'pending';
};

const getCompanyFilter = (query = {}, body = {}) => body.company_id || query.company_id || query.companyId || null;

const include = [
  { model: Employee, as: 'employee', attributes: { exclude: ['password'] } },
  { model: LeaveType, as: 'leave_type' },
];

const serializeLeave = (leave) => {
  const data = leave?.toJSON ? leave.toJSON() : leave;
  if (!data) return data;

  return {
    ...data,
    date: data.leave_date,
    user_id: data.employee_id,
    user: data.employee,
    type_id: data.leave_type_id,
    type: data.leave_type,
  };
};

const dateRangeFromBody = (body) => {
  if (body.multi_date) {
    return String(body.multi_date)
      .split(',')
      .map((date) => date.trim())
      .filter(Boolean);
  }

  return [body.leave_date || body.date].filter(Boolean);
};

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    const companyId = getCompanyFilter(req.query);

    if (companyId) where.company_id = companyId;
    if (req.query.employee_id || req.query.user_id) where.employee_id = req.query.employee_id || req.query.user_id;
    if (req.query.status) where.status = req.query.status;
    if (req.query.start_date || req.query.end_date) {
      where.leave_date = {};
      if (req.query.start_date) where.leave_date[Op.gte] = req.query.start_date;
      if (req.query.end_date) where.leave_date[Op.lte] = req.query.end_date;
    }

    const leaves = await Leave.findAll({
      where,
      include,
      order: [['leave_date', 'DESC'], ['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves.map(serializeLeave),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const employeeId = req.body.employee_id || req.body.user_id || req.body.user?.id;
    const leaveTypeId = req.body.leave_type_id || req.body.type_id || req.body.type?.id || null;
    const employee = employeeId ? await Employee.findByPk(employeeId) : null;
    const companyId = getCompanyFilter(req.query, req.body) || employee?.company_id;
    const dates = dateRangeFromBody(req.body);
    const reason = String(req.body.reason || '').trim();

    if (!companyId || !employeeId || !dates.length || !reason) {
      return res.status(400).json({
        success: false,
        message: 'company_id, employee, leave date, and reason are required',
      });
    }

    const leaves = await Leave.bulkCreate(dates.map((date) => ({
      company_id: companyId,
      employee_id: employeeId,
      leave_type_id: leaveTypeId || null,
      leave_date: date,
      end_date: req.body.end_date || dates[dates.length - 1] || date,
      duration: req.body.duration || 'single',
      reason,
      status: normalizeStatus(req.body.status),
    })), { returning: true });

    const createdLeaves = await Leave.findAll({
      where: { id: leaves.map((leave) => leave.id) },
      include,
      order: [['leave_date', 'ASC']],
    });

    return res.status(201).json({
      success: true,
      message: 'Leave request saved successfully',
      data: createdLeaves.length === 1 ? serializeLeave(createdLeaves[0]) : createdLeaves.map(serializeLeave),
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id, { include });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    return res.status(200).json({ success: true, data: serializeLeave(leave) });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const patch = {};
    if (req.body.status) patch.status = normalizeStatus(req.body.status);
    if (req.body.reason !== undefined) patch.reason = String(req.body.reason || '').trim();
    if (req.body.action_reason !== undefined || req.body.note !== undefined) {
      patch.action_reason = String(req.body.action_reason || req.body.note || '').trim();
    }

    await leave.update(patch);
    const updated = await Leave.findByPk(leave.id, { include });
    return res.status(200).json({ success: true, data: serializeLeave(updated) });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    await leave.update({
      employee_id: req.body.employee_id || req.body.user_id || req.body.user?.id || leave.employee_id,
      leave_type_id: req.body.leave_type_id || req.body.type_id || req.body.type?.id || leave.leave_type_id,
      leave_date: req.body.leave_date || req.body.date || leave.leave_date,
      end_date: req.body.end_date || leave.end_date,
      duration: req.body.duration || leave.duration,
      reason: req.body.reason !== undefined ? String(req.body.reason || '').trim() : leave.reason,
      status: req.body.status ? normalizeStatus(req.body.status) : leave.status,
    });

    const updated = await Leave.findByPk(leave.id, { include });
    return res.status(200).json({ success: true, data: serializeLeave(updated) });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    await leave.update({
      status: 'approved',
      action_reason: req.body.reason || req.body.action_reason || '',
    });

    const updated = await Leave.findByPk(leave.id, { include });
    return res.status(200).json({ success: true, data: serializeLeave(updated) });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    await leave.update({
      status: 'rejected',
      action_reason: req.body.reason || req.body.action_reason || '',
    });

    const updated = await Leave.findByPk(leave.id, { include });
    return res.status(200).json({ success: true, data: serializeLeave(updated) });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    await leave.destroy();
    return res.status(200).json({ success: true, message: 'Leave request deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
