const AttendanceLogs = require('../models/AttendanceLogs');
const AttendanceRecords = require('../models/AttendanceRecords');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

const EARLY_CHECK_IN_BUFFER_MINUTES = 120;
const LATE_CHECK_OUT_BUFFER_MINUTES = 240;

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

  const startTime = normalizeTime(shift.start_time);
  const endTime = normalizeTime(shift.end_time);
  const shiftStart = getWorkDateAtTime(workDate, startTime);
  let shiftEnd = getWorkDateAtTime(workDate, endTime);

  if (shiftCrossesMidnight(shift)) {
    shiftEnd = addMinutes(shiftEnd, 24 * 60);
  }

  return {
    start: formatTimestamp(addMinutes(shiftStart, -EARLY_CHECK_IN_BUFFER_MINUTES)),
    end: formatTimestamp(addMinutes(shiftEnd, LATE_CHECK_OUT_BUFFER_MINUTES)),
  };
}

async function getEmployeeAttendanceProfile(employeeId) {
  const [employees] = await sequelize.query(
    `
      SELECT
        e.company_id,
        s.start_time,
        s.end_time
      FROM employees e
      LEFT JOIN shifts s ON s.id = e.shift_type_id
      WHERE e.employee_id = :employeeId
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

  if (timeToSeconds(punchTimeOfDay) <= checkoutBufferEndSeconds) {
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
  let workedMs = 0;
  let lastOut = null;

  for (let index = 0; index < punches.length - 1; index += 2) {
    const inTime = punches[index].punchTime || punches[index].punch_time;
    const outTime = punches[index + 1].punchTime || punches[index + 1].punch_time;
    const inDate = parsePunchTime(inTime);
    const outDate = parsePunchTime(outTime);

    if (outDate > inDate) {
      workedMs += outDate - inDate;
      lastOut = outTime;
    }
  }

  return {
    checkIn: punches[0]?.punchTime || punches[0]?.punch_time || null,
    checkOut: lastOut,
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
  const shift = {
    start_time: employees[0].start_time,
    end_time: employees[0].end_time,
  };
  const { start, end } = getShiftWorkDateRange(workDate, shift);
  const [punches] = await sequelize.query(
    `
      SELECT to_char(punch_time, 'YYYY-MM-DD HH24:MI:SS') AS "punchTime"
      FROM attendance_logs
      WHERE employee_id = :employeeId
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
        (:companyId, :employeeId, :workDate, :checkIn::timestamp, :checkOut::timestamp, :workedHours, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (company_id, employee_id, work_date)
      DO UPDATE SET
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        worked_hours = EXCLUDED.worked_hours,
        updated_at = (
          SELECT MAX(al.created_at)
          FROM attendance_logs al
          WHERE al.employee_id = :employeeId
            AND al.punch_time >= :start::timestamp
            AND al.punch_time < :end::timestamp
        )
      WHERE attendance_records.updated_at < (
        SELECT MAX(al.created_at)
        FROM attendance_logs al
        WHERE al.employee_id = :employeeId
          AND al.punch_time >= :start::timestamp
          AND al.punch_time < :end::timestamp
      )
    `,
    {
      replacements: {
        companyId,
        employeeId,
        workDate,
        checkIn: summary.checkIn,
        checkOut: summary.checkOut,
        workedHours: summary.workedHours,
        start,
        end,
      },
    },
  );

  return { companyId, employeeId, workDate, punches: punches.length, ...summary };
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

    const exists = await AttendanceLogs.findOne({
      attributes: ['id'],
      where: {
        employeeId: attendance.employeeId,
        punchTime: attendance.punchTime,
      },
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    await AttendanceLogs.create(attendance, {
      fields: ['employeeId', 'punchTime', 'deviceSerial'],
    });
    saved += 1;
  }

  return { saved, skipped };
}

async function processAttendanceRecords({ sinceMinutes = 1440, startDate, endDate } = {}) {
  const since = new Date(Date.now() - Number(sinceMinutes || 1440) * 60 * 1000);
  const punchTime = {};
  if (startDate) punchTime[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
  if (endDate) {
    const endExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    punchTime[Op.lt] = endExclusive;
  }
  const logs = await AttendanceLogs.findAll({
    where: {
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

  const records = [];

  for (const { employeeId, workDate } of workKeys.values()) {
    records.push(await generateAttendanceRecord(employeeId, workDate));
  }

  return {
    processed: records.length,
    records,
  };
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
  normalizeAttendanceLog,
  processAttendanceRecords,
  saveAttendanceLogs,
  updateDailyAttendance,
};
