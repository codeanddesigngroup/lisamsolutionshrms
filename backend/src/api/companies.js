const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const Company = require('../models/Company');
const Role = require('../models/Role');
const User = require('../models/User');

const createToken = () => crypto.randomBytes(48).toString('hex');

const normalizeStatus = (status) => (status === 'inactive' ? 'inactive' : 'active');

const buildCompanyPayload = (body) => ({
  name: String(body.name || body.company_name || '').trim(),
  email: body.email ? String(body.email).trim().toLowerCase() : null,
  phone: body.phone ? String(body.phone).trim() : null,
  website: body.website ? String(body.website).trim() : null,
  status: normalizeStatus(body.status),
});

router.get('/', async (req, res, next) => {
  try {
    const companies = await Company.findAll({ order: [['id', 'ASC']] });

    return res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = buildCompanyPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const company = await Company.create(payload);
    return res.status(201).json({ success: true, message: 'Company created successfully', data: company });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/login', async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (company.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Company is inactive' });
    }

    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    if (!adminRole) {
      return res.status(404).json({ success: false, message: 'Company admin role not found' });
    }

    const admin = await User.findOne({
      where: {
        company_id: company.id,
        role_id: adminRole.id,
        status: 'active',
      },
      order: [['id', 'ASC']],
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'No active admin found for this company' });
    }

    return res.status(200).json({
      success: true,
      data: {
        token: createToken(),
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: 'admin',
          company_id: admin.company_id,
          impersonator_role: 'super_admin',
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.status(200).json({ success: true, data: company });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const payload = buildCompanyPayload({ ...company.toJSON(), ...req.body });
    if (!payload.name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    await company.update(payload);
    return res.status(200).json({ success: true, message: 'Company updated successfully', data: company });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Company.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
