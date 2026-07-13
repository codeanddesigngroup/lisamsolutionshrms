const express = require('express');
const router = express.Router();

const Role = require('../models/Role');

router.get('/', async (req, res, next) => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    return res.status(200).json({ success: true, count: roles.length, data: roles });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();

    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const role = await Role.create({ name });
    return res.status(201).json({ success: true, message: 'Role created successfully', data: role });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Role already exists' });
    }

    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    await role.update({ name });
    return res.status(200).json({ success: true, message: 'Role updated successfully', data: role });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Role.destroy({ where: { id: req.params.id } });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    return res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
