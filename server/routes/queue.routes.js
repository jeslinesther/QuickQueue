const express = require('express');
const router = express.Router();
const { getLiveQueue } = require('../controllers/staff.controller');
const { protect } = require('../middleware/auth.middleware');

// GET /api/queue - Live queue status for staff & users
router.get('/', protect, getLiveQueue);

module.exports = router;
