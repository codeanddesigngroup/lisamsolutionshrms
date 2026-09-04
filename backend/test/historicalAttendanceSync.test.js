const assert = require('node:assert/strict');
const test = require('node:test');

const { getHistoricalSyncRange } = require('../src/services/attendanceService');
const { queueAttendanceSync, takeNextCommand } = require('../src/services/zkCommandQueue');

test('historical range is exactly six calendar months and preserves the time', () => {
  const now = new Date('2026-09-04T12:34:56.000Z');
  const range = getHistoricalSyncRange(now);
  assert.equal(range.startDate.toISOString(), '2026-03-04T12:34:56.000Z');
  assert.equal(range.endDate.toISOString(), now.toISOString());
});

test('historical range clamps dates at the end of shorter months', () => {
  const range = getHistoricalSyncRange(new Date('2026-08-31T08:00:00.000Z'));
  assert.equal(range.startDate.toISOString(), '2026-02-28T08:00:00.000Z');
});

test('device query uses exact timestamps and the new device employee ID', () => {
  const serial = 'TEST-SERIAL';
  queueAttendanceSync(serial, new Date('2026-03-04T12:34:56.000Z'), new Date('2026-09-04T12:34:56.000Z'), 'EMP-42');
  const queued = takeNextCommand(serial);
  assert.match(queued.command, /StartTime=2026-03-04 12:34:56/);
  assert.match(queued.command, /EndTime=2026-09-04 12:34:56/);
  assert.match(queued.command, /Pin=EMP-42$/);
  assert.equal(queued.employeeId, 'EMP-42');
});

test('existing date-only device synchronization remains unchanged', () => {
  const serial = 'DAILY-SYNC-TEST';
  queueAttendanceSync(serial, '2026-09-04', '2026-09-04');
  const queued = takeNextCommand(serial);
  assert.match(queued.command, /StartTime=2026-09-04 00:00:00/);
  assert.match(queued.command, /EndTime=2026-09-04 23:59:59$/);
  assert.equal(queued.employeeId, null);
});
