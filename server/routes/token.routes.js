const express = require('express');
const router = express.Router();
const {
  createToken,
  getCurrentToken,
  getTokenHistory,
} = require('../controllers/token.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Protect all token routes for authenticated users
router.use(protect);
router.use(authorize('user'));

router.post('/', createToken);
router.get('/current', getCurrentToken);
router.get('/history', getTokenHistory);

module.exports = router;
