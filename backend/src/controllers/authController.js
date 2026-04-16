const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Register a new user (Patient / Doctor / Admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const {
      fullName, email, phone, password, role,
      // Patient fields
      dob, gender,
      // Doctor fields
      medicalLicense, specialization,
      // Admin fields
      hospitalId,
      // Checkboxes
      termsAccepted, aiDisclaimerAccepted,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Check if medical license already exists for a doctor
    if (role === 'doctor' && medicalLicense) {
      const existingLicense = await Doctor.findOne({ medicalLicense });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: 'A doctor with this medical license is already registered.',
        });
      }
    }

    // Create base user
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: role || 'patient',
      termsAccepted,
      aiDisclaimerAccepted,
    });

    // Create role-specific profile
    if (role === 'patient' || !role) {
      await Patient.create({
        user: user._id,
        dateOfBirth: dob,
        gender,
      });
    } else if (role === 'doctor') {
      await Doctor.create({
        user: user._id,
        medicalLicense,
        specialization,
        isVerified: true,
        availableSlots: [
          { day: 'Monday', startTime: '09:00', endTime: '16:00' },
          { day: 'Tuesday', startTime: '09:00', endTime: '16:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '16:00' },
          { day: 'Thursday', startTime: '09:00', endTime: '16:00' },
          { day: 'Friday', startTime: '09:00', endTime: '16:00' },
        ]
      });
    }
    // Admin doesn't need a separate profile for now

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if role matches (optional: enforce role-based login)
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `No ${role} account found with this email.`,
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact support.',
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        profile,
      },
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
