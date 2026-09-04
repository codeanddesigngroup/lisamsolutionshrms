const express = require('express');
const router = express.Router();

const sequelize = require('../config/db');
const { getKnownDevices, queueAttendanceSync } = require('../services/zkCommandQueue');
const { processAttendanceRecords } = require('../services/attendanceService');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultSyncRange() {
  const end = new Date();
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - 6);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

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

    const deviceBySerial = new Map(
      devices.map((device) => [String(device.serial).trim().toUpperCase(), device]),
    );

    for (const knownDevice of getKnownDevices()) {
      const existing = deviceBySerial.get(knownDevice.serial);
      if (existing) {
        existing.lastSeenAt = knownDevice.lastSeenAt;
      } else {
        deviceBySerial.set(knownDevice.serial, {
          ...knownDevice,
          punchCount: 0,
          employeeCount: 0,
          companyCount: 0,
        });
      }
    }

    const discoveredDevices = Array.from(deviceBySerial.values())
      .sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));

    return res.status(200).json({
      success: true,
      count: discoveredDevices.length,
      data: discoveredDevices,
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/:serial/sync-attendance', async (req, res, next) => {
  const defaults = getDefaultSyncRange();
  const startDate = String(req.body?.startDate || defaults.startDate);
  const endDate = String(req.body?.endDate || defaults.endDate);

  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate) || startDate > endDate) {
    return res.status(422).json({
      success: false,
      message: 'startDate and endDate must be valid YYYY-MM-DD values, with startDate before endDate.',
    });
  }

  try {
    // Build attendance immediately from historical punches already received.
    // The queued device query then supplies any punches not stored locally yet;
    // the iClock upload handler processes that returned batch again idempotently.
    const processed = await processAttendanceRecords({ startDate, endDate, missingOnly: true });
    const synced = processed.records.filter((record) => !record.skipped).length;
    const skipped = processed.records.length - synced;
    const skippedRecords = processed.records
      .filter((record) => record.skipped)
      .map(({ employeeId, workDate, reason, punches }) => ({ employeeId, workDate, reason, punches }));
    const queued = queueAttendanceSync(req.params.serial, startDate, endDate);

    return res.status(202).json({
      success: true,
      message: 'Stored punches processed and device attendance refresh queued.',
      data: {
        startDate,
        endDate,
        processed: processed.processed,
        synced,
        skipped,
        skippedRecords,
        command: queued,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
