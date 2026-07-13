const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ClientDetail = sequelize.define('ClientDetail', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name: { type: DataTypes.STRING(150), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  company_name: { type: DataTypes.STRING(200), allowNull: true },
  website: { type: DataTypes.STRING(500), allowNull: true },
  mobile: { type: DataTypes.STRING(50), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: { isIn: [['active', 'deactive']] },
  },
}, {
  tableName: 'client_details',
  timestamps: false,
});

module.exports = ClientDetail;
