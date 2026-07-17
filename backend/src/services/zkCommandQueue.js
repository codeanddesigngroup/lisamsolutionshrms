const pendingCommands = new Map();
let nextCommandId = Date.now() % 1000000000;

function normalizeSerial(serial) {
  return String(serial || '').trim().toUpperCase();
}

function formatDeviceTimestamp(value, endOfDay = false) {
  return `${value} ${endOfDay ? '23:59:59' : '00:00:00'}`;
}

function queueAttendanceSync(serial, startDate, endDate) {
  const deviceSerial = normalizeSerial(serial);
  if (!deviceSerial) throw new Error('Device serial is required');

  nextCommandId += 1;
  const commandId = nextCommandId;
  const command = `C:${commandId}:DATA QUERY ATTLOG StartTime=${formatDeviceTimestamp(startDate)} EndTime=${formatDeviceTimestamp(endDate, true)}`;
  const commands = pendingCommands.get(deviceSerial) || [];
  commands.push({ commandId, command, startDate, endDate, queuedAt: new Date() });
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

module.exports = { queueAttendanceSync, takeNextCommand };
