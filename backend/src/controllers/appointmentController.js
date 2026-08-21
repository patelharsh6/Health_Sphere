const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const DoctorPatientLink = require('../models/DoctorPatientLink');

/**
 * @desc    Book a new appointment
 * @route   POST /api/appointments
 * @access  Private (Patient)
 */
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, date, and time are required.',
      });
    }

    // Check if the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check if past date
    const appointmentDateStr = new Date(date).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDateStr < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot book an appointment in the past.' });
    }

    // Cap open bookings
    const openBookings = await Appointment.countDocuments({
      patient: req.user._id,
      doctor: doctor.user,
      status: { $in: ['pending', 'confirmed'] }
    });
    if (openBookings >= 2) {
      return res.status(400).json({ success: false, message: 'You already have the maximum allowed open bookings with this doctor.' });
    }

    // Check if date is blocked
    const isBlocked = doctor.blockedDates?.some(blockedDate => 
      new Date(blockedDate).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
    );

    if (isBlocked) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not available on this date.',
      });
    }

    // Check if slot is within weekly schedule
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = doctor.weeklySchedule?.find(s => s.day === dayOfWeek);

    if (!daySchedule || !daySchedule.enabled || !daySchedule.slots?.includes(time)) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is not available.',
      });
    }


    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctor.user,
      date: new Date(date),
      time,
      reason: reason || '',
      consultationFee: doctor.consultationFee,
      status: 'confirmed',
    });

    // Upsert DoctorPatientLink
    await DoctorPatientLink.findOneAndUpdate(
      { doctor: doctor.user, patient: req.user._id },
      { $setOnInsert: { status: 'Active' }, $set: { primaryCondition: reason || 'General Checkup' } },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another.',
      });
    }
    console.error('BookAppointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get appointments for logged-in user (patient or doctor)
 * @route   GET /api/appointments
 * @access  Private
 */
const getMyAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Filter by role
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await Appointment.countDocuments(filter);

    const appointments = await Appointment.find(filter)
      .populate('patient', 'fullName email phone')
      .populate('doctor', 'fullName email phone')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: appointments,
    });
  } catch (error) {
    console.error('GetMyAppointments Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get single appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'fullName email phone')
      .populate('doctor', 'fullName email phone');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Ensure the user is part of this appointment
    const userId = req.user._id.toString();
    if (
      appointment.patient._id.toString() !== userId &&
      appointment.doctor._id.toString() !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error('GetAppointmentById Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Update appointment status (cancel, complete, add prescription)
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
const updateAppointment = async (req, res) => {
  try {
    const { status, prescription, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Only the doctor on this appointment (or an admin) may update it
    if (
      req.user.role !== 'admin' &&
      appointment.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment.',
      });
    }

    if (status) appointment.status = status;
    if (prescription !== undefined) appointment.prescription = prescription;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment updated.',
      data: appointment,
    });
  } catch (error) {
    console.error('UpdateAppointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Cancel an appointment
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private
 */
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Only the patient or admin can cancel? 
    // Actually, doctor should also be able to cancel.
    if (
      appointment.patient.toString() !== req.user._id.toString() &&
      appointment.doctor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel.' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Appointment already cancelled.' });
    }

    // Patient cancellation policy (24 hours)
    if (req.user.role === 'patient') {
      const now = new Date();
      const apptDateTime = new Date(appointment.date);
      const [h, m] = appointment.time.match(/\d+/g);
      const isPM = appointment.time.includes('PM');
      apptDateTime.setHours((parseInt(h) % 12) + (isPM ? 12 : 0), parseInt(m));
      
      const diffHours = (apptDateTime - now) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return res.status(400).json({ success: false, message: 'Appointments cannot be cancelled within 24 hours.' });
      }
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user._id;
    if (req.body.cancellationReason && req.user.role !== 'patient') {
      appointment.cancellationReason = req.body.cancellationReason;
    }
    
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      data: appointment,
    });
  } catch (error) {
    console.error('CancelAppointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get today's appointments
 * @route   GET /api/appointments/today
 * @access  Private
 */
const getTodayAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = {
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed'] },
    };

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'fullName email phone')
      .populate('doctor', 'fullName email phone')
      .sort({ time: 1 });

    res.status(200).json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('GetTodayAppointments Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Reschedule appointment
 * @route   PUT /api/appointments/:id/reschedule
 * @access  Private (Patient)
 */
const rescheduleAppointment = async (req, res) => {
  try {
    const { date, time } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule.' });
    }
    
    if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only pending or confirmed appointments can be rescheduled.' });
    }

    const appointmentDateStr = new Date(date).toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointmentDateStr < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date.' });
    }

    const doctor = await Doctor.findOne({ user: appointment.doctor });
    
    const isBlocked = doctor.blockedDates?.some(blockedDate => 
      new Date(blockedDate).toISOString().split('T')[0] === appointmentDateStr
    );
    if (isBlocked) {
      return res.status(400).json({ success: false, message: 'Doctor is not available on this date.' });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = doctor.weeklySchedule?.find(s => s.day === dayOfWeek);
    if (!daySchedule || !daySchedule.enabled || !daySchedule.slots?.includes(time)) {
      return res.status(400).json({ success: false, message: 'This time slot is not available.' });
    }

    appointment.auditTrail.push({
      action: 'reschedule',
      date: new Date(),
      previousDate: appointment.date,
      previousTime: appointment.time,
      by: req.user._id
    });

    appointment.date = new Date(date);
    appointment.time = time;
    
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      data: appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
    }
    console.error('RescheduleAppointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Confirm appointment
 * @route   PUT /api/appointments/:id/confirm
 * @access  Private (Doctor/Admin)
 */
const confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    if (req.user.role !== 'admin' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    appointment.status = 'confirmed';
    await appointment.save();

    res.status(200).json({ success: true, message: 'Appointment confirmed.', data: appointment });
  } catch (error) {
    console.error('ConfirmAppointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Complete appointment
 * @route   PUT /api/appointments/:id/complete
 * @access  Private (Doctor/Admin)
 */
const completeAppointment = async (req, res) => {
  try {
    const { prescription, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    if (req.user.role !== 'admin' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    appointment.status = 'completed';
    if (prescription) appointment.prescription = prescription;
    if (notes !== undefined) appointment.notes = notes;
    
    await appointment.save();

    res.status(200).json({ success: true, message: 'Appointment completed.', data: appointment });
  } catch (error) {
    console.error('CompleteAppointment Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get appointment receipt
 * @route   GET /api/appointments/:id/receipt
 * @access  Private
 */
const getAppointmentReceipt = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'fullName email')
      .populate('doctor', 'fullName email');

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found.' });

    const userId = req.user._id.toString();
    if (appointment.patient._id.toString() !== userId && appointment.doctor._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.status(200).json({
      success: true,
      data: {
        appointmentId: appointment._id,
        date: appointment.date,
        time: appointment.time,
        patientName: appointment.patient.fullName,
        doctorName: appointment.doctor.fullName,
        consultationFee: appointment.consultationFee,
        status: appointment.status,
      }
    });
  } catch (error) {
    console.error('GetAppointmentReceipt Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getTodayAppointments,
  rescheduleAppointment,
  confirmAppointment,
  completeAppointment,
  getAppointmentReceipt,
};
