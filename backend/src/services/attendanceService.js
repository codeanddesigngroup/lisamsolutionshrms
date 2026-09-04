const AttendanceLogs = require('../models/AttendanceLogs');
const AttendanceRecords = require('../models/AttendanceRecords');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const { getKnownDevices, queueAttendanceSync } = require('./zkCommandQueue');

const LATE_CHECK_OUT_BUFFER_MINUTES = 240;

function subtractUtcMonths(value, months) {
  const result = new Date(value);
  const originalDay = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(originalDay, lastDay));
  return result;
}

function getHistoricalSyncRange(now = new Date()) {
  const endDate = new Date(now);
  return { startDate: subtractUtcMonths(endDate, 6), endDate };
}

function formatWorkDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTimestamp(date) {
  return `${formatWorkDate(date)} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
}

function parseTimeParts(value) {
  const [hours = 0, minutes = 0, seconds = 0] = String(value || '00:00:00').split(':').map(Number);
  return {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
    seconds: Number.isFinite(seconds) ? seconds : 0,
  };
}

function normalizeTime(value) {
  const { hours, minutes, seconds } = parseTimeParts(value);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getWorkDateAtTime(workDate, time) {
  const [year, month, day] = workDate.split('-').map(Number);
  const { hours, minutes, seconds } = parseTimeParts(time);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function timeToSeconds(value) {
  const { hours, minutes, seconds } = parseTimeParts(value);
  return hours * 60 * 60 + minutes * 60 + seconds;
}

function shiftCrossesMidnight(shift) {
  if (!shift?.start_time || !shift?.end_time) return false;
  return normalizeTime(shift.end_time) <= normalizeTime(shift.start_time);
}

function getWorkDateRange(workDate) {
  const start = `${workDate} 00:00:00`;
  const [year, month, day] = workDate.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const end = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay.getUTCDate()).padStart(2, '0')} 00:00:00`;

  return { start, end };
}

function getShiftWorkDateRange(workDate, shift) {
  if (!shift?.start_time || !shift?.end_time) {
    return getWorkDateRange(workDate);
  }

  const endTime = normalizeTime(shift.end_time);
  const workDateStart = getWorkDateAtTime(workDate, '00:00:00');
  let shiftEnd = getWorkDateAtTime(workDate, endTime);

  if (shiftCrossesMidnight(shift)) {
    shiftEnd = addMinutes(shiftEnd, 24 * 60);
    // The early-morning punches on workDate close the shift that started on
    // the previous date. Begin this shift's window after that checkout buffer,
    // otherwise yesterday's checkout becomes today's check-in.
    const previousShiftCheckoutCutoff = addMinutes(
      getWorkDateAtTime(workDate, endTime),
      LATE_CHECK_OUT_BUFFER_MINUTES,
    );

    return {
      start: formatTimestamp(previousShiftCheckoutCutoff),
      end: formatTimestamp(addMinutes(shiftEnd, LATE_CHECK_OUT_BUFFER_MINUTES)),
    };
  }

  return {
    start: formatTimestamp(workDateStart),
    end: getWorkDateRange(workDate).end,
  };
}

async function getEmployeeAttendanceProfile(employeeId) {
  const [employees] = await sequelize.query(
    `
      SELECT
        e.company_id,
        e.employee_id,
        s.start_time,
        s.end_time
      FROM employees e
      LEFT JOIN shifts s ON s.id = e.shift_type_id
      WHERE e.employee_id = :employeeId
         OR (
           e.employee_id ~ '^[0-9]+$'
           AND :employeeId ~ '^[0-9]+$'
           AND COALESCE(NULLIF(LTRIM(e.employee_id, '0'), ''), '0') =
               COALESCE(NULLIF(LTRIM(:employeeId, '0'), ''), '0')
         )
      LIMIT 2
    `,
    { replacements: { employeeId: String(employeeId) } },
  );

  return employees;
}

async function getEmployeeShift(employeeId) {
  const employees = await getEmployeeAttendanceProfile(employeeId);
  if (employees.length !== 1) return null;

  return {
    start_time: employees[0].start_time,
    end_time: employees[0].end_time,
  };
}

function getWorkDateForPunch(punchTime, shift) {
  const workDate = formatWorkDate(punchTime);

  if (!shiftCrossesMidnight(shift)) {
    return workDate;
  }

  const punchTimeOfDay = `${String(punchTime.getUTCHours()).padStart(2, '0')}:${String(punchTime.getUTCMinutes()).padStart(2, '0')}:${String(punchTime.getUTCSeconds()).padStart(2, '0')}`;
  const checkoutBufferEndSeconds = timeToSeconds(shift.end_time) + LATE_CHECK_OUT_BUFFER_MINUTES * 60;

  if (timeToSeconds(punchTimeOfDay) < checkoutBufferEndSeconds) {
    const previousDate = new Date(punchTime);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    return formatWorkDate(previousDate);
  }

  return workDate;
}

function parsePunchTime(value) {
  const stringValue = String(value || '').trim();
  const localDateMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(stringValue);
  const punchTime = localDateMatch && !hasExplicitTimezone
    ? new Date(Date.UTC(
      Number(localDateMatch[1]),
      Number(localDateMatch[2]) - 1,
      Number(localDateMatch[3]),
      Number(localDateMatch[4]),
      Number(localDateMatch[5]),
      Number(localDateMatch[6] || 0),
    ))
    : new Date(value);
  return punchTime;
}

function calculateDailySummary(punches) {
  const checkIn = punches[0]?.punchTime || punches[0]?.punch_time || null;
  const checkOut = punches.length > 1
    ? punches[punches.length - 1]?.punchTime || punches[punches.length - 1]?.punch_time || null
    : null;
  const inDate = checkIn ? parsePunchTime(checkIn) : null;
  const outDate = checkOut ? parsePunchTime(checkOut) : null;
  const workedMs = inDate && outDate && outDate > inDate ? outDate - inDate : 0;

  return {
    checkIn,
    checkOut,
    workedHours: Math.floor(workedMs / (1000 * 60 * 60)),
  };
}

async function generateAttendanceRecord(employeeId, workDate) {
  const employees = await getEmployeeAttendanceProfile(employeeId);

  if (employees.length !== 1 || !employees[0]?.company_id) {
    return {
      employeeId,
      workDate,
      skipped: true,
      reason: employees.length > 1 ? 'Employee company is ambiguous' : 'Employee company not found',
      punches: 0,
    };
  }

  const companyId = employees[0].company_id;
  const applicationEmployeeId = employees[0].employee_id;
  const shift = {
    start_time: employees[0].start_time,
    end_time: employees[0].end_time,
  };
  const { start, end } = getShiftWorkDateRange(workDate, shift);
  const [punches] = await sequelize.query(
    `
      SELECT to_char(punch_time, 'YYYY-MM-DD HH24:MI:SS') AS "punchTime"
      FROM attendance_logs
      WHERE (
          employee_id = :employeeId
          OR (
            employee_id ~ '^[0-9]+$'
            AND :employeeId ~ '^[0-9]+$'
            AND COALESCE(NULLIF(LTRIM(employee_id, '0'), ''), '0') =
                COALESCE(NULLIF(LTRIM(:employeeId, '0'), ''), '0')
          )
        )
        AND punch_time >= :start::timestamp
        AND punch_time < :end::timestamp
      ORDER BY punch_time ASC
    `,
    { replacements: { employeeId, start, end } },
  );

  const summary = calculateDailySummary(punches);

  if (punches.length === 0) {
    return {
      companyId,
      employeeId,
      workDate,
      skipped: true,
      reason: 'No punches found inside shift window',
      punches: 0,
      ...summary,
    };
  }

  await sequelize.query(
    `
      INSERT INTO attendance_records
        (company_id, employee_id, work_date, check_in, check_out, worked_hours, created_at, updated_at)
      VALUES
        (:companyId, :applicationEmployeeId, :workDate, :checkIn::timestamp, :checkOut::timestamp, :workedHours, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (company_id, employee_id, work_date)
      DO UPDATE SET
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        worked_hours = EXCLUDED.worked_hours,
        updated_at = (
          SELECT MAX(al.created_at)
          FROM attendance_logs al
          WHERE (
              al.employee_id = :employeeId
              OR (
                al.employee_id ~ '^[0-9]+$'
                AND :employeeId ~ '^[0-9]+$'
                AND COALESCE(NULLIF(LTRIM(al.employee_id, '0'), ''), '0') =
                    COALESCE(NULLIF(LTRIM(:employeeId, '0'), ''), '0')
              )
            )
            AND al.punch_time >= :start::timestamp
            AND al.punch_time < :end::timestamp
        )
      -- Machine-generated rows must be recalculable even when the row was
      -- created after its raw punches. Manual overrides are timestamped 100
      -- years ahead and remain protected by this guard.
      WHERE attendance_records.updated_at < clock_timestamp() + interval '50 years'
    `,
    {
      replacements: {
        companyId,
        employeeId,
        applicationEmployeeId,
        workDate,
        checkIn: summary.checkIn,
        checkOut: summary.checkOut,
        workedHours: summary.workedHours,
        start,
        end,
      },
    },
  );

  return { companyId, employeeId: applicationEmployeeId, workDate, punches: punches.length, ...summary };
}

async function updateDailyAttendance(employeeId, punchTime) {
  const shift = await getEmployeeShift(employeeId);
  const workDate = getWorkDateForPunch(punchTime, shift);
  return generateAttendanceRecord(employeeId, workDate);
}

function normalizeAttendanceLog(log) {
  const employeeId = log.employeeId ?? log.deviceUserId ?? log.userId ?? log.uid ?? log.emp ?? log.emp_code;
  const punchTime = log.punchTime ?? log.recordTime ?? log.attTime ?? log.timestamp ?? log.punch_time;

  if (!employeeId || !punchTime) {
    return null;
  }

  return {
    employeeId: String(employeeId),
    punchTime: parsePunchTime(punchTime),
    deviceSerial: log.deviceSerial || log.deviceSerialNumber || log.terminal_sn
      ? String(log.deviceSerial ?? log.deviceSerialNumber ?? log.terminal_sn)
      : null,
  };
}

async function saveAttendanceLogs(logs) {
  let saved = 0;
  let skipped = 0;

  for (const log of logs) {
    const attendance = normalizeAttendanceLog(log);

    if (!attendance || Number.isNaN(attendance.punchTime.getTime())) {
      skipped += 1;
      continue;
    }

    const [, created] = await AttendanceLogs.findOrCreate({
      where: {
        employeeId: attendance.employeeId,
        punchTime: attendance.punchTime,
      },
      defaults: attendance,
      fields: ['employeeId', 'punchTime', 'deviceSerial'],
    });

    if (created) saved += 1;
    else skipped += 1;
  }

  return { saved, skipped };
}

function comparableEmployeeId(value) {
  const employeeId = String(value || '').trim();
  return /^\d+$/.test(employeeId) ? String(Number(employeeId)) : employeeId;
}

async function processAttendanceRecords({ sinceMinutes = 1440, startDate, endDate, employeeId, missingOnly = false } = {}) {
  const since = new Date(Date.now() - Number(sinceMinutes || 1440) * 60 * 1000);
  const punchTime = {};
  if (startDate) {
    punchTime[Op.gte] = startDate instanceof Date
      ? startDate
      : new Date(`${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    const upperBound = endDate instanceof Date
      ? endDate
      : new Date(`${endDate}T00:00:00.000Z`);
    if (!(endDate instanceof Date)) upperBound.setUTCDate(upperBound.getUTCDate() + 1);
    punchTime[endDate instanceof Date ? Op.lte : Op.lt] = upperBound;
  }
  let matchingEmployeeIds = null;
  if (employeeId) {
    const [matches] = await sequelize.query(`
      SELECT DISTINCT employee_id AS "employeeId"
      FROM attendance_logs
      WHERE employee_id = :employeeId
         OR (
           employee_id ~ '^[0-9]+$'
           AND :employeeId ~ '^[0-9]+$'
           AND COALESCE(NULLIF(LTRIM(employee_id, '0'), ''), '0') =
               COALESCE(NULLIF(LTRIM(:employeeId, '0'), ''), '0')
         )
    `, { replacements: { employeeId: String(employeeId) } });
    matchingEmployeeIds = matches.map((match) => String(match.employeeId));
  }

  const logs = await AttendanceLogs.findAll({
    where: {
      ...(employeeId ? { employeeId: { [Op.in]: matchingEmployeeIds } } : {}),
      ...(Object.keys(punchTime).length > 0 ? { punchTime } : { created_at: { [Op.gte]: since } }),
    },
    order: [['employeeId', 'ASC'], ['punchTime', 'ASC']],
  });

  const workKeys = new Map();
  const shiftByEmployee = new Map();

  for (const log of logs) {
    if (!shiftByEmployee.has(log.employeeId)) {
      shiftByEmployee.set(log.employeeId, await getEmployeeShift(log.employeeId));
    }

    const workDate = getWorkDateForPunch(log.punchTime, shiftByEmployee.get(log.employeeId));

    workKeys.set(`${log.employeeId}:${workDate}`, {
      employeeId: log.employeeId,
      workDate,
    });
  }

  if (missingOnly && workKeys.size > 0) {
    const workDates = Array.from(workKeys.values(), (item) => item.workDate);
    const existingRecords = await AttendanceRecords.findAll({
      attributes: ['employeeId', 'workDate'],
      where: { workDate: { [Op.between]: [workDates.sort()[0], workDates.sort().at(-1)] } },
      raw: true,
    });
    const existingKeys = new Set(existingRecords.map((record) => (
      `${comparableEmployeeId(record.employeeId)}:${record.workDate}`
    )));

    for (const [key, item] of workKeys) {
      if (existingKeys.has(`${comparableEmployeeId(item.employeeId)}:${item.workDate}`)) {
        workKeys.delete(key);
      }
    }
  }

  const records = [];

  for (const { employeeId, workDate } of workKeys.values()) {
    records.push(await generateAttendanceRecord(employeeId, workDate));
  }

  return {
    processed: records.length,
    records,
  };
}

async function syncEmployeeHistoricalAttendance(employeeId, now = new Date()) {
  const deviceEmployeeId = String(employeeId || '').trim();
  if (!deviceEmployeeId) throw new Error('Device employee ID is required');

  const range = getHistoricalSyncRange(now);
  const processed = await processAttendanceRecords({ employeeId: deviceEmployeeId, ...range });
  const [storedDevices] = await sequelize.query(`
    SELECT DISTINCT device_serial AS serial
    FROM attendance_logs
    WHERE device_serial IS NOT NULL AND device_serial <> ''
  `);
  const serials = new Set([
    ...getKnownDevices().map((device) => device.serial),
    ...storedDevices.map((device) => String(device.serial || '').trim().toUpperCase()),
  ].filter(Boolean));
  const queued = Array.from(serials, (serial) => queueAttendanceSync(
    serial,
    range.startDate,
    range.endDate,
    deviceEmployeeId,
  ));

  return { employeeId: deviceEmployeeId, ...range, processed, queued };
}

async function getRecentAttendanceRecords({ limit = 50, employeeId } = {}) {
  const where = {};

  if (employeeId) {
    where.employeeId = String(employeeId);
  }

  return AttendanceLogs.findAll({
    where,
    order: [['punchTime', 'DESC']],
    limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
  });
}

module.exports = {
  calculateDailySummary,
  generateAttendanceRecord,
  getShiftWorkDateRange,
  getWorkDateForPunch,
  getRecentAttendanceRecords,
  getHistoricalSyncRange,
  normalizeAttendanceLog,
  processAttendanceRecords,
  saveAttendanceLogs,
  syncEmployeeHistoricalAttendance,
  updateDailyAttendance,
};
