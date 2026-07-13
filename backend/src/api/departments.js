const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const Employee = require('../models/Employee');

router.post('/', async (req, res, next) => {
    try {
        const companyId = req.body.company_id || req.query.company_id;
        const name = String(req.body.name || '').trim();

        if (!companyId || !name) {
            return res.status(400).json({
                success: false,
                message: 'company_id and name are required',
            });
        }

        const department = await Department.create({
            company_id: companyId,
            name,
        });

        return res.status(201).json({
            success: true,
            data: department,
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

        const departments = await Department.findAll({
            where,
            order: [['id', 'ASC']],
        });

        return res.status(200).json({
            success: true,
            count: departments.length,
            data: departments,
        });
    } catch (err) {
        next(err);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const companyId = req.body.company_id || req.query.company_id;
        const name = String(req.body.name || '').trim();
        const where = { id: req.params.id };

        if (companyId) {
            where.company_id = companyId;
        }

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'name is required',
            });
        }

        const department = await Department.findOne({ where });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        await department.update({ name });

        return res.status(200).json({
            success: true,
            data: department,
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: 'Department already exists for this company',
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

        const department = await Department.findOne({ where });

        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found',
            });
        }

        await Employee.update(
            { department_id: null },
            { where: { department_id: department.id, ...(companyId ? { company_id: companyId } : {}) } },
        );
        await department.destroy();

        return res.status(200).json({
            success: true,
            message: 'Department deleted successfully',
        });
    } catch (err) {
        return next(err);
    }
});



module.exports = router;
