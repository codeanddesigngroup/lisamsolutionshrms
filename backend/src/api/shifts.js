const express = require('express');
const router = express.Router();
const ShiftType = require('../models/ShiftType');
const Employee = require('../models/Employee');
const sequelize = require('../config/db');

const normalizeTime = (value) => String(value || '').trim().slice(0, 5);

const findDuplicateShift = async ({ companyId, shiftName, startTime, endTime, excludeId }) => {
    const shifts = await ShiftType.findAll({
        where: { company_id: companyId },
        attributes: ['id', 'type', 'start_time', 'end_time'],
    });
    const normalizedName = shiftName.trim().toLowerCase();

    return shifts.find((shift) =>
        String(shift.id) !== String(excludeId || '') &&
        String(shift.type || '').trim().toLowerCase() === normalizedName &&
        normalizeTime(shift.start_time) === normalizeTime(startTime) &&
        normalizeTime(shift.end_time) === normalizeTime(endTime),
    );
};

const duplicateShiftResponse = (res) => res.status(409).json({
    success: false,
    message: 'A shift with this name and time already exists for this company.',
});

router.post('/', async (req, res, next) => {
    try {
        const {
            name,
            type,
            start_time,
            end_time,
            break_minutes = 0,
            late_grace_minutes = 0,
            shift_hours,
        } = req.body;
        const companyId = req.body.company_id || req.query.company_id;
        const shiftName = String(name || type || '').trim();

        if (!companyId || !shiftName || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'company_id, name, start_time, and end_time are required',
            });
        }

        if (await findDuplicateShift({ companyId, shiftName, startTime: start_time, endTime: end_time })) {
            return duplicateShiftResponse(res);
        }

        const shift = await ShiftType.create({
            company_id: companyId,
            type: shiftName,
            start_time,
            end_time,
            break_minutes,
            late_grace_minutes,
            shift_hours,
        });

        return res.status(201).json({
            success: true,
            data: shift,
        });

    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return duplicateShiftResponse(res);
        }
        next(err);
    }
});



router.get('/', async (req, res, next) => {
    try {
        const where = {};
        if (req.query.company_id) {
            where.company_id = req.query.company_id;
        }

        const shifts = await ShiftType.findAll({
            where,
            order: [['id', 'ASC']],
        });

        return res.status(200).json({
            success: true,
            count: shifts.length,
            data: shifts,
        });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const {
            name,
            type,
            start_time,
            end_time,
            break_minutes = 0,
            late_grace_minutes = 0,
            shift_hours = 0,
        } = req.body;
        const companyId = req.body.company_id || req.query.company_id;
        const shiftName = String(name || type || '').trim();
        const where = { id: req.params.id };

        if (companyId) {
            where.company_id = companyId;
        }

        if (!shiftName || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'name, start_time, and end_time are required',
            });
        }

        const shift = await ShiftType.findOne({ where });

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found',
            });
        }

        if (await findDuplicateShift({
            companyId: shift.company_id,
            shiftName,
            startTime: start_time,
            endTime: end_time,
            excludeId: shift.id,
        })) {
            return duplicateShiftResponse(res);
        }

        await shift.update({
            type: shiftName,
            start_time,
            end_time,
            break_minutes,
            late_grace_minutes,
            shift_hours,
        });

        return res.status(200).json({
            success: true,
            data: shift,
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return duplicateShiftResponse(res);
        }

        return next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const companyId = req.body.company_id || req.query.company_id;
        const where = { id: req.params.id };

        if (companyId) {
            where.company_id = companyId;
        }

        const shift = await ShiftType.findOne({ where });

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found',
            });
        }

        await sequelize.transaction(async (transaction) => {
            await Employee.update(
                { shift_type_id: null },
                { where: { shift_type_id: shift.id, company_id: shift.company_id }, transaction },
            );
            await shift.destroy({ transaction });
        });

        return res.status(200).json({
            success: true,
            message: 'Shift deleted successfully',
        });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
