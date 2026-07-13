const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatMessage = sequelize.define('ChatMessage', {
  id: { type: DataTypes.STRING(100), primaryKey: true },
  company_id: { type: DataTypes.INTEGER, allowNull: false },
  conversation_id: { type: DataTypes.STRING(100), allowNull: false },
  payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
}, {
  tableName: 'chat_messages',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['company_id'] }, { fields: ['conversation_id'] }],
});

module.exports = ChatMessage;
