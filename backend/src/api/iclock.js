const express = require('express');
const router = express.Router();
const { saveCloudAttendance } = require('../services/zkCloudService');

const handleGetOptions = (req, res) => {
  const serial = req.query.SN || req.query.sn || 'UNKNOWN';

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

    console.log(`iClock POST received. Path: ${req.originalUrl}, table: ${table || 'N/A'}, serial: ${serial || 'N/A'}, bodyType: ${typeof req.body}`);

    if (table && table !== 'ATTLOG') {
      res.type('text/plain').send('OK');
      return;
    }

    const result = await saveCloudAttendance(req.body, serial);
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

router.get('/getrequest', (req, res) => {
  res.type('text/plain').send('OK');
});

router.get('/iclock/getrequest', (req, res) => {
  res.type('text/plain').send('OK');
});

router.post('/devicecmd', (req, res) => {
  res.type('text/plain').send('OK');
});

router.post('/iclock/devicecmd', (req, res) => {
  res.type('text/plain').send('OK');
});

module.exports = router;
