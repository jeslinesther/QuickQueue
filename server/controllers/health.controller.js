// Health check controller
const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "QuickQueue API is running"
  });
};

module.exports = {
  getHealthStatus
};
