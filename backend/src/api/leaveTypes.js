const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const LeaveType = require('../models/LeaveType');
const Leave = require('../models/Leave');

const getCompanyId = (query = {}, body = {}) => body.company_id || query.company_id || query.companyId || null;

router.get('/', async (req, res, next) => {
  try {
    const companyId = getCompanyId(req.query);
    const where = companyId ? { [Op.or]: [{ company_id: companyId }, { company_id: null }] } : {};
    const leaveTypes = await LeaveType.findAll({ where, order: [['id', 'ASC']] });

    return res.status(200).json({
      success: true,
      count: leaveTypes.length,
      data: leaveTypes,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const typeName = String(req.body.type_name || req.body.name || '').trim();

    if (!typeName) {
      return res.status(400).json({ success: false, message: 'Leave type name is required' });
    }

    const leaveType = await LeaveType.create({
      company_id: getCompanyId(req.query, req.body),
      type_name: typeName,
      no_of_leaves: req.body.no_of_leaves || req.body.leaves || req.body.leave_number || 0,
      paid: Number(req.body.paid ?? 1),
      color: req.body.color || 'info',
    });

    return res.status(201).json({ success: true, data: leaveType });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Leave type already exists' });
    }

    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const leaveType = await LeaveType.findByPk(req.params.id);

    if (!leaveType) {
      return res.status(404).json({ success: false, message: 'Leave type not found' });
    }

    await leaveType.update({
      company_id: getCompanyId(req.query, req.body) || leaveType.company_id,
      type_name: req.body.type_name || req.body.name || leaveType.type_name,
      no_of_leaves: req.body.no_of_leaves ?? req.body.leaves ?? leaveType.no_of_leaves,
      paid: req.body.paid !== undefined ? Number(req.body.paid) : leaveType.paid,
      color: req.body.color || leaveType.color,
    });

    return res.status(200).json({ success: true, data: leaveType });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const leaveType = await LeaveType.findByPk(req.params.id);

    if (!leaveType) {
      return res.status(404).json({ success: false, message: 'Leave type not found' });
    }

    await Leave.update({ leave_type_id: null }, { where: { leave_type_id: leaveType.id } });
    await leaveType.destroy();

    return res.status(200).json({ success: true, message: 'Leave type deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
