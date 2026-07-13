const express = require('express');
const router = express.Router();
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.body.company_id || req.query.company_id;
    const name = String(req.body.name || '').trim();

    if (!companyId || !name) {
      return res.status(400).json({
        success: false,
        message: 'company_id and name are required',
      });
    }

    const designation = await Designation.create({
      company_id: companyId,
      name,
    });

    return res.status(201).json({
      success: true,
      data: designation,
    });

  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.company_id) {
      where.company_id = req.query.company_id;
    }

    const designation = await Designation.findAll({
      where,
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      count: designation.length,
      data: designation,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const companyId = req.body.company_id || req.query.company_id;
    const name = String(req.body.name || '').trim();
    const where = { id: req.params.id };

    if (companyId) {
      where.company_id = companyId;
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required',
      });
    }

    const designation = await Designation.findOne({ where });

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: 'Designation not found',
      });
    }

    await designation.update({ name });

    return res.status(200).json({
      success: true,
      data: designation,
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Designation already exists for this company',
      });
    }

    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const companyId = req.body.company_id || req.query.company_id;
    const where = { id: req.params.id };

    if (companyId) {
      where.company_id = companyId;
    }

    const designation = await Designation.findOne({ where });

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: 'Designation not found',
      });
    }

    await Employee.update(
      { designation_id: null },
      { where: { designation_id: designation.id, ...(companyId ? { company_id: companyId } : {}) } },
    );
    await designation.destroy();

    return res.status(200).json({
      success: true,
      message: 'Designation deleted successfully',
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
