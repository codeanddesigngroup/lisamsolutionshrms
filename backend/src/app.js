const express = require('express');
const cors = require('cors');
const attendance = require('./api/attendance');
const employees = require('./api/employees');
const shifts = require('./api/shifts');
const departments = require('./api/departments');
const designations = require('./api/designations');
const leaves = require('./api/leaves');
const leaveTypes = require('./api/leaveTypes');
const leaveQuotas = require('./api/leaveQuotas');
const companies = require('./api/companies');
const devices = require('./api/devices');
const roles = require('./api/roles');
const users = require('./api/users');
const admins = require('./api/admins');
const auth = require('./api/auth');
const iclock= require('./api/iclock');
const clients = require('./api/clients');
const contracts = require('./api/contracts');
const contractTypes = require('./api/contractTypes');
const projects = require('./api/projects');
const tasks = require('./api/tasks');
const chatConversations = require('./api/chatConversations');
const chatMessages = require('./api/chatMessages');
const holidays = require('./api/holidays');

const app = express();

app.use(cors());

app.use('/api/iclock', express.text({ type: '*/*' }), iclock);
app.use('/iclock', express.text({ type: '*/*' }), iclock);

app.use(express.text({ type: ['text/*', 'application/octet-stream'] }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('HRMS Backend is Running');
});

app.use('/api/employees', employees);
app.use('/api/shifts', shifts);
app.use('/api/shift-types', shifts);
app.use('/api/departments', departments);
app.use('/api/designations', designations);
app.use('/api/leaves', leaves);
app.use('/api/leave', leaves);
app.use('/api/leave-types', leaveTypes);
app.use('/api/leaveType', leaveTypes);
app.use('/api/leave-quotas', leaveQuotas);
app.use('/api/companies', companies);
app.use('/api/devices', devices);
app.use('/api/roles', roles);
app.use('/api/users', users.router);
app.use('/api/admins', admins);
app.use('/api/auth', auth);
app.use('/api/client', clients);
app.use('/api/clients', clients);
app.use('/api/contracts', contracts);
app.use('/api/contract', contracts);
app.use('/api/contract-types', contractTypes);
app.use('/api/contract-type', contractTypes);
app.use('/api/projects', projects);
app.use('/api/project', projects);
app.use('/api/tasks', tasks);
app.use('/api/task', tasks);
app.use('/api/chat-conversations', chatConversations);
app.use('/api/chat-messages', chatMessages);
app.use('/api/holidays', holidays);
app.use('/api/holiday', holidays);
app.use('/api/v1/companies', companies);
app.use('/api/v1/devices', devices);
app.use('/api/v1/roles', roles);
app.use('/api/v1/users', users.router);
app.use('/api/v1/admins', admins);
app.use('/api/v1/auth', auth);
app.use('/api/v1/client', clients);
app.use('/api/v1/clients', clients);
app.use('/api/v1/contracts', contracts);
app.use('/api/v1/contract', contracts);
app.use('/api/v1/contract-types', contractTypes);
app.use('/api/v1/contract-type', contractTypes);
app.use('/api/v1/projects', projects);
app.use('/api/v1/project', projects);
app.use('/api/v1/tasks', tasks);
app.use('/api/v1/task', tasks);
app.use('/api/v1/chat-conversations', chatConversations);
app.use('/api/v1/chat-messages', chatMessages);
app.use('/api/v1/holidays', holidays);
app.use('/api/v1/holiday', holidays);
app.use('/api/v1/shifts', shifts);
app.use('/api/v1/shift-types', shifts);
app.use('/api/v1/departments', departments);
app.use('/api/v1/designations', designations);
app.use('/api/v1/leaves', leaves);
app.use('/api/v1/leave', leaves);
app.use('/api/v1/leave-types', leaveTypes);
app.use('/api/v1/leaveType', leaveTypes);
app.use('/api/v1/leave-quotas', leaveQuotas);
app.use('/api/v1/employees', employees);
app.use('/api/attendance', attendance);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
  });
});

module.exports = app;
