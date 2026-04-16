const Doctor = require('../models/Doctor');
const User = require('../models/User');

/**
 * @desc    Get all doctors (with optional filters)
 * @route   GET /api/doctors
 * @access  Public
 */
const getAllDoctors = async (req, res) => {
  try {
    const { specialization, search, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { isVerified: true };

    if (specialization && specialization !== 'All') {
      filter.specialization = specialization;
    }

    // Get doctors with populated user info
    let query = Doctor.find(filter).populate('user', 'fullName email phone avatar');

    // Search by doctor name or hospital
    if (search) {
      const doctors = await query;
      const filtered = doctors.filter((doc) => {
        const nameMatch = doc.user.fullName.toLowerCase().includes(search.toLowerCase());
        const hospitalMatch = doc.hospital.toLowerCase().includes(search.toLowerCase());
        return nameMatch || hospitalMatch;
      });

      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + parseInt(limit));

      return res.status(200).json({
        success: true,
        count: filtered.length,
        data: paginated,
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Doctor.countDocuments(filter);
    const doctors = await query.skip(skip).limit(parseInt(limit)).sort({ rating: -1 });

    res.status(200).json({
      success: true,
      count: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: doctors,
    });
  } catch (error) {
    console.error('GetAllDoctors Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get single doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Public
 */
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'fullName email phone avatar');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error('GetDoctorById Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Update doctor profile
 * @route   PUT /api/doctors/profile
 * @access  Private (Doctor)
 */
const updateDoctorProfile = async (req, res) => {
  try {
    const {
      specialization, experience, hospital,
      consultationFee, bio, availableSlots,
    } = req.body;

    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (hospital) doctor.hospital = hospital;
    if (consultationFee) doctor.consultationFee = consultationFee;
    if (bio) doctor.bio = bio;
    if (availableSlots) doctor.availableSlots = availableSlots;

    await doctor.save();

    // Update user basic info if provided
    const { fullName, phone } = req.body;
    if (fullName || phone) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated.',
      data: doctor,
    });
  } catch (error) {
    console.error('UpdateDoctorProfile Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get available time slots for a doctor on a given date
 * @route   GET /api/doctors/:id/slots?date=YYYY-MM-DD
 * @access  Public
 */
const getAvailableSlots = async (req, res) => {
  try {
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
    const daySlot = doctor.availableSlots.find((s) => s.day === dayOfWeek);

    if (!daySlot) {
      return res.status(200).json({
        success: true,
        message: 'Doctor is not available on this day.',
        data: [],
      });
    }

    // Generate 30-min slots between start and end time
    const slots = [];
    const [startH, startM] = daySlot.startTime.split(':').map(Number);
    const [endH, endM] = daySlot.endTime.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current < end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const timeStr = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      slots.push({ time: timeStr, available: true });
      current += 30;
    }

    // Check existing appointments and mark booked slots as unavailable
    const Appointment = require('../models/Appointment');
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
  } catch (error) {
    console.error('GetAvailableSlots Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllDoctors, getDoctorById, updateDoctorProfile, getAvailableSlots };
