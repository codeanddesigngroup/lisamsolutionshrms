const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LeaveQuota = sequelize.define('LeaveQuota', {
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
    allowNull: false,
  },

  no_of_leaves: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'leave_quotas',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'employee_id', 'leave_type_id'],
    },
  ],
});

module.exports = LeaveQuota;
