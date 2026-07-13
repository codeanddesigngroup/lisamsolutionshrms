const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: { type: DataTypes.INTEGER, allowNull: true },
  client_id: { type: DataTypes.INTEGER, allowNull: true },
  department_id: { type: DataTypes.INTEGER, allowNull: true },
  project_name: { type: DataTypes.STRING(255), allowNull: false },
  project_summary: { type: DataTypes.TEXT, allowNull: true },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  deadline: { type: DataTypes.DATEONLY, allowNull: true },
  without_deadline: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'not started',
    validate: { isIn: [['not started', 'in progress', 'on hold', 'canceled', 'finished']] },
  },
}, {
  tableName: 'projects',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Project;
