const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Disease = require('../models/Disease');
const Medicine = require('../models/Medicine');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const verifiedDoctors = await Doctor.countDocuments({ isVerified: true });
    
    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalReports = await Report.countDocuments();
    const totalDiseases = await Disease.countDocuments();
    const totalMedicines = await Medicine.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          patients: totalPatients,
          doctors: totalDoctors,
          verifiedDoctors: verifiedDoctors
        },
        appointments: appointmentsByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        content: {
          reports: totalReports,
          diseases: totalDiseases,
          medicines: totalMedicines
        }
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get all users (excluding passwords)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Activate or deactivate user
 * @route   PUT /api/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    // Don't let admin deactivate themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete a user completely
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin accounts directly.' });
    }

    // Delete associated profile
    if (user.role === 'patient') {
      await Patient.findOneAndDelete({ user: user._id });
    } else if (user.role === 'doctor') {
      await Doctor.findOneAndDelete({ user: user._id });
    }

    await User.findByIdAndDelete(user._id);

    res.status(200).json({ success: true, message: 'User deleted completely.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get doctors pending verification
 * @route   GET /api/admin/doctors/pending
 * @access  Private/Admin
 */
const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ isVerified: false })
      .populate('user', 'fullName email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: pendingDoctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Verify a doctor's medical license
 * @route   PUT /api/admin/doctors/:id/verify
 * @access  Private/Admin
 */
const verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    doctor.isVerified = true;
    await doctor.save();

    res.status(200).json({ success: true, message: 'Doctor verified successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get all appointments across platform
 * @route   GET /api/admin/appointments
 * @access  Private/Admin
 */
const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'fullName')
      .populate('doctor', 'fullName')
      .sort({ date: -1, timeSlot: 1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ------------------------------------------------------------------
// CONTENT MANAGEMENT (Basic CRUD for Diseases & Medicines)
// ------------------------------------------------------------------

const getDiseases = async (req, res) => {
  try {
    const diseases = await Disease.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: diseases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteDisease = async (req, res) => {
  try {
    await Disease.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Disease deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createDisease = async (req, res) => {
  try {
    const disease = await Disease.create(req.body);
    res.status(201).json({ success: true, data: disease });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Medicine deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getPendingDoctors,
  verifyDoctor,
  getAppointments,
  getDiseases,
  deleteDisease,
  createDisease,
  getMedicines,
  deleteMedicine,
  createMedicine
};
