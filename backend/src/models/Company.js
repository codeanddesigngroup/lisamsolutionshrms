const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },

  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },

  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  website: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']],
    },
  },
}, {
  tableName: 'companies',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Company;
