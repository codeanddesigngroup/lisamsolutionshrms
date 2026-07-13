const express = require('express');
const router = express.Router();
const ShiftType = require('../models/ShiftType');
const Employee = require('../models/Employee');

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
            return res.status(409).json({
                success: false,
                message: 'Shift already exists for this company',
            });
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

        await Employee.update(
            { shift_type_id: null },
            { where: { shift_type_id: shift.id, ...(companyId ? { company_id: companyId } : {}) } },
        );
        await shift.destroy();

        return res.status(200).json({
            success: true,
            message: 'Shift deleted successfully',
        });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
