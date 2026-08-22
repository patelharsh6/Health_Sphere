const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Disease = require('../models/Disease');
const Medicine = require('../models/Medicine');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getStats = async (req, res) => {
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
};

/**
 * @desc    Get all users (excluding passwords)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: users });
};

/**
 * @desc    Activate or deactivate user
 * @route   PUT /api/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = async (req, res) => {
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
};

/**
 * @desc    Delete a user completely
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res) => {
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
};

/**
 * @desc    Get doctors pending verification
 * @route   GET /api/admin/doctors/pending
 * @access  Private/Admin
 */
const getPendingDoctors = async (req, res) => {
  const pendingDoctors = await Doctor.find({ isVerified: false })
    .populate('user', 'fullName email phone')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: pendingDoctors });
};

/**
 * @desc    Verify a doctor's medical license
 * @route   PUT /api/admin/doctors/:id/verify
 * @access  Private/Admin
 */
const verifyDoctor = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

  doctor.isVerified = true;
  await doctor.save();

  res.status(200).json({ success: true, message: 'Doctor verified successfully.' });
};

/**
 * @desc    Get all appointments across platform
 * @route   GET /api/admin/appointments
 * @access  Private/Admin
 */
const getAppointments = async (req, res) => {
  const appointments = await Appointment.find()
    .populate('patient', 'fullName')
    .populate('doctor', 'fullName')
    .sort({ date: -1, timeSlot: 1 });
  res.status(200).json({ success: true, data: appointments });
};

// ------------------------------------------------------------------
// CONTENT MANAGEMENT (Basic CRUD for Diseases & Medicines)
// ------------------------------------------------------------------

const getDiseases = async (req, res) => {
  const diseases = await Disease.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: diseases });
};

const deleteDisease = async (req, res) => {
  await Disease.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Disease deleted' });
};

const createDisease = async (req, res) => {
  const disease = await Disease.create(req.body);
  res.status(201).json({ success: true, data: disease });
};

const getMedicines = async (req, res) => {
  const medicines = await Medicine.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: medicines });
};

const deleteMedicine = async (req, res) => {
  await Medicine.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Medicine deleted' });
};

const createMedicine = async (req, res) => {
  const medicine = await Medicine.create(req.body);
  res.status(201).json({ success: true, data: medicine });
};

module.exports = {
  getStats: asyncHandler(getStats),
  getUsers: asyncHandler(getUsers),
  updateUserStatus: asyncHandler(updateUserStatus),
  deleteUser: asyncHandler(deleteUser),
  getPendingDoctors: asyncHandler(getPendingDoctors),
  verifyDoctor: asyncHandler(verifyDoctor),
  getAppointments: asyncHandler(getAppointments),
  getDiseases: asyncHandler(getDiseases),
  deleteDisease: asyncHandler(deleteDisease),
  createDisease: asyncHandler(createDisease),
  getMedicines: asyncHandler(getMedicines),
  deleteMedicine: asyncHandler(deleteMedicine),
  createMedicine: asyncHandler(createMedicine),
};
