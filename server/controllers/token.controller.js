const Token = require('../models/Token');
const {
  generateNextTokenNumber,
  getPredictedWaitTime,
  calculateUserQueueMetrics,
} = require('../services/queue.service');

// @route   POST /api/tokens
// @desc    Generate a new online queue token for the authenticated user
// @access  Private (User)
const createToken = async (req, res) => {
  try {
    const { serviceType } = req.body;
    const userId = req.user._id;

    if (!serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid service type',
      });
    }

    // Check if user already has an active token in the queue
    const existingActiveToken = await Token.findOne({
      user: userId,
      status: { $in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
    });

    if (existingActiveToken) {
      return res.status(400).json({
        success: false,
        message: `You already have an active token (${existingActiveToken.tokenNumber}) with status '${existingActiveToken.status}'. You cannot generate another token until your current token is completed or expired.`,
      });
    }

    // Calculate current queue length for WAITING tokens
    const waitingQueueLength = await Token.countDocuments({ status: 'WAITING' });

    // Generate next token number
    const tokenNumber = await generateNextTokenNumber(serviceType);

    // Predict wait time using AI / Fallback
    const predictedWaitTime = await getPredictedWaitTime({
      queueLength: waitingQueueLength + 1,
      serviceType,
    });

    const token = await Token.create({
      tokenNumber,
      user: userId,
      serviceType,
      status: 'WAITING',
      queuePosition: waitingQueueLength + 1,
      predictedWaitTime,
    });

    return res.status(201).json({
      success: true,
      message: `Token ${tokenNumber} generated successfully!`,
      data: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating token',
    });
  }
};

// @route   GET /api/tokens/current
// @desc    Get current active token & live queue metrics for authenticated user
// @access  Private (User)
const getCurrentToken = async (req, res) => {
  try {
    const userId = req.user._id;

    const activeToken = await Token.findOne({
      user: userId,
      status: { $in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
    });

    if (!activeToken) {
      return res.status(200).json({
        success: true,
        hasActiveToken: false,
        message: 'No active token found in queue',
        data: null,
      });
    }

    const metrics = await calculateUserQueueMetrics(activeToken);

    return res.status(200).json({
      success: true,
      hasActiveToken: true,
      data: {
        token: activeToken,
        queuePosition: metrics.queuePosition,
        peopleAhead: metrics.peopleAhead,
        currentServingToken: metrics.currentServingToken,
        counter: metrics.counter,
        secondsRemaining: metrics.secondsRemaining,
        hasExpiredGrace: metrics.hasExpiredGrace,
        notification: metrics.notification,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching current token',
    });
  }
};

// @route   GET /api/tokens/history
// @desc    Get user's past token history
// @access  Private (User)
const getTokenHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const tokens = await Token.find({
      user: userId,
      status: { $in: ['COMPLETED', 'MISSED', 'EXPIRED'] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching token history',
    });
  }
};

module.exports = {
  createToken,
  getCurrentToken,
  getTokenHistory,
};
