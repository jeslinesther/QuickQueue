const Token = require('../models/Token');
const Staff = require('../models/Staff');
const axios = require('axios');

const GRACE_PERIOD_SECONDS = 120; // 2 minutes in seconds

/**
 * Service prefix generator based on category
 */
const getServicePrefix = (serviceType) => {
  switch (serviceType) {
    case 'Account Services':
      return 'A';
    case 'Billing & Payments':
      return 'B';
    case 'Technical Support':
      return 'T';
    case 'General Consultation':
    default:
      return 'G';
  }
};

/**
 * Generate next sequential token number for today
 */
const generateNextTokenNumber = async (serviceType) => {
  const prefix = getServicePrefix(serviceType);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const countToday = await Token.countDocuments({
    createdAt: { $gte: startOfDay },
  });

  const nextSeq = 101 + countToday;
  return `${prefix}${nextSeq}`;
};

/**
 * AI Predicted Wait Time with fallback safety
 */
const getPredictedWaitTime = async ({ queueLength, serviceType }) => {
  const activeCountersCount = await Staff.countDocuments();
  const counters = activeCountersCount > 0 ? activeCountersCount : 2;
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  const isPeakHour = (currentHour >= 11 && currentHour <= 14) || (currentHour >= 17 && currentHour <= 19) ? 1 : 0;

  // Rule-based fallback calculation
  const fallbackAverageMinutes = serviceType === 'Technical Support' ? 8 : serviceType === 'Account Services' ? 6 : 4;
  const fallbackWaitTime = Math.max(2, Math.round((queueLength * fallbackAverageMinutes) / counters));

  const aiUrl = process.env.AI_API_URL || 'http://127.0.0.1:5001';

  try {
    const response = await axios.post(
      `${aiUrl}/predict`,
      {
        queue_length: queueLength,
        active_counters: counters,
        service_type: serviceType,
        average_service_time: fallbackAverageMinutes,
        hour: currentHour,
        day_of_week: currentDay,
        peak_hour: isPeakHour,
      },
      { timeout: 2000 } // 2 second timeout for resilience
    );

    if (response.data && typeof response.data.predicted_wait_time === 'number') {
      return Math.max(1, Math.round(response.data.predicted_wait_time));
    }
  } catch (err) {
    // Graceful fallback if AI service is offline or timeout occurs
  }

  return fallbackWaitTime;
};

/**
 * Check and auto-expire / flag tokens whose 2-minute grace period has passed
 */
const checkGracePeriodStatus = (token) => {
  if (token.status !== 'CALLED' || !token.calledAt) {
    return { hasExpiredGrace: false, secondsRemaining: 0 };
  }

  const elapsedSeconds = Math.floor((new Date().getTime() - new Date(token.calledAt).getTime()) / 1000);
  const secondsRemaining = Math.max(0, GRACE_PERIOD_SECONDS - elapsedSeconds);
  const hasExpiredGrace = elapsedSeconds > GRACE_PERIOD_SECONDS;

  return { hasExpiredGrace, secondsRemaining, elapsedSeconds };
};

/**
 * Calculate user queue metrics dynamically
 */
const calculateUserQueueMetrics = async (activeToken) => {
  if (!activeToken) return null;

  let queuePosition = 0;
  let peopleAhead = 0;

  if (activeToken.status === 'WAITING') {
    // Count tokens created or requeued before this token in WAITING status
    const waitingTokens = await Token.find({ status: 'WAITING' }).sort({ updatedAt: 1 });
    const tokenIndex = waitingTokens.findIndex(
      (t) => t._id.toString() === activeToken._id.toString()
    );

    queuePosition = tokenIndex !== -1 ? tokenIndex + 1 : 1;
    peopleAhead = tokenIndex !== -1 ? tokenIndex : 0;
  }

  // Find currently serving token
  const currentServingToken = await Token.findOne({
    status: { $in: ['IN_SERVICE', 'CALLED'] },
  }).sort({ updatedAt: -1 });

  // Grace period metrics
  const { hasExpiredGrace, secondsRemaining } = checkGracePeriodStatus(activeToken);

  // Generate appropriate user in-app notification message
  let notification = null;
  if (activeToken.status === 'CALLED') {
    notification = `🔔 Your token ${activeToken.tokenNumber} has been called to Counter ${activeToken.counter || 1}! You have ${secondsRemaining}s to arrive.`;
  } else if (activeToken.status === 'IN_SERVICE') {
    notification = `✨ Your token ${activeToken.tokenNumber} is now being served at Counter ${activeToken.counter || 1}.`;
  } else if (activeToken.status === 'WAITING') {
    if (peopleAhead === 0) {
      notification = `⚡ You are next in line! Please stay ready.`;
    } else if (peopleAhead <= 2) {
      notification = `⏳ Your token is approaching! Only ${peopleAhead} person(s) ahead.`;
    }
  }

  return {
    activeToken,
    queuePosition,
    peopleAhead,
    currentServingToken: currentServingToken ? currentServingToken.tokenNumber : 'None',
    counter: activeToken.counter,
    secondsRemaining,
    hasExpiredGrace,
    notification,
  };
};

module.exports = {
  generateNextTokenNumber,
  getPredictedWaitTime,
  checkGracePeriodStatus,
  calculateUserQueueMetrics,
  GRACE_PERIOD_SECONDS,
};
