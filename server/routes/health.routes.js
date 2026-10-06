const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/health.controller');

// @route   GET /api/health
// @desc    Health check endpoint to verify server status
// @access  Public
router.get('/health', getHealthStatus);

module.exports = router;
