const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');

// Helper to generate signed JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'quickqueue_default_jwt_secret',
    {
      expiresIn: '7d',
    }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new customer / user
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, phone, password)',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'user',
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during user registration',
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login customer / user
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during user login',
    });
  }
};

// @route   POST /api/staff/login
// @desc    Login counter staff
// @access  Public
const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide staff email and password',
      });
    }

    const staff = await Staff.findOne({ email: email.toLowerCase() });
    if (!staff) {
      return res.status(401).json({
        success: false,
        message: 'Invalid staff email or password',
      });
    }

    const isMatch = await staff.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid staff email or password',
      });
    }

    const token = generateToken(staff._id, staff.role);

    return res.status(200).json({
      success: true,
      message: 'Staff login successful',
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        counterNumber: staff.counterNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during staff login',
    });
  }
};

// @route   POST /api/staff/register
// @desc    Register a new staff member (convenient for setup/onboarding)
// @access  Public
const registerStaff = async (req, res) => {
  try {
    const { name, email, password, counterNumber } = req.body;

    if (!name || !email || !password || !counterNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password, counterNumber)',
      });
    }

    const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'A staff member with this email already exists',
      });
    }

    const staff = await Staff.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'staff',
      counterNumber: Number(counterNumber),
    });

    const token = generateToken(staff._id, staff.role);

    return res.status(201).json({
      success: true,
      message: 'Staff member registered successfully',
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        counterNumber: staff.counterNumber,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during staff registration',
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get logged in user or staff profile
// @access  Private
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  registerUser,
  loginUser,
  loginStaff,
  registerStaff,
  getMe,
};
