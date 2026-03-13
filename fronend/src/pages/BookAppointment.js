import React, { useState } from 'react';
import { 
  Search, Calendar as CalendarIcon, Clock, MapPin, 
  Star, CheckCircle, User, FileText, ChevronLeft, X, 
  Stethoscope, ShieldCheck
} from 'lucide-react';
import './BookAppointment.css';

// Mock Data for Doctors
const MOCK_DOCTORS = [
  { id: 1, name: "Dr. Rahul Sharma", spec: "Cardiologist", exp: 12, hospital: "City Heart Center", fee: 800, rating: 4.8, image: "RS" },
  { id: 2, name: "Dr. Sneha Patel", spec: "Dermatologist", exp: 8, hospital: "SkinCare Clinic", fee: 600, rating: 4.9, image: "SP" },
  { id: 3, name: "Dr. Amit Kumar", spec: "General Physician", exp: 15, hospital: "HealthSphere Main", fee: 500, rating: 4.7, image: "AK" },
  { id: 4, name: "Dr. Priya Singh", spec: "Pediatrician", exp: 10, hospital: "Kids Care Hospital", fee: 700, rating: 4.9, image: "PS" },
  { id: 5, name: "Dr. Vikram Joshi", spec: "Neurologist", exp: 14, hospital: "Neuro Spine Center", fee: 1000, rating: 4.6, image: "VJ" },
  { id: 6, name: "Dr. Anjali Desai", spec: "General Physician", exp: 6, hospital: "HealthSphere Main", fee: 400, rating: 4.5, image: "AD" },
];

const SPECIALIZATIONS = ["All", "General Physician", "Cardiologist", "Dermatologist", "Neurologist", "Pediatrician"];

// Mock Time Slots
const TIME_SLOTS = [
  { time: "09:00 AM", available: true },
  { time: "09:30 AM", available: false },
  { time: "10:00 AM", available: true },
  { time: "10:30 AM", available: true },
  { time: "11:00 AM", available: false },
  { time: "11:30 AM", available: true },
  { time: "02:00 PM", available: true },
  { time: "02:30 PM", available: true },
  { time: "03:00 PM", available: false },
];

const BookAppointment = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  
  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Details, 3: Confirm, 4: Success
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [bookingData, setBookingData] = useState({
    date: "",
    time: "",
    reason: ""
  });

  // Filter Doctors
  const filteredDoctors = MOCK_DOCTORS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpec === "All" || doc.spec === selectedSpec;
    return matchesSearch && matchesSpec;
  });

  // Handlers
  const openBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(1);
    setBookingData({ date: "", time: "", reason: "" });
  };

  const closeBookingModal = () => {
    setSelectedDoctor(null);
  };

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(4); // Move to success step
    }, 1500);
  };

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
        
        {/* 2. SEARCH & FILTERS (Left on Desktop, Top on Mobile) */}
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

          <div className="doctors-grid">
            {filteredDoctors.map(doc => (
              <div key={doc.id} className="doctor-card">
                <div className="doc-card-header">
                  <div className="doc-avatar">{doc.image}</div>
                  <div className="doc-basic-info">
                    <h3>{doc.name}</h3>
                    <span className="doc-spec">{doc.spec}</span>
                    <div className="doc-rating">
                      <Star size={14} className="star-icon" fill="#eab308" />
                      <span>{doc.rating} Rating</span>
                    </div>
                  </div>
                </div>
                
                <div className="doc-details">
                  <div className="detail-row">
                    <Stethoscope size={16} /> <span>{doc.exp} Years Experience</span>
                  </div>
                  <div className="detail-row">
                    <MapPin size={16} /> <span>{doc.hospital}</span>
                  </div>
                  <div className="detail-row fee-row">
                    <FileText size={16} /> <span>Consultation: <strong>₹{doc.fee}</strong></span>
                  </div>
                </div>

                <div className="doc-actions">
                  <button className="btn-outline-primary">View Profile</button>
                  <button className="btn-primary" onClick={() => openBookingModal(doc)}>
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
            
            {filteredDoctors.length === 0 && (
              <div className="no-doctors">
                <Stethoscope size={40} />
                <h3>No doctors found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =========================================
          BOOKING MODAL (Step-by-Step Flow)
          ========================================= */}
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
              
              {/* Doctor Profile Preview (Always visible in steps 1-3) */}
              {step < 4 && (
                <div className="booking-doc-preview">
                  <div className="doc-avatar small">{selectedDoctor.image}</div>
                  <div>
                    <h3>{selectedDoctor.name}</h3>
                    <p>{selectedDoctor.spec} • {selectedDoctor.hospital}</p>
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
                        onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                      />
                    </div>
                  </div>

                  {bookingData.date && (
                    <div className="form-group">
                      <label>Available Slots</label>
                      <div className="time-slots-grid">
                        {TIME_SLOTS.map((slot, idx) => (
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
                  
                  {/* Auto-filled mock data */}
                  <div className="auto-fill-notice">
                    <ShieldCheck size={16} /> 
                    <span>Information auto-filled from your profile.</span>
                  </div>

                  <div className="patient-read-only">
                    <div className="read-group">
                      <User size={16} /> <strong>Name:</strong> Harsh Patel
                    </div>
                    <div className="read-group">
                      <FileText size={16} /> <strong>Age:</strong> 24 | <strong>Gender:</strong> Male
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
                      <strong>{selectedDoctor.name}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Hospital</span>
                      <strong>{selectedDoctor.hospital}</strong>
                    </div>
                    <div className="summary-row total-row">
                      <span>Consultation Fee</span>
                      <strong>₹{selectedDoctor.fee}</strong>
                    </div>
                  </div>

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
                  <p>Your appointment with <strong>{selectedDoctor.name}</strong> has been confirmed for <strong>{bookingData.date}</strong> at <strong>{bookingData.time}</strong>.</p>
                  
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