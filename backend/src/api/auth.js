const crypto = require('crypto');
const express = require('express');
const router = express.Router();

const Company = require('../models/Company');
const Employee = require('../models/Employee');
const EmployeePermission = require('../models/EmployeePermission');
const Role = require('../models/Role');
const User = require('../models/User');
const applyAssociations = require('../models/associations');
const { verifyPassword } = require('../utils/password');

applyAssociations();

const normalizeRole = (roleName = '') => {
  const role = String(roleName).trim().toLowerCase();
  if (role === 'super admin' || role === 'super_admin' || role === 'super-admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  if (role === 'client') return 'client';
  return 'employee';
};

const createToken = () => crypto.randomBytes(48).toString('hex');

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: 'role_record' },
        { model: Company, as: 'company' },
      ],
    });

    if (!user) {
      const employee = await Employee.findOne({
        where: { email },
        include: [
          { model: Company, as: 'company' },
          { model: EmployeePermission, as: 'permission_record' },
        ],
      });

      if (!employee || !verifyPassword(password, employee.password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (employee.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive',
        });
      }

      if (employee.login !== 'enable') {
        return res.status(403).json({
          success: false,
          message: 'Login is disabled for your account',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          token: createToken(),
          user: {
            id: employee.id,
            employee_id: employee.employee_id,
            name: employee.name,
            email: employee.email,
            role: 'employee',
            company_id: employee.company_id,
            permissions: employee.permission_record?.permission_keys || [],
          },
        },
      });
    }

    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive',
      });
    }

    const role = normalizeRole(user.role_record?.name);
    await user.update({ last_login_at: new Date() });

    return res.status(200).json({
      success: true,
      data: {
        token: createToken(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
          company_id: user.company_id,
          modules: role === 'super_admin' ? ['platform'] : undefined,
          permissions: role === 'super_admin' ? ['*'] : undefined,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
