import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar as CalendarIcon, Clock, MapPin, 
  Star, CheckCircle, User, FileText, ChevronLeft, X, 
  Stethoscope, ShieldCheck, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorAPI, appointmentAPI } from '../services/api';
import './BookAppointment.css';

const SPECIALIZATIONS = ["All", "General Physician", "Cardiologist", "Dermatologist", "Neurologist", "Pediatrician"];

const BookAppointment = () => {
  const { user, isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  
  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    reason: ""
  });

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpec]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (selectedSpec !== 'All') params.specialization = selectedSpec;
      const res = await doctorAPI.getAll(params);
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Doctors locally by search
  const filteredDoctors = doctors.filter(doc => {
    const name = doc.user?.fullName || '';
    const hospital = doc.hospital || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          hospital.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Fetch available slots when date changes
  const handleDateChange = async (date) => {
    setBookingData({ ...bookingData, date, time: '' });
    if (!selectedDoctor || !date) return;

    setSlotsLoading(true);
    try {
      const res = await doctorAPI.getSlots(selectedDoctor._id, date);
      if (res.data.success) {
        setTimeSlots(res.data.data);
      } else {
        setTimeSlots([]);
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setTimeSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Handlers
  const openBookingModal = (doctor) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedDoctor(doctor);
    setStep(1);
    setBookingData({ date: "", time: "", reason: "" });
    setTimeSlots([]);
    setError('');
  };

  const closeBookingModal = () => {
    setSelectedDoctor(null);
    setError('');
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await appointmentAPI.book({
        doctorId: selectedDoctor._id,
        date: bookingData.date,
        time: bookingData.time,
        reason: bookingData.reason,
      });
      if (res.data.success) {
        setStep(4); // Move to success step
      } else {
        setError(res.data.message || 'Booking failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get user display info
  const patientName = user?.fullName || 'Patient';
  const patientAge = profile?.age || 'N/A';
  const patientGender = profile?.gender || 'N/A';

  if (user?.role === 'doctor') {
    return (
      <div className="appointment-page" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center'}}>
        <Stethoscope size={64} style={{color: '#94a3b8', marginBottom: '20px'}}/>
        <h2>Restricted Access</h2>
        <p style={{color: '#64748b', maxWidth: '400px', margin: '10px auto 20px'}}>This page is for patients to book appointments. As a doctor, you can manage your appointments from your schedule.</p>
        <button className="btn-primary" onClick={() => navigate('/doc-schedule')}>Go to My Schedule</button>
      </div>
    );
  }

  return (
    <div className="appointment-page">
      
      {/* 1. PAGE HEADER */}
      <header className="page-header">
        <div className="header-icon-box">
          <CalendarIcon size={28} />
        </div>
        <h1>Book a Doctor Appointment</h1>
        <p>Find specialists and schedule your consultation securely.</p>
      </header>

      <div className="appointment-layout">
        
        {/* 2. SEARCH & FILTERS */}
        <aside className="filters-sidebar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search doctors, hospitals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <h3>Specialization</h3>
            <div className="spec-pills">
              {SPECIALIZATIONS.map(spec => (
                <button 
                  key={spec}
                  className={`spec-pill ${selectedSpec === spec ? 'active' : ''}`}
                  onClick={() => setSelectedSpec(spec)}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 3. DOCTOR LIST SECTION */}
        <main className="doctor-list-main">
          <div className="list-header">
            <h2>Available Doctors</h2>
            <span>{filteredDoctors.length} found</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading doctors...</p>
            </div>
          ) : (
            <div className="doctors-grid">
              {filteredDoctors.map(doc => {
                const name = doc.user?.fullName || 'Doctor';
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                return (
                  <div key={doc._id} className="doctor-card">
                    <div className="doc-card-header">
                      <div className="doc-avatar">{initials}</div>
                      <div className="doc-basic-info">
                        <h3>{name}</h3>
                        <span className="doc-spec">{doc.specialization}</span>
                        <div className="doc-rating">
                          <Star size={14} className="star-icon" fill="#eab308" />
                          <span>{doc.rating || 0} Rating</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="doc-details">
                      <div className="detail-row">
                        <Stethoscope size={16} /> <span>{doc.experience || 0} Years Experience</span>
                      </div>
                      <div className="detail-row">
                        <MapPin size={16} /> <span>{doc.hospital}</span>
                      </div>
                      <div className="detail-row fee-row">
                        <FileText size={16} /> <span>Consultation: <strong>₹{doc.consultationFee}</strong></span>
                      </div>
                    </div>

                    <div className="doc-actions">
                      <button className="btn-outline-primary">View Profile</button>
                      <button className="btn-primary" onClick={() => openBookingModal(doc)}>
                        Book Appointment
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {filteredDoctors.length === 0 && (
                <div className="no-doctors">
                  <Stethoscope size={40} />
                  <h3>No doctors found</h3>
                  <p>Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* BOOKING MODAL */}
      {selectedDoctor && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            
            {/* Modal Header */}
            <div className="modal-header">
              {step > 1 && step < 4 ? (
                <button className="back-btn" onClick={() => setStep(step - 1)}>
                  <ChevronLeft size={20} /> Back
                </button>
              ) : <div></div>}
              
              {step < 4 && (
                <button className="close-btn" onClick={closeBookingModal}>
                  <X size={24} />
                </button>
              )}
            </div>

            <div className="modal-body">
              
              {/* Doctor Profile Preview */}
              {step < 4 && (
                <div className="booking-doc-preview">
                  <div className="doc-avatar small">
                    {(selectedDoctor.user?.fullName || 'D').split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h3>{selectedDoctor.user?.fullName}</h3>
                    <p>{selectedDoctor.specialization} • {selectedDoctor.hospital}</p>
                  </div>
                </div>
              )}

              {/* STEP 1: DATE & TIME */}
              {step === 1 && (
                <div className="booking-step slide-in">
                  <h2 className="step-title">Select Date & Time</h2>
                  
                  <div className="form-group">
                    <label>Appointment Date</label>
                    <div className="date-input-wrapper">
                      <CalendarIcon size={18} />
                      <input 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]} 
                        value={bookingData.date}
                        onChange={(e) => handleDateChange(e.target.value)}
                      />
                    </div>
                  </div>

                  {bookingData.date && (
                    <div className="form-group">
                      <label>Available Slots</label>
                      {slotsLoading ? (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '16px' }}>Loading slots...</p>
                      ) : timeSlots.length > 0 ? (
                        <div className="time-slots-grid">
                          {timeSlots.map((slot, idx) => (
                            <button 
                              key={idx}
                              disabled={!slot.available}
                              className={`time-slot ${bookingData.time === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                              onClick={() => setBookingData({...bookingData, time: slot.time})}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '16px' }}>No slots available for this date</p>
                      )}
                    </div>
                  )}

                  <button 
                    className="btn-primary full-width mt-4"
                    disabled={!bookingData.date || !bookingData.time}
                    onClick={() => setStep(2)}
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 2: PATIENT INFO */}
              {step === 2 && (
                <div className="booking-step slide-in">
                  <h2 className="step-title">Patient Details</h2>
                  
                  <div className="auto-fill-notice">
                    <ShieldCheck size={16} /> 
                    <span>Information auto-filled from your profile.</span>
                  </div>

                  <div className="patient-read-only">
                    <div className="read-group">
                      <User size={16} /> <strong>Name:</strong> {patientName}
                    </div>
                    <div className="read-group">
                      <FileText size={16} /> <strong>Age:</strong> {patientAge} | <strong>Gender:</strong> {patientGender}
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <label>Reason for visit / Symptoms (Optional)</label>
                    <textarea 
                      placeholder="e.g., Having mild fever and cough for 2 days..."
                      rows="3"
                      value={bookingData.reason}
                      onChange={(e) => setBookingData({...bookingData, reason: e.target.value})}
                    ></textarea>
                  </div>

                  <button className="btn-primary full-width mt-4" onClick={() => setStep(3)}>
                    Review Booking
                  </button>
                </div>
              )}

              {/* STEP 3: CONFIRMATION SUMMARY */}
              {step === 3 && (
                <div className="booking-step slide-in">
                  <h2 className="step-title">Confirm Appointment</h2>
                  
                  <div className="summary-card">
                    <div className="summary-row">
                      <span>Date & Time</span>
                      <strong>{bookingData.date} at {bookingData.time}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Doctor</span>
                      <strong>{selectedDoctor.user?.fullName}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Hospital</span>
                      <strong>{selectedDoctor.hospital}</strong>
                    </div>
                    <div className="summary-row total-row">
                      <span>Consultation Fee</span>
                      <strong>₹{selectedDoctor.consultationFee}</strong>
                    </div>
                  </div>

                  {error && <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '12px' }}>{error}</div>}

                  <button 
                    className="btn-primary full-width mt-4"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Confirm & Book"}
                  </button>
                </div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 4 && (
                <div className="booking-step success-step scale-in">
                  <CheckCircle size={64} className="success-icon" />
                  <h2>Appointment Booked!</h2>
                  <p>Your appointment with <strong>{selectedDoctor.user?.fullName}</strong> has been confirmed for <strong>{bookingData.date}</strong> at <strong>{bookingData.time}</strong>.</p>
                  
                  <div className="success-actions">
                    <button className="btn-outline-primary" onClick={closeBookingModal}>
                      Book Another
                    </button>
                    <a href="/dashboard" className="btn-primary" style={{textDecoration:'none', textAlign:'center'}}>
                      View Dashboard
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookAppointment;