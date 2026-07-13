const { Server } = require('socket.io');

let io;

const companyRoom = (companyId) => `company:${companyId}`;
const conversationRoom = (conversationId) => `conversation:${conversationId}`;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('chat:join-company', ({ company_id }) => {
      const companyId = Number(company_id);
      if (Number.isInteger(companyId) && companyId > 0) {
        socket.join(companyRoom(companyId));
      }
    });

    socket.on('chat:join-conversations', ({ conversation_ids }) => {
      if (!Array.isArray(conversation_ids)) return;
      conversation_ids
        .filter((id) => id !== undefined && id !== null && String(id).trim())
        .forEach((id) => socket.join(conversationRoom(String(id))));
    });

    socket.on('chat:leave-conversations', ({ conversation_ids }) => {
      if (!Array.isArray(conversation_ids)) return;
      conversation_ids
        .filter((id) => id !== undefined && id !== null && String(id).trim())
        .forEach((id) => socket.leave(conversationRoom(String(id))));
    });
  });

  return io;
};

const emitToCompany = (companyId, event, payload) => {
  if (!io || !companyId) return;
  io.to(companyRoom(companyId)).emit(event, payload);
};

const emitToConversation = (conversationId, event, payload) => {
  if (!io || !conversationId) return;
  io.to(conversationRoom(String(conversationId))).emit(event, payload);
};

const emitToChatRooms = (companyId, conversationId, event, payload) => {
  if (!io || !conversationId) return;
  const target = io.to(conversationRoom(String(conversationId)));
  if (companyId) target.to(companyRoom(companyId));
  target.emit(event, payload);
};

module.exports = {
  initSocket,
  emitToCompany,
  emitToConversation,
  emitToChatRooms,
};
