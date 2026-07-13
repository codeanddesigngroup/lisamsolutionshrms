const express = require('express');
const router = express.Router();
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const { emitToCompany } = require('../realtime/socket');

const serialize = (record) => ({ ...record.payload, id: record.id, company_id: record.company_id });

router.get('/', async (req, res, next) => {
  try {
    const companyId = Number(req.query.company_id || req.query.companyId);
    if (!Number.isInteger(companyId) || companyId <= 0) return res.status(400).json({ success: false, message: 'A valid company is required' });
    const rows = await ChatConversation.findAll({ where: { company_id: companyId }, order: [['updated_at', 'DESC']] });
    return res.json({ success: true, data: rows.map(serialize) });
  } catch (err) { return next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const companyId = Number(req.body.company_id);
    if (!req.body.id || !Number.isInteger(companyId) || companyId <= 0) return res.status(400).json({ success: false, message: 'Conversation ID and company are required' });
    const payload = { ...req.body }; delete payload.company_id;
    const [row, created] = await ChatConversation.findOrCreate({
      where: { id: String(req.body.id) },
      defaults: { company_id: companyId, payload },
    });
    const data = serialize(row);
    emitToCompany(companyId, created ? 'conversation:created' : 'conversation:updated', { conversation: data });
    return res.status(created ? 201 : 200).json({ success: true, data });
  } catch (err) { return next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const row = await ChatConversation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Conversation not found' });
    const payload = { ...req.body, id: row.id }; delete payload.company_id;
    await row.update({ payload });
    const data = serialize(row);
    emitToCompany(row.company_id, 'conversation:updated', { conversation: data });
    return res.json({ success: true, data });
  } catch (err) { return next(err); }
});

router.delete('/:id', async (req, res, next) => {
  const transaction = await ChatConversation.sequelize.transaction();
  try {
    const conversation = await ChatConversation.findByPk(req.params.id, { transaction });
    if (!conversation) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    const actorKey = String(req.body?.actor_key || '');
    const actorRole = String(req.body?.actor_role || '');
    const createdBy = String(conversation.payload?.created_by || '');
    if (actorRole !== 'admin' && (!actorKey || actorKey !== createdBy)) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'You can only delete groups you created' });
    }
    await ChatMessage.destroy({ where: { conversation_id: req.params.id }, transaction });
    await conversation.destroy({ transaction });
    await transaction.commit();
    emitToCompany(conversation.company_id, 'conversation:deleted', { conversation_id: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    await transaction.rollback();
    return next(err);
  }
});

module.exports = router;
