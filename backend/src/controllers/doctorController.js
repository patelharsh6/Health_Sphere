const Doctor = require('../models/Doctor');
const { parsePagination, paginated } = require('../utils/paginate');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const DoctorPatientLink = require('../models/DoctorPatientLink');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all doctors (with optional filters)
 * @route   GET /api/doctors
 * @access  Public
 */
const getAllDoctors = async (req, res) => {
  const { specialization, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const match = { isVerified: true };
  if (specialization && specialization !== 'All') {
    match.specialization = specialization;
  }

  // Search spans the doctor's own fields AND the linked User's name, so it has
  // to run after a $lookup. Doing it in memory (the previous approach) meant
  // loading every verified doctor on every search, and the search branch
  // returned `count` with no `page`/`pages`, which broke the client pager.
  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user',
        pipeline: [{ $project: { fullName: 1, email: 1, phone: 1, avatar: 1 } }],
      },
    },
    // Doctors whose User was deleted are skipped rather than crashing on
    // `doc.user.fullName`, which is what the in-memory filter used to do.
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
  ];

  if (search) {
    // Escaped so a stray "(" or "*" in the query cannot throw or alter the regex.
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    pipeline.push({ $match: { $or: [{ 'user.fullName': rx }, { hospital: rx }] } });
  }

  // $facet gets the page and the total in a single round trip.
  pipeline.push({
    $facet: {
      data: [{ $sort: { rating: -1, _id: 1 } }, { $skip: skip }, { $limit: limit }],
      total: [{ $count: 'value' }],
    },
  });

  const [result] = await Doctor.aggregate(pipeline);
  const total = result?.total?.[0]?.value || 0;

  res.status(200).json(paginated(result?.data || [], total, { page, limit }));
};

/**
 * @desc    Get single doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Public
 */
const getDoctorById = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('user', 'fullName email phone avatar');

  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }

  res.status(200).json({ success: true, data: doctor });
};

/**
 * @desc    Update doctor profile
 * @route   PUT /api/doctors/profile
 * @access  Private (Doctor)
 */
const updateDoctorProfile = async (req, res) => {
  const {
    specialization, experience, hospital,
    consultationFee, bio, weeklySchedule, slotDuration, blockedDates,
  } = req.body;

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
  }

  // 0 is a legitimate value for the numeric fields, so test against
  // undefined rather than falsiness. The profile form sends null for a
  // cleared number — leave the stored value alone in that case, since
  // consultationFee feeds Appointment.consultationFee (a required field).
  const hasNumber = (value) => value !== undefined && value !== null && value !== '';

  if (specialization) doctor.specialization = specialization;
  if (hasNumber(experience)) doctor.experience = Number(experience);
  if (hospital) doctor.hospital = hospital;
  if (hasNumber(consultationFee)) doctor.consultationFee = Number(consultationFee);
  if (bio !== undefined) doctor.bio = bio;
  if (weeklySchedule !== undefined) doctor.weeklySchedule = weeklySchedule;
  if (slotDuration !== undefined) doctor.slotDuration = slotDuration;
  if (blockedDates !== undefined) doctor.blockedDates = blockedDates;

  await doctor.save();

  // Update user basic info if provided
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
    message: 'Doctor profile updated.',
    data: doctor,
  });
};

/**
 * @desc    Get available time slots for a doctor on a given date
 * @route   GET /api/doctors/:id/slots?date=YYYY-MM-DD
 * @access  Public
 */
const getAvailableSlots = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required.' });
  }

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }

  // Get the day of week for the requested date
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const daySchedule = doctor.weeklySchedule?.find((s) => s.day === dayOfWeek);

  // Check if date is blocked
  const isBlocked = doctor.blockedDates?.some(blockedDate => 
    new Date(blockedDate).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
  );

  if (isBlocked || !daySchedule || !daySchedule.enabled || !daySchedule.slots || daySchedule.slots.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'Doctor is not available on this day.',
      data: [],
    });
  }

  const slots = daySchedule.slots.map(timeStr => ({ time: timeStr, available: true }));

  // Check existing appointments and mark booked slots as unavailable
  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const bookedAppointments = await Appointment.find({
    doctor: doctor.user,
    date: { $gte: dayStart, $lt: dayEnd },
    status: { $in: ['pending', 'confirmed'] },
  });

  const bookedTimes = bookedAppointments.map((a) => a.time);
  slots.forEach((slot) => {
    if (bookedTimes.includes(slot.time)) {
      slot.available = false;
    }
  });

  res.status(200).json({ success: true, data: slots });
};

/**
 * @desc    Get doctor dashboard stats
 * @route   GET /api/doctors/dashboard
 * @access  Private (Doctor)
 */
const getDoctorDashboard = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  // Today's appointments
  const todayAppointments = await Appointment.countDocuments({
    doctor: req.user._id,
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ['pending', 'confirmed'] },
  });

  // Week's appointments
  const weekAppointments = await Appointment.countDocuments({
    doctor: req.user._id,
    date: { $gte: today, $lt: nextWeek },
    status: { $in: ['pending', 'confirmed'] },
  });

  // Unique patients
  const uniquePatients = await DoctorPatientLink.countDocuments({ doctor: req.user._id });

  res.status(200).json({
    success: true,
    data: {
      todayAppointments,
      weekAppointments,
      uniquePatients,
    },
  });
};

/**
 * @desc    Get doctor schedule
 * @route   GET /api/doctors/schedule
 * @access  Private (Doctor)
 */
const getDoctorSchedule = async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }

  // Convert array to the object format frontend expects
  const scheduleObj = {};
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  DAYS.forEach(day => {
    const daySchedule = doctor.weeklySchedule?.find(s => s.day === day);
    if (daySchedule) {
      scheduleObj[day] = { enabled: daySchedule.enabled, slots: daySchedule.slots };
    } else {
      scheduleObj[day] = { enabled: false, slots: [] };
    }
  });

  res.status(200).json({ success: true, data: scheduleObj });
};

/**
 * @desc    Save doctor schedule
 * @route   PUT /api/doctors/schedule
 * @access  Private (Doctor)
 */
const saveDoctorSchedule = async (req, res) => {
  const scheduleObj = req.body; // expected: { Monday: { enabled: true, slots: [] }, ... }
  
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }

  const weeklySchedule = [];
  Object.keys(scheduleObj).forEach(day => {
    weeklySchedule.push({
      day,
      enabled: scheduleObj[day].enabled,
      slots: scheduleObj[day].slots,
    });
  });

  doctor.weeklySchedule = weeklySchedule;
  await doctor.save();

  res.status(200).json({ success: true, message: 'Schedule saved successfully.' });
};

/**
 * @desc    Get upcoming appointments for right rail
 * @route   GET /api/doctors/appointments/upcoming
 * @access  Private (Doctor)
 */
const getUpcomingAppointments = async (req, res) => {
  const now = new Date();
  // Start of today so we don't miss earlier ones, but sort will handle order
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointments = await Appointment.find({
    doctor: req.user._id,
    date: { $gte: today },
    status: { $in: ['pending', 'confirmed'] },
  })
    .populate('patient', 'fullName')
    .sort({ date: 1, time: 1 })
    .limit(10);

  const formatted = appointments.map(apt => {
    const aptDate = new Date(apt.date);
    let dateStr = aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (aptDate.getTime() === today.getTime()) dateStr = 'Today';
    else if (aptDate.getTime() === today.getTime() + 86400000) dateStr = 'Tomorrow';

    return {
      id: apt._id,
      patient: apt.patient.fullName,
      time: apt.time,
      date: dateStr,
      reason: apt.reason,
      status: apt.status,
    };
  });

  res.status(200).json({ success: true, data: formatted });
};

/**
 * @desc    Get doctor's patients
 * @route   GET /api/doctors/patients
 * @access  Private (Doctor)
 */
const getDoctorPatients = async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;

  const filter = { doctor: req.user._id };
  if (status && status !== 'All') {
    filter.status = status;
  }

  let query = DoctorPatientLink.find(filter)
    .populate('patient', 'fullName email phone age gender')
    .sort({ updatedAt: -1 });

  let links = await query;

  // We also need the last visit date. 
  // This could be heavy if there are thousands of patients. 
  // We can do it by finding the last appointment for each.
  const patientsData = await Promise.all(links.map(async (link) => {
    const lastAppt = await Appointment.findOne({ doctor: req.user._id, patient: link.patient._id, status: 'completed' })
      .sort({ date: -1 });
    
    return {
      _id: link.patient._id,
      fullName: link.patient.fullName,
      email: link.patient.email,
      phone: link.patient.phone,
      age: link.patient.age,
      gender: link.patient.gender,
      lastVisit: lastAppt ? lastAppt.date : null,
      condition: link.primaryCondition || 'General Checkup',
      status: link.status,
      linkId: link._id
    };
  }));

  let filtered = patientsData;
  if (search) {
    filtered = patientsData.filter(p => 
      p.fullName.toLowerCase().includes(search.toLowerCase()) || 
      p.condition.toLowerCase().includes(search.toLowerCase())
    );
  }

  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + parseInt(limit));

  res.status(200).json({
    success: true,
    count: filtered.length,
    page: parseInt(page),
    pages: Math.ceil(filtered.length / limit),
    data: paginated,
  });
};

/**
 * @desc    Get doctor's patient by ID
 * @route   GET /api/doctors/patients/:patientId
 * @access  Private (Doctor)
 */
const getDoctorPatientById = async (req, res) => {
  const link = await DoctorPatientLink.findOne({ doctor: req.user._id, patient: req.params.patientId })
    .populate('patient', 'fullName email phone age gender');
    
  if (!link) {
    return res.status(404).json({ success: false, message: 'Patient not found in your roster.' });
  }

  const appointments = await Appointment.find({ doctor: req.user._id, patient: req.params.patientId })
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: {
      profile: link.patient,
      status: link.status,
      condition: link.primaryCondition,
      notes: link.notes,
      appointments
    }
  });
};

/**
 * @desc    Update doctor's patient status
 * @route   PUT /api/doctors/patients/:patientId/status
 * @access  Private (Doctor)
 */
const updateDoctorPatientStatus = async (req, res) => {
  const { status, primaryCondition, notes } = req.body;
  const link = await DoctorPatientLink.findOne({ doctor: req.user._id, patient: req.params.patientId });

  if (!link) {
    return res.status(404).json({ success: false, message: 'Patient link not found.' });
  }

  if (status) link.status = status;
  if (primaryCondition !== undefined) link.primaryCondition = primaryCondition;
  if (notes !== undefined) link.notes = notes;

  await link.save();
  res.status(200).json({ success: true, message: 'Patient status updated.', data: link });
};

module.exports = {
  getAllDoctors: asyncHandler(getAllDoctors),
  getDoctorById: asyncHandler(getDoctorById),
  updateDoctorProfile: asyncHandler(updateDoctorProfile),
  getAvailableSlots: asyncHandler(getAvailableSlots),
  getDoctorDashboard: asyncHandler(getDoctorDashboard),
  getDoctorSchedule: asyncHandler(getDoctorSchedule),
  saveDoctorSchedule: asyncHandler(saveDoctorSchedule),
  getUpcomingAppointments: asyncHandler(getUpcomingAppointments),
  getDoctorPatients: asyncHandler(getDoctorPatients),
  getDoctorPatientById: asyncHandler(getDoctorPatientById),
  updateDoctorPatientStatus: asyncHandler(updateDoctorPatientStatus),
};
