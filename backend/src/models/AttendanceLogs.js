const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttendanceLogs = sequelize.define('AttendanceLogs', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'employee_id',
  },

  punchTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'punch_time',
  },

  deviceSerial: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'device_serial',
  },
}, {
  tableName: 'attendance_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = AttendanceLogs;
