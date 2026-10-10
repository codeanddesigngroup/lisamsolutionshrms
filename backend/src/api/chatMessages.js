const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const ChatConversation = require('../models/ChatConversation');
const { emitToChatRooms } = require('../realtime/socket');

const serialize = (record) => ({ ...record.payload, id: record.id, conversation_id: record.conversation_id, company_id: record.company_id });
const serializeConversation = (record) => ({ ...record.payload, id: record.id, company_id: record.company_id });
const uniqueList = (items) =>
  Array.from(new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean)));

const participantAliasKeys = (participant) => {
  if (!participant) return [];
  const type = String(participant.type || '').trim();
  if (type !== 'employee') return uniqueList([participant.key]);

  return uniqueList([
    participant.key,
    participant.id !== undefined && participant.id !== null ? `employee:${participant.id}` : '',
    participant.employeeCode !== undefined && participant.employeeCode !== null ? `employee:${participant.employeeCode}` : '',
    participant.employee_id !== undefined && participant.employee_id !== null ? `employee:${participant.employee_id}` : '',
    participant.employeeId !== undefined && participant.employeeId !== null ? `employee:${participant.employeeId}` : '',
  ]);
};

const conversationParticipantKeys = (payload = {}) =>
  uniqueList([
    ...(Array.isArray(payload.participant_keys) ? payload.participant_keys : []),
    ...(Array.isArray(payload.participants) ? payload.participants.flatMap(participantAliasKeys) : []),
  ]);

router.get('/', async (req, res, next) => {
  try {
    const companyId = Number(req.query.company_id || req.query.companyId);
    if (!Number.isInteger(companyId) || companyId <= 0) return res.status(400).json({ success: false, message: 'A valid company is required' });
    const where = { company_id: companyId };
    if (req.query.conversation_id) where.conversation_id = String(req.query.conversation_id);
    const rows = await ChatMessage.findAll({ where, order: [['created_at', 'ASC']] });
    return res.json({ success: true, data: rows.map(serialize) });
  } catch (err) { return next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const companyId = Number(req.body.company_id);
    if (!req.body.id || !req.body.conversation_id || !Number.isInteger(companyId) || companyId <= 0) return res.status(400).json({ success: false, message: 'Message ID, conversation, and company are required' });
    const payload = { ...req.body }; delete payload.company_id;
    const senderKeys = Array.from(new Set([payload.sender_key, ...(Array.isArray(payload.sender_alias_keys) ? payload.sender_alias_keys : [])].map((key) => String(key || '').trim()).filter(Boolean)));
    delete payload.sender_alias_keys;
    const row = await ChatMessage.create({ id: String(req.body.id), company_id: companyId, conversation_id: String(req.body.conversation_id), payload });
    const conversation = await ChatConversation.findByPk(String(req.body.conversation_id));
    let updatedConversation = null;
    if (conversation && conversation.company_id === companyId) {
      const conversationPayload = conversation.payload || {};
      const participantKeys = conversationParticipantKeys(conversationPayload);
      await conversation.update({
        payload: {
          ...conversationPayload,
          last_message: payload.attachments?.length ? payload.attachments[0]?.name : payload.body,
          last_message_at: payload.created_at || new Date().toISOString(),
          participant_keys: participantKeys,
          unread_by: participantKeys.filter((key) => !senderKeys.includes(key)),
          archived_by: (conversationPayload.archived_by || []).filter((key) => !senderKeys.includes(key)),
        },
      });
      updatedConversation = serializeConversation(conversation);
    }
    const data = serialize(row);
    emitToChatRooms(companyId, row.conversation_id, 'message:created', { message: data, conversation: updatedConversation });
    if (updatedConversation) {
      emitToChatRooms(companyId, row.conversation_id, 'conversation:updated', { conversation: updatedConversation });
    }
    return res.status(201).json({ success: true, data });
  } catch (err) { return next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const row = await ChatMessage.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Message not found' });
    const payload = { ...req.body, id: row.id, conversation_id: row.conversation_id }; delete payload.company_id;
    await row.update({ payload });
    const data = serialize(row);
    emitToChatRooms(row.company_id, row.conversation_id, 'message:updated', { message: data });
    return res.json({ success: true, data });
  } catch (err) { return next(err); }
});

module.exports = router;
