const Token = require('../models/Token');
const { checkGracePeriodStatus } = require('../services/queue.service');

// @route   GET /api/queue
// @desc    Get live queue overview (waiting, called, in-service, and completed)
// @access  Private (Staff or User)
const getLiveQueue = async (req, res) => {
  try {
    // Waiting tokens sorted by updatedAt ascending (FIFO)
    const waitingQueue = await Token.find({ status: 'WAITING' })
      .populate('user', 'name email phone')
      .sort({ updatedAt: 1 });

    // Called tokens under 2-min grace period
    const calledTokens = await Token.find({ status: 'CALLED' })
      .populate('user', 'name email phone')
      .sort({ calledAt: 1 });

    // In-service tokens currently being attended to
    const inServiceTokens = await Token.find({ status: 'IN_SERVICE' })
      .populate('user', 'name email phone')
      .sort({ startedAt: 1 });

    // Recent 10 completed/missed/expired tokens for history
    const recentHistory = await Token.find({
      status: { $in: ['COMPLETED', 'MISSED', 'EXPIRED'] },
    })
      .populate('user', 'name email phone')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Attach grace period info to called tokens
    const enrichedCalledTokens = calledTokens.map((t) => {
      const grace = checkGracePeriodStatus(t);
      return {
        ...t.toObject(),
        secondsRemaining: grace.secondsRemaining,
        hasExpiredGrace: grace.hasExpiredGrace,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        waitingQueue,
        calledTokens: enrichedCalledTokens,
        inServiceTokens,
        recentHistory,
        stats: {
          waitingCount: waitingQueue.length,
          calledCount: calledTokens.length,
          inServiceCount: inServiceTokens.length,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching live queue',
    });
  }
};

// @route   POST /api/staff/call-next
// @desc    Call the next FIFO waiting token for this counter
// @access  Private (Staff)
const callNextToken = async (req, res) => {
  try {
    const counterNumber = req.user.counterNumber;

    // Check if staff already has an active token in service at this counter
    const activeAtCounter = await Token.findOne({
      counter: counterNumber,
      status: { $in: ['IN_SERVICE', 'CALLED'] },
    });

    if (activeAtCounter) {
      return res.status(400).json({
        success: false,
        message: `Counter ${counterNumber} already has an active token (${activeAtCounter.tokenNumber}) in status '${activeAtCounter.status}'. Please complete or mark it missed before calling the next token.`,
      });
    }

    // Fetch the earliest waiting token (FIFO)
    const nextToken = await Token.findOne({ status: 'WAITING' }).sort({ updatedAt: 1 });

    if (!nextToken) {
      return res.status(404).json({
        success: false,
        message: 'No waiting customers in the queue.',
      });
    }

    nextToken.status = 'CALLED';
    nextToken.counter = counterNumber;
    nextToken.calledAt = new Date();
    nextToken.arrivedAt = null;
    nextToken.startedAt = null;

    await nextToken.save();
    await nextToken.populate('user', 'name email phone');

    return res.status(200).json({
      success: true,
      message: `Token ${nextToken.tokenNumber} called to Counter ${counterNumber}. 2-minute grace period started.`,
      data: nextToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error calling next token',
    });
  }
};

// @route   POST /api/staff/customer-arrived
// @desc    Mark customer arrived at the counter within grace period
// @access  Private (Staff)
const markCustomerArrived = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token ID is required',
      });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    if (token.status !== 'CALLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark arrival for token with status '${token.status}'. Token must be in 'CALLED' status.`,
      });
    }

    token.arrivedAt = new Date();
    await token.save();
    await token.populate('user', 'name email phone');

    return res.status(200).json({
      success: true,
      message: `Customer with Token ${token.tokenNumber} arrived. Ready to start service.`,
      data: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error marking arrival',
    });
  }
};

// @route   POST /api/staff/start-service
// @desc    Start servicing the arrived customer
// @access  Private (Staff)
const startService = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token ID is required',
      });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    if (token.status !== 'CALLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot start service for token in status '${token.status}'. Token must be 'CALLED'.`,
      });
    }

    if (!token.arrivedAt) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start service before customer is marked as arrived.',
      });
    }

    token.status = 'IN_SERVICE';
    token.startedAt = new Date();
    await token.save();
    await token.populate('user', 'name email phone');

    return res.status(200).json({
      success: true,
      message: `Service started for Token ${token.tokenNumber} at Counter ${token.counter}.`,
      data: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error starting service',
    });
  }
};

// @route   POST /api/staff/complete
// @desc    Complete service for current customer
// @access  Private (Staff)
const completeService = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token ID is required',
      });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    if (token.status !== 'IN_SERVICE') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete a token in status '${token.status}'. Token must be 'IN_SERVICE'.`,
      });
    }

    token.status = 'COMPLETED';
    token.completedAt = new Date();
    await token.save();
    await token.populate('user', 'name email phone');

    return res.status(200).json({
      success: true,
      message: `Service completed for Token ${token.tokenNumber}. Counter is now free.`,
      data: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error completing service',
    });
  }
};

// @route   POST /api/staff/missed
// @desc    Mark token as missed after 2-minute grace period expires.
//          First miss: requeued at the END of the waiting queue.
//          Second miss: status set to EXPIRED.
// @access  Private (Staff)
const markMissed = async (req, res) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Token ID is required',
      });
    }

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    if (token.status !== 'CALLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark missed for token in status '${token.status}'. Token must be 'CALLED'.`,
      });
    }

    const newMissedCount = (token.missedCount || 0) + 1;

    if (newMissedCount >= 2) {
      // Second miss => EXPIRED permanently
      token.status = 'EXPIRED';
      token.missedCount = newMissedCount;
      token.completedAt = new Date();
      await token.save();
      await token.populate('user', 'name email phone');

      return res.status(200).json({
        success: true,
        action: 'EXPIRED',
        message: `Token ${token.tokenNumber} missed twice. Token has EXPIRED and is removed from the queue.`,
        data: token,
      });
    } else {
      // First miss => Requeue at the END of the queue
      token.status = 'WAITING';
      token.missedCount = newMissedCount;
      token.counter = null;
      token.calledAt = null;
      token.arrivedAt = null;
      token.startedAt = null;
      // Updating updatedAt moves it to the end of FIFO sort ({ updatedAt: 1 })
      token.updatedAt = new Date();

      await token.save();
      await token.populate('user', 'name email phone');

      return res.status(200).json({
        success: true,
        action: 'REQUEUED',
        message: `Token ${token.tokenNumber} missed 1st call. Moved to the END of the waiting queue.`,
        data: token,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error marking token missed',
    });
  }
};

module.exports = {
  getLiveQueue,
  callNextToken,
  markCustomerArrived,
  startService,
  completeService,
  markMissed,
};
