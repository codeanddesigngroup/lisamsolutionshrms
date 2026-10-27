require('dotenv').config({ quiet: true });

const sequelize = require('../src/config/db');
const SalarySheet = require('../src/models/SalarySheet');

async function createSalarySheetsTable() {
  try {
    await sequelize.authenticate();
    await SalarySheet.sync();
    console.log('Salary sheets table is ready');
  } catch (error) {
    console.error('Failed to create salary sheets table:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

createSalarySheetsTable();
