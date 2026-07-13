const express = require('express');
const router = express.Router();

const LeaveQuota = require('../models/LeaveQuota');
const LeaveType = require('../models/LeaveType');
const Employee = require('../models/Employee');

const include = [
  { model: Employee, as: 'employee', attributes: { exclude: ['password'] } },
  { model: LeaveType, as: 'leave_type' },
];

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.company_id) where.company_id = req.query.company_id;
    if (req.query.employee_id || req.query.user_id) where.employee_id = req.query.employee_id || req.query.user_id;

    const quotas = await LeaveQuota.findAll({ where, include, order: [['id', 'ASC']] });
    return res.status(200).json({ success: true, count: quotas.length, data: quotas });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.body.company_id || req.query.company_id;
    const employeeId = req.body.employee_id || req.body.user_id;
    const leaveTypeId = req.body.leave_type_id || req.body.type_id;

    if (!companyId || !employeeId || !leaveTypeId) {
      return res.status(400).json({ success: false, message: 'company_id, employee_id, and leave_type_id are required' });
    }

    const [quota] = await LeaveQuota.upsert({
      company_id: companyId,
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      no_of_leaves: req.body.no_of_leaves || req.body.leaves || 0,
    }, { returning: true });

    return res.status(201).json({ success: true, data: quota });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const quota = await LeaveQuota.findByPk(req.params.id);

    if (!quota) {
      return res.status(404).json({ success: false, message: 'Employee leave balance not found' });
    }

    await quota.destroy();
    return res.status(200).json({ success: true, message: 'Employee leave balance deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
