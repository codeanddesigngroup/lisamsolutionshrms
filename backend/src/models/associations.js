const Department = require('./Department');
const Designation = require('./Designation');
const Employee = require('./Employee');
const EmployeePermission = require('./EmployeePermission');
const ShiftType = require('./ShiftType');
const Company = require('./Company');
const Role = require('./Role');
const User = require('./User');
const AttendanceRecords = require('./AttendanceRecords');
const Leave = require('./Leave');
const LeaveType = require('./LeaveType');
const LeaveQuota = require('./LeaveQuota');

const applyAssociations = () => {
  if (!Employee.associations.company) {
    Employee.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  }

  if (!Employee.associations.designation) {
    Employee.belongsTo(Designation, { foreignKey: 'designation_id', as: 'designation' });
  }

  if (!Employee.associations.department) {
    Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
  }

  if (!Employee.associations.shift_type) {
    Employee.belongsTo(ShiftType, { foreignKey: 'shift_type_id', as: 'shift_type' });
  }

  if (!Employee.associations.permission_record) {
    Employee.hasOne(EmployeePermission, { foreignKey: 'employee_id', as: 'permission_record', onDelete: 'CASCADE' });
  }

  if (!EmployeePermission.associations.employee) {
    EmployeePermission.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', onDelete: 'CASCADE' });
  }

  if (!User.associations.company) {
    User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  }

  if (!User.associations.role_record) {
    User.belongsTo(Role, { foreignKey: 'role_id', as: 'role_record' });
  }

  if (!Company.associations.users) {
    Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });
  }

  if (!Role.associations.users) {
    Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  }

  if (!Company.associations.employees) {
    Company.hasMany(Employee, { foreignKey: 'company_id', as: 'employees' });
  }

  if (!Company.associations.departments) {
    Company.hasMany(Department, { foreignKey: 'company_id', as: 'departments' });
  }

  if (!Department.associations.company) {
    Department.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  }

  if (!Company.associations.designations) {
    Company.hasMany(Designation, { foreignKey: 'company_id', as: 'designations' });
  }

  if (!Designation.associations.company) {
    Designation.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  }

  if (!Company.associations.shifts) {
    Company.hasMany(ShiftType, { foreignKey: 'company_id', as: 'shifts' });
  }

  if (!ShiftType.associations.company) {
    ShiftType.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  }

  if (!Company.associations.attendance_records) {
    Company.hasMany(AttendanceRecords, { foreignKey: 'company_id', as: 'attendance_records' });
  }

  if (!AttendanceRecords.associations.company) {
    AttendanceRecords.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  }

  if (!Leave.associations.employee) {
    Leave.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });
  }

  if (!Leave.associations.leave_type) {
    Leave.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leave_type', constraints: false });
  }

  if (!Employee.associations.leaves) {
    Employee.hasMany(Leave, { foreignKey: 'employee_id', as: 'leaves', constraints: false });
  }

  if (!LeaveType.associations.leaves) {
    LeaveType.hasMany(Leave, { foreignKey: 'leave_type_id', as: 'leaves', constraints: false });
  }

  if (!LeaveQuota.associations.employee) {
    LeaveQuota.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee', constraints: false });
  }

  if (!LeaveQuota.associations.leave_type) {
    LeaveQuota.belongsTo(LeaveType, { foreignKey: 'leave_type_id', as: 'leave_type', constraints: false });
  }
};

module.exports = applyAssociations;
