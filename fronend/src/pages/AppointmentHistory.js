import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, User, ChevronLeft, 
  CheckCircle, XCircle, AlertCircle, FileText, 
  Star, Video, CreditCard, X, Activity 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './AppointmentHistory.css';

// Mock Data for Appointments
const MOCK_APPOINTMENTS = [
  { 
    id: 'APT-101', doctor: 'Dr. Rahul Sharma', spec: 'Cardiologist', 
    date: '2026-03-25', time: '10:30 AM', hospital: 'City Heart Center', 
    status: 'confirmed', type: 'In-Person', fee: 800, payment: 'Paid Online',
    notes: 'Please bring your previous ECG reports.'
  },
  { 
    id: 'APT-102', doctor: 'Dr. Sneha Patel', spec: 'Dermatologist', 
    date: '2026-03-28', time: '02:00 PM', hospital: 'SkinCare Clinic', 
    status: 'pending', type: 'Video Consult', fee: 600, payment: 'Pending',
    notes: 'A meeting link will be shared 15 minutes before the consultation.'
  },
  { 
    id: 'APT-099', doctor: 'Dr. Amit Kumar', spec: 'General Physician', 
    date: '2026-03-12', time: '11:00 AM', hospital: 'HealthSphere Main', 
    status: 'completed', type: 'In-Person', fee: 500, payment: 'Paid at Clinic', 
    notes: 'Patient advised to take complete rest for 3 days. Paracetamol prescribed for fever.' 
  },
  { 
    id: 'APT-085', doctor: 'Dr. Vikram Joshi', spec: 'Neurologist', 
    date: '2026-02-15', time: '04:30 PM', hospital: 'Neuro Spine Center', 
    status: 'cancelled', type: 'In-Person', fee: 1000, payment: 'Refunded', 
    cancelReason: 'Cancelled by patient due to scheduling conflict.' 
  },
];

const AppointmentHistory = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Filter Logic
  const filteredAppointments = MOCK_APPOINTMENTS.filter(apt => {
    if (activeTab === 'upcoming') return apt.status === 'confirmed' || apt.status === 'pending';
    if (activeTab === 'completed') return apt.status === 'completed';
    if (activeTab === 'cancelled') return apt.status === 'cancelled';
    return true;
  });

  // Helper function for status badges
  const getStatusBadge = (status) => {
    switch(status) {
      case 'confirmed': return <span className="apt-badge bg-green"><CheckCircle size={14} /> Confirmed</span>;
      case 'pending': return <span className="apt-badge bg-yellow"><AlertCircle size={14} /> Pending</span>;
      case 'completed': return <span className="apt-badge bg-blue"><CheckCircle size={14} /> Completed</span>;
      case 'cancelled': return <span className="apt-badge bg-red"><XCircle size={14} /> Cancelled</span>;
      default: return null;
    }
  };

  return (
    <div className="apt-history-page">
      
      {/* 1. HEADER SECTION */}
      <header className="apt-header">
        <div className="header-container">
          <Link to="/dashboard" className="back-link">
            <ChevronLeft size={20} /> Back to Dashboard
          </Link>
          <div className="header-titles">
            <h1>My Appointments</h1>
            <p>Track and manage all your medical appointments in one place.</p>
          </div>
        </div>
      </header>

      <div className="apt-layout">
        
        {/* 2. FILTER TABS */}
        <div className="apt-tabs">
          <button 
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Calendar size={18} /> Upcoming
          </button>
          <button 
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle size={18} /> Completed
          </button>
          <button 
            className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <XCircle size={18} /> Cancelled
          </button>
        </div>

        {/* 3. APPOINTMENT CARDS LIST */}
        <div className="apt-list">
          
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(apt => (
              <div key={apt.id} className="apt-card">
                
                <div className="apt-card-header">
                  <div className="doc-profile-small">
                    <div className="doc-avatar-text">{apt.doctor.split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
                    <div>
                      <h3>{apt.doctor}</h3>
                      <span className="doc-spec">{apt.spec}</span>
                    </div>
                  </div>
                  <div className="apt-status-wrapper">
                    {getStatusBadge(apt.status)}
                  </div>
                </div>

                <div className="apt-card-body">
                  <div className="apt-info-grid">
                    <div className="info-item">
                      <Calendar size={16} /> <span>{apt.date}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={16} /> <span>{apt.time}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={16} /> <span>{apt.hospital}</span>
                    </div>
                    <div className="info-item">
                      {apt.type === 'Video Consult' ? <Video size={16} /> : <User size={16} />}
                      <span>{apt.type}</span>
                    </div>
                  </div>
                </div>

                {/* 5. ACTION BUTTONS */}
                <div className="apt-card-footer">
                  <span className="apt-id">ID: {apt.id}</span>
                  <div className="action-buttons">
                    {activeTab === 'upcoming' && (
                      <>
                        <button className="btn-text-danger">Cancel</button>
                        <button className="btn-outline">Reschedule</button>
                      </>
                    )}
                    {activeTab === 'completed' && (
                      <button className="btn-outline"><Star size={16} /> Give Feedback</button>
                    )}
                    <button className="btn-primary" onClick={() => setSelectedAppointment(apt)}>
                      View Details
                    </button>
                  </div>
                </div>

              </div>
            ))
          ) : (
            /* 7. EMPTY STATE */
            <div className="empty-state">
              <Calendar size={64} className="empty-icon" />
              <h2>No appointments found</h2>
              <p>You don't have any {activeTab} appointments at the moment.</p>
              <Link to="/doctors" className="btn-primary mt-4 inline-flex">
                <Calendar size={18} /> Book Your First Appointment
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* 6. APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <div className="apt-modal-overlay" onClick={() => setSelectedAppointment(null)}>
          <div className="apt-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Appointment Details</h2>
              <button className="close-btn" onClick={() => setSelectedAppointment(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* Status Banner */}
              <div className={`modal-banner banner-${selectedAppointment.status}`}>
                {getStatusBadge(selectedAppointment.status)}
                <span className="banner-id">Appointment ID: {selectedAppointment.id}</span>
              </div>

              {/* Doctor Info */}
              <div className="modal-section doc-summary">
                <div className="doc-avatar-large">{selectedAppointment.doctor.split(' ').map(n=>n[0]).join('').substring(0,2)}</div>
                <div>
                  <h3>{selectedAppointment.doctor}</h3>
                  <p>{selectedAppointment.spec} • {selectedAppointment.hospital}</p>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="modal-grid">
                <div className="grid-box">
                  <span className="box-label">Date & Time</span>
                  <strong className="box-value"><Calendar size={14}/> {selectedAppointment.date} at {selectedAppointment.time}</strong>
                </div>
                <div className="grid-box">
                  <span className="box-label">Consultation Type</span>
                  <strong className="box-value">
                    {selectedAppointment.type === 'Video Consult' ? <Video size={14}/> : <User size={14}/>} 
                    {selectedAppointment.type}
                  </strong>
                </div>
              </div>

              {/* Payment Info */}
              <div className="modal-section border-top">
                <h4 className="section-title"><CreditCard size={18}/> Payment Information</h4>
                <div className="flex-between">
                  <span>Consultation Fee:</span>
                  <strong>₹{selectedAppointment.fee}</strong>
                </div>
                <div className="flex-between mt-2">
                  <span>Status:</span>
                  <strong className={selectedAppointment.payment.includes('Paid') ? 'text-green' : 'text-yellow'}>
                    {selectedAppointment.payment}
                  </strong>
                </div>
              </div>

              {/* Notes / Prescription */}
              {selectedAppointment.notes && (
                <div className="modal-section border-top bg-light">
                  <h4 className="section-title"><FileText size={18}/> Doctor/Clinic Notes</h4>
                  <p className="notes-text">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Cancellation Reason */}
              {selectedAppointment.cancelReason && (
                <div className="modal-section border-top bg-red-light">
                  <h4 className="section-title text-red"><AlertCircle size={18}/> Cancellation Reason</h4>
                  <p className="notes-text text-red">{selectedAppointment.cancelReason}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedAppointment.status === 'completed' ? (
                <button className="btn-primary full-width"><FileText size={18}/> Download Prescription</button>
              ) : selectedAppointment.status === 'upcoming' || selectedAppointment.status === 'pending' ? (
                <div className="action-buttons full-width">
                  <button className="btn-outline flex-1">Reschedule</button>
                  {selectedAppointment.type === 'Video Consult' && (
                     <button className="btn-primary flex-1"><Video size={18}/> Join Call</button>
                  )}
                </div>
              ) : (
                <button className="btn-secondary full-width" onClick={() => setSelectedAppointment(null)}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentHistory;