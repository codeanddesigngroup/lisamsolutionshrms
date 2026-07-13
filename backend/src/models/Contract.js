const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Contract = sequelize.define('Contract', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.INTEGER, allowNull: true },
  client_id: { type: DataTypes.INTEGER, allowNull: false },
  contract_type_id: { type: DataTypes.INTEGER, allowNull: true },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'contracts',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Contract;
