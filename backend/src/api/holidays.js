const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');

const getCompanyId = (req) => req.body?.company_id || req.query.company_id || req.query.companyId || null;
const getOccasion = (body = {}) => String(body.occasion || body.occassion || body.name || '').trim();

router.get('/', async (req, res, next) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, message: 'company_id is required' });

    const holidays = await Holiday.findAll({
      where: { company_id: companyId },
      order: [['date', 'ASC']],
    });
    return res.json({ success: true, count: holidays.length, data: holidays });
  } catch (err) {
    return next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const companyId = getCompanyId(req);
    const occasion = getOccasion(req.body);
    const date = String(req.body.date || req.body.holiday_date || '').trim();
    if (!companyId || !date || !occasion) {
      return res.status(400).json({ success: false, message: 'company_id, date, and occasion are required' });
    }

    const holiday = await Holiday.create({ company_id: companyId, date, occasion });
    return res.status(201).json({ success: true, data: holiday });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'A holiday already exists on this date' });
    }
    return next(err);
  }
});

router.post('/bulk', async (req, res, next) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'company_id is required' });
    }

    if (Array.isArray(req.body.holidays)) {
      const records = req.body.holidays.map((item) => ({
        company_id: companyId,
        date: String(item.date || item.holiday_date || '').trim(),
        occasion: getOccasion(item),
      }));
      if (records.length === 0 || records.some((item) => !item.date || !item.occasion)) {
        return res.status(400).json({ success: false, message: 'Every holiday requires a date and occasion' });
      }
      if (new Set(records.map((item) => item.date)).size !== records.length) {
        return res.status(409).json({ success: false, message: 'The same date was added more than once' });
      }

      const created = await Holiday.bulkCreate(records, { returning: true });
      return res.status(201).json({ success: true, count: created.length, data: created });
    }

    const year = Number(req.body.year);
    const weekdays = [...new Set((req.body.weekdays || []).map(Number))]
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    if (!Number.isInteger(year) || weekdays.length === 0) {
      return res.status(400).json({ success: false, message: 'company_id, year, and weekdays are required' });
    }

    const records = [];
    const cursor = new Date(Date.UTC(year, 0, 1));
    while (cursor.getUTCFullYear() === year) {
      if (weekdays.includes(cursor.getUTCDay())) {
        records.push({
          company_id: companyId,
          date: cursor.toISOString().slice(0, 10),
          occasion: cursor.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const created = await Holiday.bulkCreate(records, { ignoreDuplicates: true, returning: true });
    return res.status(201).json({ success: true, count: created.length, data: created });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'A holiday already exists on one of these dates' });
    }
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, message: 'company_id is required' });
    const holiday = await Holiday.findOne({ where: { id: req.params.id, company_id: companyId } });
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });

    const occasion = getOccasion(req.body);
    await holiday.update({
      date: req.body.date || req.body.holiday_date || holiday.date,
      occasion: occasion || holiday.occasion,
    });
    return res.json({ success: true, data: holiday });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'A holiday already exists on this date' });
    }
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ success: false, message: 'company_id is required' });
    const holiday = await Holiday.findOne({ where: { id: req.params.id, company_id: companyId } });
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });
    await holiday.destroy();
    return res.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
