const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const EmployeePermission = sequelize.define('EmployeePermission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  permission_keys: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
}, {
  tableName: 'employee_permissions',
  timestamps: false,
  indexes: [
    {
      name: 'employee_permissions_employee_unique',
      unique: true,
      fields: ['employee_id'],
    },
    {
      name: 'idx_employee_permissions_employee_id',
      fields: ['employee_id'],
    },
  ],
});

module.exports = EmployeePermission;
