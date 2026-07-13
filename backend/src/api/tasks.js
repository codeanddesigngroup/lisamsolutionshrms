const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const Designation = require('../models/Designation');

const cleanPayload = (body, existing = {}) => ({
  company_id: body.company_id ?? existing.company_id ?? null,
  project_id: Number(body.project_id ?? body.project?.id ?? existing.project_id) || null,
  assigned_employee_id: Number(body.assigned_employee_id ?? body.assigned_user_id ?? body.task_users?.[0]?.id ?? existing.assigned_employee_id),
  designation_id: Number(body.designation_id ?? body.category_id ?? body.category?.id ?? existing.designation_id) || null,
  heading: String(body.heading ?? existing.heading ?? '').trim(),
  start_date: body.start_date || existing.start_date || null,
  due_date: body.due_date ?? existing.due_date,
  priority: body.priority ?? existing.priority ?? 'medium',
  status: body.status ?? existing.status ?? 'incomplete',
  label: String(body.label ?? existing.label ?? '').trim() || null,
  description: String(body.description ?? existing.description ?? '').trim() || null,
});

const validate = (payload) => {
  if (!payload.heading || !payload.assigned_employee_id || !payload.due_date) return 'Task title, assigned employee, and due date are required';
  if (payload.start_date && payload.due_date < payload.start_date) return 'Due date must be on or after the start date';
  return null;
};

const hydrate = async (tasks) => {
  const projectIds = [...new Set(tasks.map((task) => task.project_id).filter(Boolean))];
  const employeeIds = [...new Set(tasks.map((task) => task.assigned_employee_id).filter(Boolean))];
  const designationIds = [...new Set(tasks.map((task) => task.designation_id).filter(Boolean))];
  const [projects, employees, designations] = await Promise.all([
    projectIds.length ? Project.findAll({ where: { id: projectIds } }) : [],
    employeeIds.length ? Employee.findAll({ where: { id: employeeIds }, attributes: { exclude: ['password'] } }) : [],
    designationIds.length ? Designation.findAll({ where: { id: designationIds } }) : [],
  ]);
  const projectMap = new Map(projects.map((item) => [Number(item.id), item.toJSON()]));
  const employeeMap = new Map(employees.map((item) => [Number(item.id), item.toJSON()]));
  const designationMap = new Map(designations.map((item) => [Number(item.id), item.toJSON()]));
  return tasks.map((task) => ({
    ...task.toJSON(),
    project: task.project_id ? projectMap.get(Number(task.project_id)) || null : null,
    users: task.assigned_employee_id ? [employeeMap.get(Number(task.assigned_employee_id))].filter(Boolean) : [],
    category: task.designation_id ? designationMap.get(Number(task.designation_id)) || null : null,
  }));
};

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.company_id) where.company_id = req.query.company_id;
    if (req.query.user_id) where.assigned_employee_id = req.query.user_id;
    const tasks = await Task.findAll({ where, order: [['id', 'DESC']] });
    return res.json({ success: true, count: tasks.length, data: await hydrate(tasks) });
  } catch (err) { return next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    const message = validate(payload);
    if (message) return res.status(400).json({ success: false, message });
    const task = await Task.create(payload);
    const [data] = await hydrate([task]);
    return res.status(201).json({ success: true, message: 'Task created successfully', data });
  } catch (err) { return next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const [data] = await hydrate([task]);
    return res.json({ success: true, data });
  } catch (err) { return next(err); }
});

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const payload = cleanPayload(req.body, task);
    const message = validate(payload);
    if (message) return res.status(400).json({ success: false, message });
    await task.update(payload);
    const [data] = await hydrate([task]);
    return res.json({ success: true, message: 'Task updated successfully', data });
  } catch (err) { return next(err); }
};
router.put('/:id', updateTask);
router.patch('/:id', updateTask);

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Task.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { return next(err); }
});

module.exports = router;
