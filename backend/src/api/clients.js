const express = require('express');
const router = express.Router();
const ClientDetail = require('../models/ClientDetail');

const serializeClient = (client) => ({
  ...(client.toJSON ? client.toJSON() : client),
  status: client.status,
  client_detail: {
    company_name: client.company_name,
    website: client.website,
    mobile: client.mobile,
    address: client.address,
  },
});

const cleanPayload = (body, existing = {}) => {
  const details = body.client_detail || body;
  return {
    company_id: body.company_id ?? existing.company_id ?? null,
    name: String(body.name ?? existing.name ?? '').trim(),
    email: String(body.email ?? existing.email ?? '').trim().toLowerCase(),
    company_name: String(details.company_name ?? existing.company_name ?? '').trim() || null,
    website: String(details.website ?? existing.website ?? '').trim() || null,
    mobile: String(details.mobile ?? existing.mobile ?? '').trim() || null,
    address: String(details.address ?? existing.address ?? '').trim() || null,
    status: body.status === 'active' || body.status === 'deactive'
      ? body.status
      : (existing.status || 'active'),
  };
};

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const perPage = Math.min(Math.max(Number.parseInt(req.query.per_page, 10) || 10, 1), 100);
    const where = {};
    if (req.query.company_id) where.company_id = req.query.company_id;
    const { count, rows } = await ClientDetail.findAndCountAll({
      where, order: [['id', 'DESC']], limit: perPage, offset: (page - 1) * perPage,
    });
    return res.json({
      success: true,
      data: rows.map(serializeClient),
      meta: { current_page: page, last_page: Math.max(Math.ceil(count / perPage), 1), per_page: perPage, total: count },
    });
  } catch (err) { return next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    if (!payload.name || !payload.email) return res.status(400).json({ success: false, message: 'Name and a valid email are required' });
    const client = await ClientDetail.create(payload);
    return res.status(201).json({ success: true, message: 'Client created successfully', data: serializeClient(client) });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'Email already exists' });
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const client = await ClientDetail.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    return res.json({ success: true, data: serializeClient(client) });
  } catch (err) { return next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const client = await ClientDetail.findByPk(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    const payload = cleanPayload(req.body, client);
    if (!payload.name || !payload.email) return res.status(400).json({ success: false, message: 'Name and email are required' });
    await client.update(payload);
    return res.json({ success: true, message: 'Client updated successfully', data: serializeClient(client) });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ success: false, message: 'Email already exists' });
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await ClientDetail.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Client not found' });
    return res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) { return next(err); }
});

module.exports = router;
