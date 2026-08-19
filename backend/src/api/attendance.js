const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');

const AttendanceRecords = require('../models/AttendanceRecords');
const { getRecentAttendanceRecords, generateAttendanceRecord, processAttendanceRecords } = require('../services/attendanceService');

const getToday = () => new Date().toISOString().slice(0, 10);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const attendanceDateTime = (workDate, time) => {
    if (!time) return null;
    const [year, month, day] = workDate.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
};

const calculateWorkedHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    let milliseconds = checkOut.getTime() - checkIn.getTime();
    if (milliseconds < 0) milliseconds += 24 * 60 * 60 * 1000;
    return Math.max(0, Math.floor(milliseconds / (60 * 60 * 1000)));
};

const getAttendanceWhere = (query = {}) => {
    const where = {};

    if (query.employeeId) {
        where.employeeId = String(query.employeeId);
    }

    const companyId = query.companyId || query.company_id;
    if (companyId) {
        where.companyId = Number(companyId);
    }

    if (query.workDate) {
        where.workDate = query.workDate;
    }

    if (query.startDate || query.endDate) {
        where.workDate = {};

        if (query.startDate) {
            where.workDate[Op.gte] = query.startDate;
        }

        if (query.endDate) {
            where.workDate[Op.lte] = query.endDate;
        }
    }

    return where;
};

const attendanceRecordAttributes = [
    'id',
    'companyId',
    'employeeId',
    'workDate',
    [fn('to_char', col('check_in'), 'YYYY-MM-DD HH24:MI:SS'), 'checkIn'],
    [fn('to_char', col('check_out'), 'YYYY-MM-DD HH24:MI:SS'), 'checkOut'],
    [
        literal(`(
            SELECT string_agg(DISTINCT al.device_serial, ', ')
            FROM attendance_logs al
            WHERE al.employee_id = "AttendanceRecords"."employee_id"
              AND al.punch_time >= "AttendanceRecords"."work_date"::timestamp
              AND al.punch_time < ("AttendanceRecords"."work_date"::timestamp + interval '1 day')
        )`),
        'deviceSerial',
    ],
    'workedHours',
    'lateWaived',
    'lateWaiverReason',
    'lateWaiverNote',
    'lateWaivedBy',
    [fn('to_char', col('late_waived_at'), 'YYYY-MM-DD HH24:MI:SS'), 'lateWaivedAt'],
    [
        literal(`("AttendanceRecords"."updated_at" > clock_timestamp() + interval '50 years')`),
        'manualOverride',
    ],
    [fn('to_char', col('created_at'), 'YYYY-MM-DD HH24:MI:SS'), 'created_at'],
    [fn('to_char', col('updated_at'), 'YYYY-MM-DD HH24:MI:SS'), 'updated_at'],
];

const getQueryLimit = (value, defaultLimit = 100) =>
    Math.min(Math.max(Number(value) || defaultLimit, 1), 10000);

const findAttendanceRecordResponse = (id) => AttendanceRecords.findByPk(id, {
    attributes: attendanceRecordAttributes,
    raw: true,
});

router.get('/', async (req, res, next) => {
    try {
        const records = await AttendanceRecords.findAll({
            attributes: attendanceRecordAttributes,
            where: getAttendanceWhere(req.query),
            order: [['workDate', 'DESC'], ['employeeId', 'ASC']],
            limit: getQueryLimit(req.query.limit),
            raw: true,
        });

        return res.status(200).json({
            success: true,
            count: records.length,
            data: records,
        });
    } catch (err) {
        return next(err);
    }
});

router.get('/today', async (req, res, next) => {
    try {
        const today = getToday();
        const records = await AttendanceRecords.findAll({
            attributes: attendanceRecordAttributes,
            where: {
                ...getAttendanceWhere(req.query),
                workDate: today,
            },
            order: [['employeeId', 'ASC']],
            raw: true,
        });

        return res.status(200).json({
            success: true,
            date: today,
            count: records.length,
            data: records,
        });
    } catch (err) {
        return next(err);
    }
});

router.get('/summary', async (req, res, next) => {
    try {
        const where = getAttendanceWhere(req.query);
        const records = await AttendanceRecords.findAll({ attributes: attendanceRecordAttributes, where, raw: true });
        const totalWorkedHours = records.reduce((total, record) => total + Number(record.workedHours || 0), 0);
        const presentCount = records.filter((record) => Boolean(record.checkIn)).length;
        const completedCount = records.filter((record) => Boolean(record.checkIn && record.checkOut)).length;

        return res.status(200).json({
            success: true,
            data: {
                total_records: records.length,
                present_count: presentCount,
                completed_count: completedCount,
                total_worked_hours: totalWorkedHours,
            },
        });
    } catch (err) {
        return next(err);
    }
});

router.post('/process', async (req, res, next) => {
    try {
        const result = await processAttendanceRecords({
            sinceMinutes: req.body?.sinceMinutes || req.query.sinceMinutes || 1440,
            startDate: req.body?.startDate || req.query.startDate,
            endDate: req.body?.endDate || req.query.endDate,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        return next(err);
    }
});

router.post('/process-missing', async (req, res, next) => {
    try {
        const startDate = String(req.body?.startDate || req.query.startDate || '2026-03-01').trim();
        const endDate = String(req.body?.endDate || req.query.endDate || getToday()).trim();

        if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
            return res.status(422).json({ success: false, message: 'Start date and end date must use YYYY-MM-DD format.' });
        }

        const [rows] = await AttendanceRecords.sequelize.query(
            `
                SELECT DISTINCT employee_id, punch_time::date AS work_date
                FROM attendance_logs
                WHERE punch_time::date BETWEEN :startDate::date AND :endDate::date
                ORDER BY employee_id, work_date
            `,
            { replacements: { startDate, endDate } },
        );

        const records = [];
        for (const row of rows) {
            const workDate = row.work_date instanceof Date
                ? row.work_date.toISOString().slice(0, 10)
                : String(row.work_date).slice(0, 10);
            records.push(await generateAttendanceRecord(String(row.employee_id), workDate));
        }

        const skippedRecords = records.filter((record) => record.skipped);

        return res.status(200).json({
            success: true,
            data: {
                startDate,
                endDate,
                processed: records.length,
                synced: records.length - skippedRecords.length,
                skipped: skippedRecords.length,
                skippedRecords: skippedRecords.slice(0, 50),
            },
        });
    } catch (err) {
        return next(err);
    }
});

router.post('/override', async (req, res, next) => {
    try {
        const companyId = Number(req.body.company_id || req.body.companyId);
        const employeeId = String(req.body.employee_id || '').trim();
        const workDate = String(req.body.date || req.body.workDate || '').trim();
        const status = String(req.body.status || 'present').toLowerCase();
        const checkInTime = status === 'absent' ? '' : String(req.body.clock_in || req.body.checkIn || '').trim();
        const checkOutTime = status === 'absent' ? '' : String(req.body.clock_out || req.body.checkOut || '').trim();

        if (!Number.isInteger(companyId) || companyId <= 0 || !employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) {
            return res.status(422).json({ success: false, message: 'Company, employee, and a valid attendance date are required.' });
        }

        if ((checkInTime && !TIME_PATTERN.test(checkInTime)) || (checkOutTime && !TIME_PATTERN.test(checkOutTime))) {
            return res.status(422).json({ success: false, message: 'Check-in and check-out must use HH:mm format.' });
        }

        const checkIn = attendanceDateTime(workDate, checkInTime);
        let checkOut = attendanceDateTime(workDate, checkOutTime);
        if (checkIn && checkOut && checkOut < checkIn) {
            checkOut = new Date(checkOut.getTime() + 24 * 60 * 60 * 1000);
        }

        const values = {
            companyId,
            employeeId,
            workDate,
            checkIn,
            checkOut,
            workedHours: calculateWorkedHours(checkIn, checkOut),
        };

        const [record, created] = await AttendanceRecords.findOrCreate({
            where: { companyId, employeeId, workDate },
            defaults: values,
        });

        if (!created) await record.update(values);

        await AttendanceRecords.sequelize.query(
            "UPDATE attendance_records SET updated_at = clock_timestamp() + interval '100 years' WHERE id = :id",
            { replacements: { id: record.id } },
        );
        await record.reload();

        return res.status(created ? 201 : 200).json({
            success: true,
            data: record,
        });
    } catch (err) {
        return next(err);
    }
});

router.post('/:id/late-waiver', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const reason = String(req.body.reason || 'Manager discretion').trim().slice(0, 100);
        const note = String(req.body.note || '').trim().slice(0, 250) || null;
        const waivedBy = String(req.body.waived_by || req.body.waivedBy || req.body.user_name || 'Admin').trim().slice(0, 150) || 'Admin';

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(422).json({ success: false, message: 'A valid attendance record ID is required.' });
        }

        const record = await AttendanceRecords.findByPk(id);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Attendance record not found.' });
        }

        await record.update({
            lateWaived: true,
            lateWaiverReason: reason || 'Manager discretion',
            lateWaiverNote: note,
            lateWaivedBy: waivedBy,
            lateWaivedAt: new Date(),
        });

        return res.status(200).json({
            success: true,
            message: 'Late attendance waived successfully.',
            data: await findAttendanceRecordResponse(id),
        });
    } catch (err) {
        return next(err);
    }
});

router.delete('/:id/late-waiver', async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(422).json({ success: false, message: 'A valid attendance record ID is required.' });
        }

        const record = await AttendanceRecords.findByPk(id);
        if (!record) {
            return res.status(404).json({ success: false, message: 'Attendance record not found.' });
        }

        await record.update({
            lateWaived: false,
            lateWaiverReason: null,
            lateWaiverNote: null,
            lateWaivedBy: null,
            lateWaivedAt: null,
        });

        return res.status(200).json({
            success: true,
            message: 'Late attendance waiver removed successfully.',
            data: await findAttendanceRecordResponse(id),
        });
    } catch (err) {
        return next(err);
    }
});
module.exports = router;
