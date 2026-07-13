const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LeaveType = sequelize.define('LeaveType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  type_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  no_of_leaves: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  },

  paid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },

  color: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'info',
  },
}, {
  tableName: 'leave_types',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'type_name'],
    },
  ],
});

module.exports = LeaveType;
