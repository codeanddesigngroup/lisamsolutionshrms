const { processAttendanceRecords } = require('./attendanceService');

const DEFAULT_INTERVAL_MS = 60 * 1000;
let isRunning = false;
let intervalId = null;

async function runAttendanceWorker() {
  if (isRunning) return;

  isRunning = true;

  try {
    const result = await processAttendanceRecords();

    if (result.processed > 0) {
      console.log(`Attendance worker processed ${result.processed} records`);
    }
  } catch (err) {
    console.error('Attendance worker failed:', err);
  } finally {
    isRunning = false;
  }
}

function startAttendanceWorker(intervalMs = DEFAULT_INTERVAL_MS) {
  if (intervalId) return intervalId;

  runAttendanceWorker();
  intervalId = setInterval(runAttendanceWorker, intervalMs);
  return intervalId;
}

function stopAttendanceWorker() {
  if (!intervalId) return;

  clearInterval(intervalId);
  intervalId = null;
}

module.exports = {
  runAttendanceWorker,
  startAttendanceWorker,
  stopAttendanceWorker,
};
