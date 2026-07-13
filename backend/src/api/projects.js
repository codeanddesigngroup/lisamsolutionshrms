const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ClientDetail = require('../models/ClientDetail');
const Department = require('../models/Department');

const cleanPayload = (body, existing = {}) => {
  const withoutDeadline = body.without_deadline === true;
  return {
    company_id: body.company_id ?? existing.company_id ?? null,
    client_id: Number(body.client_id ?? body.client?.id ?? existing.client_id) || null,
    department_id: Number(body.department_id ?? existing.department_id) || null,
    project_name: String(body.project_name ?? existing.project_name ?? '').trim(),
    project_summary: String(body.project_summary ?? existing.project_summary ?? '').trim() || null,
    start_date: body.start_date ?? existing.start_date,
    deadline: withoutDeadline ? null : (body.deadline ?? existing.deadline ?? null),
    without_deadline: withoutDeadline,
    status: body.status ?? existing.status ?? 'not started',
  };
};

const validatePayload = (payload) => {
  if (!payload.project_name || !payload.start_date) return 'Project name and start date are required';
  if (!payload.without_deadline && !payload.deadline) return 'Deadline is required unless No Deadline is selected';
  if (payload.deadline && payload.deadline < payload.start_date) return 'Deadline must be on or after the start date';
  return null;
};

const withClients = async (projects) => {
  const ids = [...new Set(projects.map((project) => project.client_id).filter(Boolean))];
  const departmentIds = [...new Set(projects.map((project) => project.department_id).filter(Boolean))];
  const [clients, departments] = await Promise.all([
    ids.length ? ClientDetail.findAll({ where: { id: ids } }) : [],
    departmentIds.length ? Department.findAll({ where: { id: departmentIds } }) : [],
  ]);
  const byId = new Map(clients.map((client) => {
    const data = client.toJSON();
    return [Number(client.id), {
      id: data.id,
      name: data.name,
      email: data.email,
      status: data.status,
      client_detail: {
        company_name: data.company_name,
        website: data.website,
        mobile: data.mobile,
        address: data.address,
      },
    }];
  }));
  const departmentsById = new Map(departments.map((department) => [Number(department.id), department.toJSON()]));
  return projects.map((project) => ({
    ...project.toJSON(),
    client: project.client_id ? byId.get(Number(project.client_id)) || null : null,
    department: project.department_id ? departmentsById.get(Number(project.department_id)) || null : null,
    members: [],
  }));
};

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.company_id) where.company_id = req.query.company_id;
    if (req.query.client_id) where.client_id = req.query.client_id;
    const projects = await Project.findAll({ where, order: [['id', 'DESC']] });
    return res.json({ success: true, count: projects.length, data: await withClients(projects) });
  } catch (err) { return next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    const message = validatePayload(payload);
    if (message) return res.status(400).json({ success: false, message });
    const project = await Project.create(payload);
    const [data] = await withClients([project]);
    return res.status(201).json({ success: true, message: 'Project created successfully', data });
  } catch (err) { return next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const [data] = await withClients([project]);
    return res.json({ success: true, data });
  } catch (err) { return next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const payload = cleanPayload(req.body, project);
    const message = validatePayload(payload);
    if (message) return res.status(400).json({ success: false, message });
    await project.update(payload);
    const [data] = await withClients([project]);
    return res.json({ success: true, message: 'Project updated successfully', data });
  } catch (err) { return next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Project.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) { return next(err); }
});

module.exports = router;
