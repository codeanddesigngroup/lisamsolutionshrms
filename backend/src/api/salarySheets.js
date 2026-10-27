const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const sequelize = require('../config/db');
const Employee = require('../models/Employee');
const SalarySheet = require('../models/SalarySheet');

router.get('/', async (req, res, next) => {
  try {
    const companyId = Number(req.query.company_id || req.query.companyId);
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (!Number.isInteger(companyId) || companyId < 1 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
      return res.status(400).json({ success: false, message: 'company_id, month, and year are required' });
    }

    const where = { company_id: companyId, month, year };
    if (req.query.department_id) where.department_id = Number(req.query.department_id);
    const records = await SalarySheet.findAll({ where, order: [['employee_name', 'ASC']] });
    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const companyId = Number(req.body.company_id);
    const departmentId = Number(req.body.department_id);
    const month = Number(req.body.month);
    const year = Number(req.body.year);
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!Number.isInteger(companyId) || companyId < 1 || !Number.isInteger(departmentId) || departmentId < 1 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || rows.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'company_id, department_id, month, year, and at least one row are required' });
    }

    const employeeIds = [...new Set(rows.map((row) => Number(row.employeeId)).filter((id) => Number.isInteger(id) && id > 0))];
    if (employeeIds.length !== rows.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Every salary row must have a valid employee' });
    }
    const employees = await Employee.findAll({
      where: { company_id: companyId, department_id: departmentId, id: { [Op.in]: employeeIds } },
      attributes: ['id', 'name'],
      transaction,
    });
    if (employees.length !== employeeIds.length) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'One or more employees do not belong to this department and company' });
    }
    const employeeById = new Map(employees.map((employee) => [Number(employee.id), employee]));
    const departmentName = String(req.body.department_name || '').trim();
    const templateName = String(req.body.template_name || 'Department Salary Form').trim();
    const saved = [];
    for (const row of rows) {
      const employeeId = Number(row.employeeId);
      const employee = employeeById.get(employeeId);
      const [record] = await SalarySheet.findOrCreate({
        where: { company_id: companyId, department_id: departmentId, employee_id: employeeId, month, year },
        defaults: {
          company_id: companyId,
          department_id: departmentId,
          department_name: departmentName || 'Department',
          employee_id: employeeId,
          employee_name: employee.name,
          month,
          year,
          values: row.values && typeof row.values === 'object' ? row.values : {},
          totals: row.totals && typeof row.totals === 'object' ? row.totals : {},
          template_id: req.body.template_id || null,
          template_name: templateName || 'Department Salary Form',
        },
        transaction,
      });
      await record.update({
        department_name: departmentName || 'Department',
        employee_name: employee.name,
        values: row.values && typeof row.values === 'object' ? row.values : {},
        totals: row.totals && typeof row.totals === 'object' ? row.totals : {},
        template_id: req.body.template_id || null,
        template_name: templateName || 'Department Salary Form',
      }, { transaction });
      saved.push(record);
    }
    await transaction.commit();
    return res.status(200).json({ success: true, count: saved.length, data: saved });
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const companyId = Number(req.query.company_id || req.query.companyId);
    const sheetId = Number(req.params.id);
    if (!Number.isInteger(companyId) || companyId < 1 || !Number.isInteger(sheetId) || sheetId < 1) {
      return res.status(400).json({ success: false, message: 'company_id and a valid salary sheet id are required' });
    }
    const record = await SalarySheet.findOne({ where: { id: sheetId, company_id: companyId } });
    if (!record) return res.status(404).json({ success: false, message: 'Salary sheet not found' });
    await record.destroy();
    return res.status(200).json({ success: true, message: 'Salary sheet deleted' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
