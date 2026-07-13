const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatConversation = sequelize.define('ChatConversation', {
  id: { type: DataTypes.STRING(100), primaryKey: true },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  tableName: 'chat_conversations',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['company_id'] }],
});

module.exports = ChatConversation;
