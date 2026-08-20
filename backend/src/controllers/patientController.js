const Patient = require('../models/Patient');
const User = require('../models/User');
const Report = require('../models/Report');
const { calculateRiskScore } = require('../utils/riskCalculator');

/**
 * @desc    Get the logged-in patient's own profile
 * @route   GET /api/patients/profile
 * @access  Private (Patient)
 */
const getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id }).populate(
      'user',
      'fullName email phone avatar'
    );

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
 * @desc    Get another patient's profile — doctors may only read patients
 *          they actually treat; admins may read anyone.
 * @route   GET /api/patients/:id      (:id is the patient's User id)
 * @access  Private (Doctor / Admin)
 */
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.params.id }).populate(
      'user',
      'fullName email phone avatar'
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // A doctor is only entitled to a patient they share an appointment with
    if (req.user.role === 'doctor') {
      const Appointment = require('../models/Appointment');
      const treats = await Appointment.exists({
        doctor: req.user._id,
        patient: patient.user._id,
      });

      if (!treats) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this patient.',
        });
      }
    }

    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('GetPatientById Error:', error);
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

    // Only skip a field when the client omitted it — an empty string or 0 is
    // a deliberate value, not "unchanged".
    const provided = (value) => value !== undefined;

    if (dateOfBirth) patient.dateOfBirth = dateOfBirth; // required field, never clear it
    if (gender) patient.gender = gender;                // enum with no empty member
    if (provided(bloodGroup)) patient.bloodGroup = bloodGroup;
    // The profile form sends null for a cleared numeric input
    if (provided(height)) patient.height = height === null || height === '' ? null : Number(height);
    if (provided(weight)) patient.weight = weight === null || weight === '' ? null : Number(weight);
    if (provided(allergies)) patient.allergies = allergies;
    if (provided(chronicConditions)) patient.chronicConditions = chronicConditions;
    if (provided(emergencyContact)) patient.emergencyContact = emergencyContact;

    await patient.save();

    // Also update user basic info if provided
    const { fullName, phone } = req.body;
    if (fullName || phone) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          ...(fullName && { fullName }),
          ...(phone && { phone }),
        },
        { runValidators: true }
      );
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

module.exports = {
  getPatientProfile,
  getPatientById,
  updatePatientProfile,
  getDashboard,
};
