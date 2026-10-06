const express = require('express');
const router = express.Router();
const { predictWaitTime } = require('../controllers/ai.controller');

// POST /api/ai/predict-wait-time
router.post('/predict-wait-time', predictWaitTime);

module.exports = router;
