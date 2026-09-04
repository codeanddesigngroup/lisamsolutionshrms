const pendingCommands = new Map();
const knownDevices = new Map();
let nextCommandId = Date.now() % 1000000000;

function normalizeSerial(serial) {
  return String(serial || '').trim().toUpperCase();
}

function formatDeviceTimestamp(value, endOfDay = false) {
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
  const stringValue = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 19).replace('T', ' ');
  }
  return `${stringValue} ${endOfDay ? '23:59:59' : '00:00:00'}`;
}

function registerDevice(serial) {
  const deviceSerial = normalizeSerial(serial);
  if (!deviceSerial || deviceSerial === 'UNKNOWN') return null;

  const now = new Date();
  const existing = knownDevices.get(deviceSerial);
  const device = {
    serial: deviceSerial,
    firstSeenAt: existing?.firstSeenAt || now,
    lastSeenAt: now,
  };
  knownDevices.set(deviceSerial, device);
  return device;
}

function getKnownDevices() {
  return Array.from(knownDevices.values());
}

function queueAttendanceSync(serial, startDate, endDate, employeeId = null) {
  const deviceSerial = normalizeSerial(serial);
  if (!deviceSerial) throw new Error('Device serial is required');

  nextCommandId += 1;
  const commandId = nextCommandId;
  const deviceEmployeeId = String(employeeId || '').trim();
  // DATA QUERY ATTLOG filtering support differs between iClock firmwares.
  // Keep employeeId as application metadata and use the protocol's supported
  // date-range query; attendanceService matches returned punches by employee ID.
  const command = `C:${commandId}:DATA QUERY ATTLOG StartTime=${formatDeviceTimestamp(startDate)} EndTime=${formatDeviceTimestamp(endDate, true)}`;
  const commands = pendingCommands.get(deviceSerial) || [];
  commands.push({ commandId, command, startDate, endDate, employeeId: deviceEmployeeId || null, queuedAt: new Date() });
  pendingCommands.set(deviceSerial, commands);

  return commands[commands.length - 1];
}

function takeNextCommand(serial) {
  const deviceSerial = normalizeSerial(serial);
  const commands = pendingCommands.get(deviceSerial) || [];
  const next = commands.shift() || null;

  if (commands.length === 0) pendingCommands.delete(deviceSerial);
  else pendingCommands.set(deviceSerial, commands);

  return next;
}

module.exports = {
  getKnownDevices,
  queueAttendanceSync,
  registerDevice,
  takeNextCommand,
};
