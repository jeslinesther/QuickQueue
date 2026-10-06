const axios = require('axios');

// @route   POST /api/ai/predict-wait-time
// @desc    Call the Python Flask AI service to predict waiting time with safe fallback
// @access  Public / Protected
const predictWaitTime = async (req, res) => {
  const {
    queue_length = 1,
    active_counters = 2,
    service_type = 'General Consultation',
    average_service_time = 5,
    hour = new Date().getHours(),
    day_of_week = new Date().getDay(),
    peak_hour = ((new Date().getHours() >= 11 && new Date().getHours() <= 14) || (new Date().getHours() >= 17 && new Date().getHours() <= 19)) ? 1 : 0,
  } = req.body;

  const aiUrl = process.env.AI_API_URL || 'http://127.0.0.1:5001';

  // Reliable rule-based fallback calculation
  const fallbackAverageMinutes = service_type === 'Technical Support' ? 8 : service_type === 'Account Services' ? 6 : 4;
  const safeCounters = Math.max(1, Number(active_counters) || 1);
  const fallbackPrediction = Math.max(2, Math.round((Number(queue_length) * fallbackAverageMinutes) / safeCounters));

  try {
    const aiResponse = await axios.post(
      `${aiUrl}/predict`,
      {
        queue_length: Number(queue_length),
        active_counters: safeCounters,
        service_type,
        average_service_time: Number(average_service_time),
        hour: Number(hour),
        day_of_week: Number(day_of_week),
        peak_hour: Number(peak_hour),
      },
      { timeout: 2000 }
    );

    if (aiResponse.data && typeof aiResponse.data.predicted_wait_time === 'number') {
      return res.status(200).json({
        success: true,
        predicted_wait_time: Math.max(1, Math.round(aiResponse.data.predicted_wait_time)),
        source: 'ml_model',
      });
    }
  } catch (error) {
    // If AI Flask service is offline or unreachable, return safe fallback calculation
    return res.status(200).json({
      success: true,
      predicted_wait_time: fallbackPrediction,
      source: 'fallback_estimator',
      note: 'AI service temporarily unavailable; estimated using standard queue metrics.',
    });
  }

  return res.status(200).json({
    success: true,
    predicted_wait_time: fallbackPrediction,
    source: 'fallback_estimator',
  });
};

module.exports = {
  predictWaitTime,
};
