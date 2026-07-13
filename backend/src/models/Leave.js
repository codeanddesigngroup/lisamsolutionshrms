const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Leave = sequelize.define('Leave', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  leave_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  leave_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  duration: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'single',
  },

  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'cancelled']],
    },
  },

  action_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'leaves',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['employee_id'] },
    { fields: ['leave_date'] },
    { fields: ['status'] },
  ],
});

module.exports = Leave;
