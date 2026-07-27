const express = require('express');
const router = express.Router();
const { saveCloudAttendance } = require('../services/zkCloudService');
const { registerDevice, takeNextCommand } = require('../services/zkCommandQueue');
const { processAttendanceRecords } = require('../services/attendanceService');

function getUploadedPunchRange(punches = []) {
  const timestamps = punches
    .map((punch) => punch.recordTime ?? punch.punchTime ?? punch.attTime ?? punch.timestamp ?? punch.punch_time)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .map((date) => date.getTime());

  if (timestamps.length === 0) return null;

  return {
    startDate: new Date(Math.min(...timestamps)).toISOString().slice(0, 10),
    endDate: new Date(Math.max(...timestamps)).toISOString().slice(0, 10),
  };
}

const handleGetOptions = (req, res) => {
  const serial = req.query.SN || req.query.sn || 'UNKNOWN';
  registerDevice(serial);

  res.type('text/plain').send([
    `GET OPTION FROM: ${serial}`,
    'Stamp=9999',
    'OpStamp=9999',
    'ErrorDelay=60',
    'Delay=30',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=1111000000',
    `TimeZone=${process.env.DEVICE_TIMEZONE || 5}`,
    'Realtime=1',
    'Encrypt=0',
  ].join('\r\n'));
};

const handleAttendanceLogs = async (req, res, next) => {
  try {
    const table = String(req.query.table || '').toUpperCase();
    const serial = req.query.SN || req.query.sn || null;
    registerDevice(serial);

    console.log(`iClock POST received. Path: ${req.originalUrl}, table: ${table || 'N/A'}, serial: ${serial || 'N/A'}, bodyType: ${typeof req.body}`);

    if (table && table !== 'ATTLOG') {
      res.type('text/plain').send('OK');
      return;
    }

    const result = await saveCloudAttendance(req.body, serial);
    const uploadedRange = getUploadedPunchRange(result.punches);

    // DATA QUERY only reads punches from the device. Once a batch is safely
    // stored in attendance_logs, build/update the corresponding attendance rows.
    if (result.fetched > 0 && uploadedRange) {
      const processed = await processAttendanceRecords(uploadedRange);
      console.log(`Processed ${processed.processed} attendance records for uploaded device punches`);
    }

    console.log(`Cloud attendance received. Fetched: ${result.fetched}, saved: ${result.saved}, skipped: ${result.skipped}`);
    res.type('text/plain').send('OK');
  } catch (err) {
    next(err);
  }
};

router.get('/cdata', handleGetOptions);
router.get('/iclock/cdata', handleGetOptions);
router.post('/cdata', handleAttendanceLogs);
router.post('/iclock/cdata', handleAttendanceLogs);

router.post('/fdata', (req, res) => {
  res.type('text/plain').send('OK');
});

router.post('/iclock/fdata', (req, res) => {
  res.type('text/plain').send('OK');
});

const handleGetRequest = (req, res) => {
  const serial = req.query.SN || req.query.sn;
  registerDevice(serial);
  const pending = takeNextCommand(serial);
  res.type('text/plain').send(pending?.command || 'OK');
};

router.get('/getrequest', handleGetRequest);
router.get('/iclock/getrequest', handleGetRequest);

router.post('/devicecmd', (req, res) => {
  res.type('text/plain').send('OK');
});

router.post('/iclock/devicecmd', (req, res) => {
  res.type('text/plain').send('OK');
});

module.exports = router;
