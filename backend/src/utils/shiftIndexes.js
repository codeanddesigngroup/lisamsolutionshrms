const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const normalizeFields = (index) => (index.fields || [])
  .map((field) => field.attribute || field.name)
  .filter(Boolean);

async function ensureShiftIndexes() {
  const queryInterface = sequelize.getQueryInterface();
  const [employeeShiftColumn] = await sequelize.query(
    `SELECT is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'employees' AND column_name = 'shift_type_id'`,
  );
  if (employeeShiftColumn[0]?.is_nullable === 'NO') {
    await queryInterface.changeColumn('employees', 'shift_type_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  const indexes = await queryInterface.showIndex('shifts');

  for (const index of indexes) {
    const fields = normalizeFields(index);
    if (index.unique && fields.length === 2 && fields.includes('company_id') && fields.includes('type')) {
      const [constraints] = await sequelize.query(
        `SELECT conname FROM pg_constraint WHERE conrelid = 'shifts'::regclass AND conname = :name`,
        { replacements: { name: index.name } },
      );

      if (constraints.length > 0) {
        await queryInterface.removeConstraint('shifts', index.name);
      } else {
        await queryInterface.removeIndex('shifts', index.name);
      }
    }
  }

  const updatedIndexes = await queryInterface.showIndex('shifts');
  const hasTargetIndex = updatedIndexes.some((index) =>
    index.unique &&
    normalizeFields(index).join(',') === 'company_id,type,start_time,end_time',
  );

  if (!hasTargetIndex) {
    await queryInterface.addIndex('shifts', ['company_id', 'type', 'start_time', 'end_time'], {
      unique: true,
      name: 'shifts_company_type_time_unique',
    });
  }
}

module.exports = ensureShiftIndexes;
