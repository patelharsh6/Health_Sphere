import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, ChevronLeft, 
  CheckCircle, XCircle, AlertCircle, FileText, 
  Star, Video, CreditCard, X, Activity, Loader
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI } from '../services/api';
import './AppointmentHistory.css';

const AppointmentHistory = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [isAuthenticated, authLoading]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentAPI.getMyAppointments({ limit: 50 });
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'upcoming') return apt.status === 'confirmed' || apt.status === 'pending';
    if (activeTab === 'completed') return apt.status === 'completed';
    if (activeTab === 'cancelled') return apt.status === 'cancelled';
    return true;
  });

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(id);
    try {
      const res = await appointmentAPI.cancel(id);
      if (res.data.success) {
        // Refresh appointments
        await fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
      alert(error.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(null);
    }
  };

  // Helper for date formatting
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

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
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map(apt => {
              const doctorName = apt.doctor?.fullName || 'Doctor';
              const initials = doctorName.split(' ').map(n=>n[0]).join('').substring(0,2);

              return (
                <div key={apt._id} className="apt-card">
                
                  <div className="apt-card-header">
                    <div className="doc-profile-small">
                      <div className="doc-avatar-text">{initials}</div>
                      <div>
                        <h3>{doctorName}</h3>
                        <span className="doc-spec">{apt.reason || 'Consultation'}</span>
                      </div>
                    </div>
                    <div className="apt-status-wrapper">
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>

                  <div className="apt-card-body">
                    <div className="apt-info-grid">
                      <div className="info-item">
                        <Calendar size={16} /> <span>{formatDate(apt.date)}</span>
                      </div>
                      <div className="info-item">
                        <Clock size={16} /> <span>{apt.time}</span>
                      </div>
                      <div className="info-item">
                        <CreditCard size={16} /> <span>₹{apt.consultationFee}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="apt-card-footer">
                    <span className="apt-id">ID: {apt._id?.slice(-8).toUpperCase()}</span>
                    <div className="action-buttons">
                      {activeTab === 'upcoming' && (
                        <button 
                          className="btn-text-danger" 
                          onClick={() => handleCancel(apt._id)}
                          disabled={cancelling === apt._id}
                        >
                          {cancelling === apt._id ? 'Cancelling...' : 'Cancel'}
                        </button>
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
              );
            })
          ) : (
            <div className="empty-state">
              <Calendar size={64} className="empty-icon" />
              <h2>No appointments found</h2>
              <p>You don't have any {activeTab} appointments at the moment.</p>
              <Link to="/appointments" className="btn-primary mt-4 inline-flex">
                <Calendar size={18} /> Book Your First Appointment
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
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
                <span className="banner-id">ID: {selectedAppointment._id?.slice(-8).toUpperCase()}</span>
              </div>

              {/* Doctor Info */}
              <div className="modal-section doc-summary">
                <div className="doc-avatar-large">
                  {(selectedAppointment.doctor?.fullName || 'D').split(' ').map(n=>n[0]).join('').substring(0,2)}
                </div>
                <div>
                  <h3>{selectedAppointment.doctor?.fullName || 'Doctor'}</h3>
                  <p>{selectedAppointment.reason || 'Consultation'}</p>
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="modal-grid">
                <div className="grid-box">
                  <span className="box-label">Date & Time</span>
                  <strong className="box-value"><Calendar size={14}/> {formatDate(selectedAppointment.date)} at {selectedAppointment.time}</strong>
                </div>
                <div className="grid-box">
                  <span className="box-label">Status</span>
                  <strong className="box-value">{selectedAppointment.status}</strong>
                </div>
              </div>

              {/* Payment Info */}
              <div className="modal-section border-top">
                <h4 className="section-title"><CreditCard size={18}/> Payment Information</h4>
                <div className="flex-between">
                  <span>Consultation Fee:</span>
                  <strong>₹{selectedAppointment.consultationFee}</strong>
                </div>
              </div>

              {/* Notes / Prescription */}
              {selectedAppointment.notes && (
                <div className="modal-section border-top bg-light">
                  <h4 className="section-title"><FileText size={18}/> Doctor/Clinic Notes</h4>
                  <p className="notes-text">{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.prescription && (
                <div className="modal-section border-top bg-light">
                  <h4 className="section-title"><FileText size={18}/> Prescription</h4>
                  <p className="notes-text">{selectedAppointment.prescription}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary full-width" onClick={() => setSelectedAppointment(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentHistory;