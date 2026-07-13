const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ContractType = sequelize.define('ContractType', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
}, {
  tableName: 'contract_types',
  timestamps: false,
});

module.exports = ContractType;
