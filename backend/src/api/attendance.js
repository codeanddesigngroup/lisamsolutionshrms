const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');

const AttendanceRecords = require('../models/AttendanceRecords');
const AttendanceBreak = require('../models/AttendanceBreak');
const Employee = require('../models/Employee');
const Role = require('../models/Role');
const User = require('../models/User');
const ChatConversation = require('../models/ChatConversation');
const ChatMessage = require('../models/ChatMessage');
const { emitToChatRooms } = require('../realtime/socket');
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

const ATTENDANCE_DAY_CUTOFF_HOUR = 6;

const getBreakWorkDate = () => {
    const timezoneOffset = Number(process.env.DEVICE_TIMEZONE || 5);
    const localDate = new Date(Date.now() + timezoneOffset * 60 * 60 * 1000);
    if (localDate.getUTCHours() < ATTENDANCE_DAY_CUTOFF_HOUR) {
        localDate.setUTCDate(localDate.getUTCDate() - 1);
    }
    return localDate.toISOString().slice(0, 10);
};

const serializeBreak = (record) => record ? ({
    id: record.id,
    company_id: record.companyId,
    employee_id: record.employeeId,
    employee_record_id: record.employeeRecordId,
    employee_name: record.employeeName,
    work_date: record.workDate,
    break_start: record.breakStart,
    break_end: record.breakEnd,
    is_open: !record.breakEnd,
}) : null;

const breakRecordAttributes = [
    'id',
    'companyId',
    'employeeId',
    'employeeRecordId',
    'workDate',
    [fn('to_char', col('break_start'), 'YYYY-MM-DD HH24:MI:SS'), 'breakStart'],
    [fn('to_char', col('break_end'), 'YYYY-MM-DD HH24:MI:SS'), 'breakEnd'],
    [
        literal(`CASE
            WHEN "AttendanceBreak"."break_end" IS NULL THEN NULL
            ELSE GREATEST(0, FLOOR(EXTRACT(EPOCH FROM ("AttendanceBreak"."break_end" - "AttendanceBreak"."break_start")) / 60))
        END`),
        'durationMinutes',
    ],
    [
        literal(`COALESCE(
            "AttendanceBreak"."employee_name",
            (
                SELECT e.name
                FROM employees e
                WHERE e.company_id = "AttendanceBreak"."company_id"
                  AND e.employee_id = "AttendanceBreak"."employee_id"
                LIMIT 1
            )
        )`),
        'employeeName',
    ],
    [
        literal(`(
            SELECT d.name
            FROM employees e
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE e.company_id = "AttendanceBreak"."company_id"
              AND e.employee_id = "AttendanceBreak"."employee_id"
            LIMIT 1
        )`),
        'departmentName',
    ],
    [fn('to_char', col('created_at'), 'YYYY-MM-DD HH24:MI:SS'), 'created_at'],
    [fn('to_char', col('updated_at'), 'YYYY-MM-DD HH24:MI:SS'), 'updated_at'],
];

const getBreakEmployee = async (source = {}) => {
    const companyId = Number(source.company_id || source.companyId);
    const employeeRecordId = Number(source.employee_record_id || source.employeeRecordId || source.employee_pk || source.employeePk);
    const employeeId = String(source.employee_id || source.employeeId || '').trim();

    let employee = null;
    if (Number.isInteger(employeeRecordId) && employeeRecordId > 0) {
        employee = await Employee.findByPk(employeeRecordId);
    }

    if (!employee && employeeId) {
        employee = await Employee.findOne({
            where: {
                employee_id: employeeId,
                ...(Number.isInteger(companyId) && companyId > 0 ? { company_id: companyId } : {}),
            },
        });
    }

    const resolvedCompanyId = Number(companyId || employee?.company_id);
    const resolvedEmployeeId = String(employee?.employee_id || employeeId || '').trim();

    if (!Number.isInteger(resolvedCompanyId) || resolvedCompanyId <= 0 || !resolvedEmployeeId) {
        return null;
    }

    return {
        companyId: resolvedCompanyId,
        employeeId: resolvedEmployeeId,
        employeeRecordId: employee?.id || (Number.isInteger(employeeRecordId) && employeeRecordId > 0 ? employeeRecordId : null),
        employeeName: String(employee?.name || source.employee_name || source.employeeName || 'Employee').trim(),
    };
};

const notifyAdminsAboutBreak = async ({ breakRecord, action }) => {
    const companyId = Number(breakRecord.companyId);
    if (!Number.isInteger(companyId) || companyId <= 0) return null;

    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    const admins = adminRole
        ? await User.findAll({ where: { company_id: companyId, role_id: adminRole.id, status: 'active' } })
        : [];
    const adminKeys = admins.map((admin) => `admin:${admin.id}`);
    const employeeKey = breakRecord.employeeRecordId ? `employee:${breakRecord.employeeRecordId}` : `employee:${breakRecord.employeeId}`;
    const participantKeys = Array.from(new Set([employeeKey, ...adminKeys]));
    const conversationId = `attendance-breaks-${companyId}`;
    const createdAt = new Date().toISOString();
    const actionText = action === 'end' ? 'ended break' : 'started break';
    const eventTime = new Date(action === 'end' ? breakRecord.breakEnd : breakRecord.breakStart).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Karachi',
    });
    const body = `${breakRecord.employeeName || 'Employee'} ${actionText} at ${eventTime}.`;

    const [conversation] = await ChatConversation.findOrCreate({
        where: { id: conversationId },
        defaults: {
            id: conversationId,
            company_id: companyId,
            payload: {
                id: conversationId,
                type: 'group',
                name: 'Attendance Break Alerts',
                created_by: 'system:attendance',
                participant_keys: participantKeys,
                admin_keys: adminKeys,
                last_message: body,
                last_message_at: createdAt,
                unread_by: adminKeys,
                archived_by: [],
                settings: { only_admins_can_edit_info: true, only_admins_can_send: false },
            },
        },
    });

    const conversationPayload = conversation.payload || {};
    const nextParticipantKeys = Array.from(new Set([...(conversationPayload.participant_keys || []), ...participantKeys]));
    const nextAdminKeys = Array.from(new Set([...(conversationPayload.admin_keys || []), ...adminKeys]));
    await conversation.update({
        payload: {
            ...conversationPayload,
            participant_keys: nextParticipantKeys,
            admin_keys: nextAdminKeys,
            last_message: body,
            last_message_at: createdAt,
            unread_by: nextAdminKeys,
            archived_by: (conversationPayload.archived_by || []).filter((key) => key === employeeKey),
        },
    });

    const messagePayload = {
        id: `attendance-break-${breakRecord.id}-${action}-${Date.now()}`,
        conversation_id: conversationId,
        type: 'system',
        body,
        sender_key: 'system:attendance',
        sender_name: 'Attendance System',
        created_at: createdAt,
        attendance_break_id: breakRecord.id,
        attendance_break_action: action,
        employee_id: breakRecord.employeeId,
        employee_record_id: breakRecord.employeeRecordId,
    };
    const message = await ChatMessage.create({
        id: messagePayload.id,
        company_id: companyId,
        conversation_id: conversationId,
        payload: messagePayload,
    });

    const serializedConversation = { ...conversation.payload, id: conversation.id, company_id: companyId };
    const serializedMessage = { ...message.payload, id: message.id, conversation_id: conversationId, company_id: companyId };
    emitToChatRooms(companyId, conversationId, 'conversation:updated', { conversation: serializedConversation });
    emitToChatRooms(companyId, conversationId, 'message:created', { message: serializedMessage, conversation: serializedConversation });
    return serializedMessage;
};

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

router.get('/breaks', async (req, res, next) => {
    try {
        const where = {};
        const andConditions = [];
        const companyId = req.query.companyId || req.query.company_id;
        if (companyId) {
            where.companyId = Number(companyId);
        }

        if (req.query.employeeId || req.query.employee_id) {
            where.employeeId = String(req.query.employeeId || req.query.employee_id);
        }

        if (req.query.workDate || req.query.work_date) {
            where.workDate = String(req.query.workDate || req.query.work_date);
        }

        if (req.query.startDate || req.query.endDate) {
            where.workDate = {};
            if (req.query.startDate) where.workDate[Op.gte] = String(req.query.startDate);
            if (req.query.endDate) where.workDate[Op.lte] = String(req.query.endDate);
        }

        const status = String(req.query.status || '').toLowerCase();
        if (status === 'open') where.breakEnd = null;
        if (status === 'completed') where.breakEnd = { [Op.ne]: null };

        const departmentId = Number(req.query.departmentId || req.query.department_id);
        if (Number.isInteger(departmentId) && departmentId > 0) {
            andConditions.push(
                literal(`EXISTS (
                    SELECT 1
                    FROM employees e
                    WHERE e.company_id = "AttendanceBreak"."company_id"
                      AND e.employee_id = "AttendanceBreak"."employee_id"
                      AND e.department_id = ${departmentId}
                )`),
            );
        }

        const employeeName = String(req.query.employeeName || req.query.employee_name || '').trim();
        if (employeeName) {
            const escapedName = AttendanceBreak.sequelize.escape(`%${employeeName.replace(/[\\%_]/g, '\\$&')}%`);
            andConditions.push(
                literal(`(
                    "AttendanceBreak"."employee_name" ILIKE ${escapedName} ESCAPE '\\'
                    OR EXISTS (
                        SELECT 1
                        FROM employees e
                        WHERE e.company_id = "AttendanceBreak"."company_id"
                          AND e.employee_id = "AttendanceBreak"."employee_id"
                          AND e.name ILIKE ${escapedName} ESCAPE '\\'
                    )
                )`),
            );
        }

        if (andConditions.length > 0) {
            where[Op.and] = andConditions;
        }

        const records = await AttendanceBreak.findAll({
            attributes: breakRecordAttributes,
            where,
            order: [['workDate', 'DESC'], ['breakStart', 'DESC']],
            limit: getQueryLimit(req.query.limit, 500),
            raw: true,
        });

        return res.status(200).json({
            success: true,
            count: records.length,
            data: records.map((record) => ({
                ...record,
                is_open: !record.breakEnd,
            })),
        });
    } catch (err) {
        return next(err);
    }
});

router.get('/break/status', async (req, res, next) => {
    try {
        const employee = await getBreakEmployee(req.query);
        if (!employee) {
            return res.status(422).json({ success: false, message: 'A valid company and employee are required.' });
        }

        const workDate = String(req.query.workDate || req.query.work_date || getBreakWorkDate()).trim();
        const openBreak = await AttendanceBreak.findOne({
            where: {
                companyId: employee.companyId,
                employeeId: employee.employeeId,
                workDate,
                breakEnd: null,
            },
            order: [['breakStart', 'DESC']],
        });

        return res.status(200).json({
            success: true,
            data: {
                is_on_break: Boolean(openBreak),
                break: serializeBreak(openBreak),
            },
        });
    } catch (err) {
        return next(err);
    }
});

router.post('/break/start', async (req, res, next) => {
    try {
        const employee = await getBreakEmployee(req.body);
        if (!employee) {
            return res.status(422).json({ success: false, message: 'A valid company and employee are required.' });
        }

        const workDate = String(req.body?.workDate || req.body?.work_date || getBreakWorkDate()).trim();
        const existing = await AttendanceBreak.findOne({
            where: {
                companyId: employee.companyId,
                employeeId: employee.employeeId,
                workDate,
                breakEnd: null,
            },
            order: [['breakStart', 'DESC']],
        });

        if (existing) {
            return res.status(200).json({ success: true, message: 'Break is already active.', data: serializeBreak(existing) });
        }

        const breakRecord = await AttendanceBreak.create({
            companyId: employee.companyId,
            employeeId: employee.employeeId,
            employeeRecordId: employee.employeeRecordId,
            employeeName: employee.employeeName,
            workDate,
            breakStart: new Date(),
        });

        await notifyAdminsAboutBreak({ breakRecord, action: 'start' });

        return res.status(201).json({
            success: true,
            message: 'Break started.',
            data: serializeBreak(breakRecord),
        });
    } catch (err) {
        return next(err);
    }
});

router.post('/break/end', async (req, res, next) => {
    try {
        const employee = await getBreakEmployee(req.body);
        if (!employee) {
            return res.status(422).json({ success: false, message: 'A valid company and employee are required.' });
        }

        const workDate = String(req.body?.workDate || req.body?.work_date || getBreakWorkDate()).trim();
        const breakRecord = await AttendanceBreak.findOne({
            where: {
                companyId: employee.companyId,
                employeeId: employee.employeeId,
                workDate,
                breakEnd: null,
            },
            order: [['breakStart', 'DESC']],
        });

        if (!breakRecord) {
            return res.status(404).json({ success: false, message: 'No active break found.' });
        }

        await breakRecord.update({ breakEnd: new Date() });
        await notifyAdminsAboutBreak({ breakRecord, action: 'end' });

        return res.status(200).json({
            success: true,
            message: 'Break ended.',
            data: serializeBreak(breakRecord),
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
