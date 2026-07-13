const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AttendanceRecords = sequelize.define('AttendanceRecords', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },

  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'employee_id',
  },

  workDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'work_date',
  },

  checkIn: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'check_in',
  },

  checkOut: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'check_out',
  },

  workedHours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'worked_hours',
  },

}, {
  tableName: 'attendance_records',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'attendance_records_company_employee_date_unique',
      unique: true,
      fields: ['company_id', 'employee_id', 'work_date'],
    },
    {
      name: 'idx_attendance_records_company_id',
      fields: ['company_id'],
    },
    {
      name: 'idx_attendance_records_employee_id',
      fields: ['employee_id'],
    },
    {
      name: 'idx_attendance_records_work_date',
      fields: ['work_date'],
    },
    {
      name: 'idx_attendance_records_company_date',
      fields: ['company_id', 'work_date'],
    },
  ],
});

module.exports = AttendanceRecords;
