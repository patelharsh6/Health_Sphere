const Patient = require('../models/Patient');
const User = require('../models/User');
const Report = require('../models/Report');
const { calculateRiskScore } = require('../utils/riskCalculator');

/**
 * @desc    Get patient profile (own or by ID for doctor/admin)
 * @route   GET /api/patients/profile
 * @route   GET /api/patients/:id
 * @access  Private
 */
const getPatientProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user._id;

    const patient = await Patient.findOne({ user: userId }).populate('user', 'fullName email phone avatar');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('GetPatientProfile Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Update patient profile
 * @route   PUT /api/patients/profile
 * @access  Private (Patient)
 */
const updatePatientProfile = async (req, res) => {
  try {
    const {
      dateOfBirth, gender, bloodGroup, height, weight,
      allergies, chronicConditions, emergencyContact,
    } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Update fields if provided
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (height) patient.height = height;
    if (weight) patient.weight = weight;
    if (allergies) patient.allergies = allergies;
    if (chronicConditions) patient.chronicConditions = chronicConditions;
    if (emergencyContact) patient.emergencyContact = emergencyContact;

    await patient.save();

    // Also update user basic info if provided
    const { fullName, phone } = req.body;
    if (fullName || phone) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: patient,
    });
  } catch (error) {
    console.error('UpdatePatientProfile Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get patient dashboard summary
 * @route   GET /api/patients/dashboard
 * @access  Private (Patient)
 */
const getDashboard = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Get recent reports
    const reports = await Report.find({ patient: req.user._id })
      .sort({ uploadDate: -1 })
      .limit(5);

    // Calculate risk score
    const riskAssessment = calculateRiskScore(patient, reports);

    // Get appointment count (lazy import to avoid circular)
    const Appointment = require('../models/Appointment');
    const upcomingAppointments = await Appointment.countDocuments({
      patient: req.user._id,
      date: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] },
    });

    const totalAppointments = await Appointment.countDocuments({ patient: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        patient,
        stats: {
          totalReports: reports.length,
          upcomingAppointments,
          totalAppointments,
        },
        riskAssessment,
        recentReports: reports,
      },
    });
  } catch (error) {
    console.error('GetDashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getPatientProfile, updatePatientProfile, getDashboard };
