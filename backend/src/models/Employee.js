const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Employee = sequelize.define('Employee', {
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
    type: DataTypes.STRING(50),
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  gender: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  designation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  shift_type_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  joining_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  hourly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },

  mobile: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },

  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'deactive']],
    },
  },

  login: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'enable',
    validate: {
      isIn: [['enable', 'disable']],
    },
  },
}, {
  tableName: 'employees',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'employee_id'],
    },
    {
      unique: true,
      fields: ['company_id', 'email'],
    },
  ],
});

module.exports = Employee;
