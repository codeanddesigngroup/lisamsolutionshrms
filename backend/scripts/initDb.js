require('dotenv').config({ quiet: true });

const sequelize = require('../src/config/db');
const Department = require('../src/models/Department');
const Designation = require('../src/models/Designation');
const Employee = require('../src/models/Employee');
const EmployeePermission = require('../src/models/EmployeePermission');
const ShiftType = require('../src/models/ShiftType');
const Company = require('../src/models/Company');
const Role = require('../src/models/Role');
const User = require('../src/models/User');
const AttendanceLogs = require('../src/models/AttendanceLogs');
const AttendanceRecords = require('../src/models/AttendanceRecords');
const LeaveType = require('../src/models/LeaveType');
const Leave = require('../src/models/Leave');
const LeaveQuota = require('../src/models/LeaveQuota');
const ClientDetail = require('../src/models/ClientDetail');
const Contract = require('../src/models/Contract');
const ContractType = require('../src/models/ContractType');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const ChatConversation = require('../src/models/ChatConversation');
const ChatMessage = require('../src/models/ChatMessage');
const Holiday = require('../src/models/Holiday');
const applyAssociations = require('../src/models/associations');

async function initDb() {
  try {
    applyAssociations();
    await Company.sync({ alter: true });
    await Role.sync({ alter: true });
    await User.sync({ alter: true });
    await ClientDetail.sync({ alter: true });
    await Contract.sync({ alter: true });
    await ContractType.sync({ alter: true });
    await ContractType.bulkCreate(
      [{ name: 'Fixed Price' }, { name: 'Hourly' }],
      { ignoreDuplicates: true },
    );
    await Project.sync({ alter: true });
    await Task.sync({ alter: true });
    await Department.sync({ alter: true });
    await Designation.sync({ alter: true });
    await ShiftType.sync({ alter: true });
    await Employee.sync({ alter: true });
    await AttendanceLogs.sync({ alter: true });
    await AttendanceRecords.sync({ alter: true });
    await EmployeePermission.sync({ alter: true });
    await LeaveType.sync({ alter: true });
    await Leave.sync({ alter: true });
    await LeaveQuota.sync({ alter: true });
    await Holiday.sync({ alter: true });
    await ChatConversation.sync({ alter: true });
    await ChatMessage.sync({ alter: true });
    console.log('Database schema synced');
    await sequelize.close();
  } catch (err) {
    console.error('Failed to sync database schema:', err);
    await sequelize.close();
    process.exit(1);
  }
}

initDb();
