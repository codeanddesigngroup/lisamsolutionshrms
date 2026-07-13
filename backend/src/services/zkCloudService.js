const { saveAttendanceLogs } = require('./attendanceService');

function getEmployeeId(log) {
  return log.employeeId
    ?? log.deviceUserId
    ?? log.userId
    ?? log.uid
    ?? log.emp
    ?? log.emp_code;
}

function parseAttendanceLines(body, deviceSerial) {
  if (Array.isArray(body)) {
    return body.map((log) => ({
      ...log,
      deviceUserId: log.deviceUserId ?? getEmployeeId(log),
      recordTime: log.recordTime ?? log.punchTime ?? log.attTime ?? log.timestamp ?? log.punch_time,
      deviceSerialNumber: log.deviceSerialNumber ?? log.deviceSerial ?? log.terminal_sn ?? deviceSerial,
    }));
  }

  if (body && typeof body === 'object') {
    const hasKnownFields = getEmployeeId(body) || body.recordTime || body.punchTime || body.attTime || body.timestamp || body.punch_time;

    if (!hasKnownFields) {
      return Object.entries(body)
        .flatMap(([key, value]) => {
          const line = [key, value].filter((part) => String(part || '').trim()).join('\t');
          return parseAttendanceLines(line, deviceSerial);
        });
    }

    return [{
      ...body,
      deviceUserId: body.deviceUserId ?? getEmployeeId(body),
      recordTime: body.recordTime ?? body.punchTime ?? body.attTime ?? body.timestamp ?? body.punch_time,
      deviceSerialNumber: body.deviceSerialNumber ?? body.deviceSerial ?? body.terminal_sn ?? deviceSerial,
    }];
  }

  if (!body || typeof body !== 'string') {
    return [];
  }

  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(/\s+/);
      const employeeId = parts[0];
      const punchTime = parts[1] && parts[2] && !line.includes('\t')
        ? `${parts[1]} ${parts[2]}`
        : parts[1];

      return {
        deviceUserId: employeeId,
        recordTime: punchTime,
        deviceSerialNumber: deviceSerial,
      };
    });
}

async function saveCloudAttendance(body, deviceSerial) {
  const logs = parseAttendanceLines(body, deviceSerial);
  const result = await saveAttendanceLogs(logs);

  return {
    fetched: logs.length,
    punches: logs,
    ...result,
  };
}

module.exports = {
  getEmployeeId,
  parseAttendanceLines,
  saveCloudAttendance,
};
