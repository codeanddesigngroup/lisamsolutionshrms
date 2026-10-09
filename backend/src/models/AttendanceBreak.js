const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttendanceBreak = sequelize.define('AttendanceBreak', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'employee_id',
  },
  employeeRecordId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'employee_record_id',
  },
  employeeName: {
    type: DataTypes.STRING(150),
    allowNull: true,
    field: 'employee_name',
  },
  workDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'work_date',
  },
  breakStart: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'break_start',
  },
  breakEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'break_end',
  },
  breakCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'break_count',
  },
  totalBreakMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_break_minutes',
  },
  breakSessions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    field: 'break_sessions',
  },
}, {
  tableName: 'attendance_breaks',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['company_id'] },
    { fields: ['employee_id'] },
    { fields: ['work_date'] },
    { fields: ['company_id', 'employee_id', 'work_date'] },
  ],
});

module.exports = AttendanceBreak;
