const express = require('express');
const router = express.Router();
const { loginStaff, registerStaff } = require('../controllers/auth.controller');
const {
  callNextToken,
  markCustomerArrived,
  startService,
  completeService,
  markMissed,
} = require('../controllers/staff.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public staff auth routes
router.post('/login', loginStaff);
router.post('/register', registerStaff);

// Protected staff queue actions
router.use(protect);
router.use(authorize('staff'));

router.post('/call-next', callNextToken);
router.post('/customer-arrived', markCustomerArrived);
router.post('/start-service', startService);
router.post('/complete', completeService);
router.post('/missed', markMissed);

module.exports = router;
