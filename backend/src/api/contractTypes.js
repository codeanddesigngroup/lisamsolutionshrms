const express = require('express');
const router = express.Router();
const ContractType = require('../models/ContractType');

router.get('/', async (req, res, next) => {
  try {
    const types = await ContractType.findAll({ order: [['id', 'ASC']] });
    return res.json({ success: true, count: types.length, data: types });
  } catch (err) { return next(err); }
});

module.exports = router;
