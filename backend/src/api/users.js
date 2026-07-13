const express = require('express');
const router = express.Router();

const Company = require('../models/Company');
const Role = require('../models/Role');
const User = require('../models/User');
const applyAssociations = require('../models/associations');
const { hashPassword } = require('../utils/password');

applyAssociations();

const userIncludes = [
  { model: Company, as: 'company' },
  { model: Role, as: 'role_record' },
];

const publicUserAttributes = { exclude: ['password'] };

const normalizeStatus = (status) => (status === 'inactive' ? 'inactive' : 'active');

const normalizeRoleName = (value) => {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'super_admin' || role === 'super admin' || role === 'super-admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'client') return 'Client';
  return 'Employee';
};

const findOrCreateRole = async (roleValue, transaction) => {
  if (roleValue && Number(roleValue)) {
    const role = await Role.findByPk(roleValue, { transaction });
    if (role) return role;
  }

  const roleName = normalizeRoleName(roleValue);
  const [role] = await Role.findOrCreate({
    where: { name: roleName },
    defaults: { name: roleName },
    transaction,
  });
  return role;
};

const serializeUser = (user) => {
  const data = user.toJSON ? user.toJSON() : user;
  const roleName = data.role_record?.name || null;

  return {
    ...data,
    password: undefined,
    role: roleName ? roleName.toLowerCase().replace(/\s+/g, '_') : undefined,
    permissions: data.permissions || [],
    modules: data.modules || [],
  };
};

const buildUserPayload = async (body, existingUser, transaction) => {
  const role = await findOrCreateRole(body.role_id || body.role || existingUser?.role_id, transaction);
  const payload = {
    name: String(body.name ?? existingUser?.name ?? '').trim(),
    email: String(body.email ?? existingUser?.email ?? '').trim().toLowerCase(),
    company_id: body.company_id ?? existingUser?.company_id ?? null,
    role_id: role.id,
    status: normalizeStatus(body.status ?? existingUser?.status),
  };

  if (body.password) {
    payload.password = hashPassword(body.password);
  }

  return payload;
};

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.company_id) where.company_id = req.query.company_id;
    if (req.query.role_id) where.role_id = req.query.role_id;
    if (req.query.status) where.status = req.query.status;

    const users = await User.findAll({
      where,
      attributes: publicUserAttributes,
      include: userIncludes,
      order: [['id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(serializeUser),
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

    const payload = await buildUserPayload(req.body, null, transaction);
    const user = await User.create(payload, { transaction });
    await transaction.commit();

    const created = await User.findByPk(user.id, {
      attributes: publicUserAttributes,
      include: userIncludes,
    });

    return res.status(201).json({ success: true, message: 'User created successfully', data: serializeUser(created) });
  } catch (err) {
    await transaction.rollback();

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: publicUserAttributes,
      include: userIncludes,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: serializeUser(user) });
  } catch (err) {
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const transaction = await User.sequelize.transaction();

  try {
    const user = await User.findByPk(req.params.id, { transaction });

    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const payload = await buildUserPayload(req.body, user, transaction);
    if (!payload.name || !payload.email) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    await user.update(payload, { transaction });
    await transaction.commit();

    const updated = await User.findByPk(user.id, {
      attributes: publicUserAttributes,
      include: userIncludes,
    });

    return res.status(200).json({ success: true, message: 'User updated successfully', data: serializeUser(updated) });
  } catch (err) {
    await transaction.rollback();
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = {
  router,
  serializeUser,
  userIncludes,
  publicUserAttributes,
};
