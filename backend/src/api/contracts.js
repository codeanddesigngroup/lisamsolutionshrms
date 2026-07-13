const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');

const cleanPayload = (body, existing = {}) => ({
  company_id: body.company_id ?? existing.company_id ?? null,
  client_id: Number(body.client_id ?? body.client?.id ?? existing.client_id),
  contract_type_id: Number(body.contract_type_id ?? body.contract_type?.id ?? existing.contract_type_id) || null,
  subject: String(body.subject ?? existing.subject ?? '').trim(),
  amount: Number(body.amount ?? existing.amount ?? 0),
  start_date: body.start_date ?? existing.start_date,
  end_date: body.end_date ?? existing.end_date,
  description: String(body.description ?? existing.description ?? '').trim() || null,
});

const validatePayload = (payload) => {
  if (!payload.subject || !payload.client_id || !payload.start_date || !payload.end_date) return 'Subject, client, start date, and end date are required';
  if (!Number.isFinite(payload.amount) || payload.amount < 0) return 'Amount must be a valid non-negative number';
  if (payload.end_date < payload.start_date) return 'End date must be on or after start date';
  return null;
};

router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.company_id) where.company_id = req.query.company_id;
    const contracts = await Contract.findAll({ where, order: [['id', 'DESC']] });
    return res.json({ success: true, count: contracts.length, data: contracts });
  } catch (err) { return next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    const message = validatePayload(payload);
    if (message) return res.status(400).json({ success: false, message });
    const contract = await Contract.create(payload);
    return res.status(201).json({ success: true, message: 'Contract created successfully', data: contract });
  } catch (err) { return next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    return res.json({ success: true, data: contract });
  } catch (err) { return next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    const payload = cleanPayload(req.body, contract);
    const message = validatePayload(payload);
    if (message) return res.status(400).json({ success: false, message });
    await contract.update(payload);
    return res.json({ success: true, message: 'Contract updated successfully', data: contract });
  } catch (err) { return next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Contract.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Contract not found' });
    return res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (err) { return next(err); }
});

module.exports = router;
