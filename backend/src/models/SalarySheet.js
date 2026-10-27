const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SalarySheet = sequelize.define('SalarySheet', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  department_id: { type: DataTypes.INTEGER, allowNull: false },
  department_name: { type: DataTypes.STRING(150), allowNull: false },
  employee_id: { type: DataTypes.INTEGER, allowNull: false },
  employee_name: { type: DataTypes.STRING(150), allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  values: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  totals: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  template_id: { type: DataTypes.STRING(100), allowNull: true },
  template_name: { type: DataTypes.STRING(200), allowNull: false },
}, {
  tableName: 'salary_sheets',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id', 'month', 'year'] },
    { unique: true, fields: ['company_id', 'department_id', 'employee_id', 'month', 'year'] },
  ],
});

module.exports = SalarySheet;
