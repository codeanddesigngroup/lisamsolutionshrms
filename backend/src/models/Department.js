const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
}, {
  tableName: 'departments',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'name'],
    },
  ],
});

module.exports = Department;
