const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const Employee = require('../models/Employee');
const EmployeePermission = require('../models/EmployeePermission');
const { emitToChatRooms, emitToCompany } = require('../realtime/socket');

const serialize = (record) => ({ ...record.payload, id: record.id, company_id: record.company_id });

const uniqueList = (items) =>
  Array.from(new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean)));

const hasMessagesViewAccess = (permissions) =>
  Array.isArray(permissions) && permissions.some((permission) => permission === '*' || permission === 'messages.*' || permission === 'messages.view');

const filterGroupMessageParticipants = async (payload, companyId) => {
  if (payload.type !== 'group') return payload;

  const participantKeys = uniqueList(payload.participant_keys);
  const employeeIds = participantKeys
    .filter((key) => key.startsWith('employee:'))
    .map((key) => Number(key.split(':')[1]))
    .filter((id) => Number.isInteger(id) && id > 0);

  const validEmployeeIds = new Set();
  if (employeeIds.length > 0) {
    const employees = await Employee.findAll({
      where: { id: { [Op.in]: employeeIds }, company_id: companyId },
      attributes: ['id'],
    });
    const companyEmployeeIds = employees.map((employee) => Number(employee.id));
    const permissions = await EmployeePermission.findAll({
      where: { employee_id: { [Op.in]: companyEmployeeIds } },
      attributes: ['employee_id', 'permission_keys'],
    });

    permissions.forEach((record) => {
      if (hasMessagesViewAccess(record.permission_keys)) {
        validEmployeeIds.add(Number(record.employee_id));
      }
    });
  }

  const creatorKey = String(payload.created_by || '');
  const allowedParticipantKeys = participantKeys.filter((key) => {
    if (key === creatorKey) return true;
    if (!key.startsWith('employee:')) return true;
    const employeeId = Number(key.split(':')[1]);
    return validEmployeeIds.has(employeeId);
  });

  return {
    ...payload,
    participant_keys: allowedParticipantKeys,
    participants: Array.isArray(payload.participants)
      ? payload.participants.filter((participant) => allowedParticipantKeys.includes(String(participant?.key || '')))
      : payload.participants,
    unread_by: uniqueList(payload.unread_by).filter((key) => allowedParticipantKeys.includes(key) && key !== creatorKey),
  };
};

const buildGroupCreatedMessage = (conversation) => {
  const payload = conversation.payload || {};
  const createdAt = payload.created_at || new Date().toISOString();
  const creatorKey = String(payload.created_by || '');
  const participantKeys = uniqueList(payload.participant_keys);
  const creator = Array.isArray(payload.participants)
    ? payload.participants.find((participant) => participant?.key === creatorKey)
    : null;
  const creatorName = String(creator?.name || 'Someone').trim();

  return {
    id: `system-${conversation.id}-created`,
    company_id: conversation.company_id,
    conversation_id: conversation.id,
    payload: {
      id: `system-${conversation.id}-created`,
      conversation_id: conversation.id,
      sender_key: 'system',
      sender_name: 'System',
      body: `${creatorName} created ${payload.name || 'this group'}.`,
      attachments: [],
      reactions: [],
      status_by: Object.fromEntries(participantKeys.map((key) => [key, key === creatorKey ? 'seen' : 'delivered'])),
      created_at: createdAt,
    },
  };
};

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
    let payload = { ...req.body }; delete payload.company_id;
    payload = await filterGroupMessageParticipants(payload, companyId);
    const [row, created] = await ChatConversation.findOrCreate({
      where: { id: String(req.body.id) },
      defaults: { company_id: companyId, payload },
    });

    if (row.company_id !== companyId) {
      return res.status(403).json({ success: false, message: 'Conversation belongs to another company' });
    }

    if (!created) {
      await row.update({ payload: { ...(row.payload || {}), ...payload, id: row.id } });
    }

    let systemMessage = null;
    if (payload.type === 'group' && row.company_id === companyId) {
      const participantKeys = uniqueList(row.payload?.participant_keys);
      const creatorKey = String(row.payload?.created_by || '');
      const unreadBy = uniqueList([...(row.payload?.unread_by || []), ...participantKeys.filter((key) => key !== creatorKey)]);
      const messageDefaults = buildGroupCreatedMessage(row);
      const [messageRow] = await ChatMessage.findOrCreate({
        where: { id: messageDefaults.id },
        defaults: messageDefaults,
      });

      await row.update({
        payload: {
          ...(row.payload || {}),
          unread_by: unreadBy,
          last_message: messageDefaults.payload.body,
          last_message_at: messageDefaults.payload.created_at,
        },
      });
      systemMessage = { ...messageRow.payload, id: messageRow.id, conversation_id: messageRow.conversation_id, company_id: messageRow.company_id };
    }

    const data = serialize(row);
    emitToCompany(companyId, created ? 'conversation:created' : 'conversation:updated', { conversation: data });
    if (systemMessage) {
      emitToChatRooms(companyId, row.id, 'message:created', { message: systemMessage, conversation: data });
      emitToChatRooms(companyId, row.id, 'conversation:updated', { conversation: data });
    }
    return res.status(created ? 201 : 200).json({ success: true, data });
  } catch (err) { return next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const row = await ChatConversation.findByPk(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Conversation not found' });
    let payload = { ...req.body, id: row.id }; delete payload.company_id;
    payload = await filterGroupMessageParticipants(payload, row.company_id);
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
