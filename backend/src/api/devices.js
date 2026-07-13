const express = require('express');
const router = express.Router();

const sequelize = require('../config/db');

const getCompanyFilter = (query = {}) => {
  const companyId = query.companyId || query.company_id;
  return companyId ? Number(companyId) : null;
};

router.get('/', async (req, res, next) => {
  try {
    const companyId = getCompanyFilter(req.query);
    const replacements = {};
    const companyJoin = companyId
      ? 'INNER JOIN employees e ON e.employee_id = al.employee_id AND e.company_id = :companyId'
      : 'LEFT JOIN employees e ON e.employee_id = al.employee_id';

    if (companyId) {
      replacements.companyId = companyId;
    }

    const [devices] = await sequelize.query(
      `
        SELECT
          al.device_serial AS "serial",
          MIN(al.punch_time) AS "firstSeenAt",
          MAX(al.punch_time) AS "lastSeenAt",
          COUNT(*)::int AS "punchCount",
          COUNT(DISTINCT al.employee_id)::int AS "employeeCount",
          COUNT(DISTINCT e.company_id)::int AS "companyCount"
        FROM attendance_logs al
        ${companyJoin}
        WHERE al.device_serial IS NOT NULL
          AND al.device_serial <> ''
        GROUP BY al.device_serial
        ORDER BY MAX(al.punch_time) DESC, al.device_serial ASC
      `,
      { replacements },
    );

    return res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
