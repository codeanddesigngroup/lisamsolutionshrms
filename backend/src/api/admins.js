const express = require('express');
const router = express.Router();

const Role = require('../models/Role');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');
const { publicUserAttributes, serializeUser, userIncludes } = require('./users');

const normalizeStatus = (status) => (status === 'inactive' ? 'inactive' : 'active');

const getAdminRole = async (transaction) => {
  const [role] = await Role.findOrCreate({
    where: { name: 'Admin' },
    defaults: { name: 'Admin' },
    transaction,
  });
  return role;
};

const getAdminRoleId = async () => {
  const role = await getAdminRole();
  return role.id;
};

router.get('/', async (req, res, next) => {
  try {
    const adminRoleId = await getAdminRoleId();
    const companyId = req.query.company_id || req.query.companyId;
    const admins = await User.findAll({
      where: { role_id: adminRoleId, ...(companyId ? { company_id: companyId } : {}) },
      attributes: publicUserAttributes,
      include: userIncludes,
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins.map((admin) => ({
        ...serializeUser(admin),
        role: 'admin',
        permissions: admin.permissions || [],
        modules: admin.modules || [],
      })),
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  const transaction = await User.sequelize.transaction();

  try {
    if (!String(req.body.name || '').trim() || !String(req.body.email || '').trim() || !String(req.body.password || '').trim()) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const role = await getAdminRole(transaction);
    const admin = await User.create({
      name: String(req.body.name).trim(),
      email: String(req.body.email).trim().toLowerCase(),
      company_id: req.body.company_id || null,
      role_id: role.id,
      password: hashPassword(req.body.password),
      status: normalizeStatus(req.body.status),
    }, { transaction });

    await transaction.commit();

    const created = await User.findByPk(admin.id, {
      attributes: publicUserAttributes,
      include: userIncludes,
    });

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: { ...serializeUser(created), role: 'admin' },
    });
  } catch (err) {
    await transaction.rollback();

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const transaction = await User.sequelize.transaction();

  try {
    const admin = await User.findByPk(req.params.id, { transaction });

    if (!admin) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const payload = {
      name: String(req.body.name ?? admin.name).trim(),
      email: String(req.body.email ?? admin.email).trim().toLowerCase(),
      company_id: req.body.company_id ?? admin.company_id,
      status: normalizeStatus(req.body.status ?? admin.status),
    };

    if (req.body.password) {
      payload.password = hashPassword(req.body.password);
    }

    await admin.update(payload, { transaction });
    await transaction.commit();

    const updated = await User.findByPk(admin.id, {
      attributes: publicUserAttributes,
      include: userIncludes,
    });

    return res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: { ...serializeUser(updated), role: 'admin' },
    });
  } catch (err) {
    await transaction.rollback();
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    return res.status(200).json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
