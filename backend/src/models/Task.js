const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.INTEGER, allowNull: true },
  project_id: { type: DataTypes.INTEGER, allowNull: true },
  assigned_employee_id: { type: DataTypes.INTEGER, allowNull: false },
  designation_id: { type: DataTypes.INTEGER, allowNull: true },
  heading: { type: DataTypes.STRING(255), allowNull: false },
  start_date: { type: DataTypes.DATEONLY, allowNull: true },
  due_date: { type: DataTypes.DATEONLY, allowNull: false },
  priority: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'medium' },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'incomplete' },
  label: { type: DataTypes.STRING(50), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'tasks',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Task;
