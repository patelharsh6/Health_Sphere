import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, Users, FileText, Bell, 
  MapPin, CheckCircle, Clock, ChevronRight, Loader
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI, doctorAPI } from '../services/api';
import './PatientDashboard.css'; // Reusing some CSS for layout consistency

const DoctorDashboard = () => {
  const { user, profile, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'doctor') {
      navigate('/dashboard'); // Kick non-doctors out
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch today's/upcoming appointments
      const res = await appointmentAPI.getMyAppointments({ status: 'confirmed', limit: 5 });
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={40} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] || 'Doctor';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';

  const getMonthDay = (dateStr) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate()
    };
  };

  return (
    <div className="dashboard-page">
      
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-profile">
          <div className="avatar-large">{initials}</div>
          <div className="profile-info">
            <h3>{user?.fullName || 'Doctor'}</h3>
            <span>{profile?.specialization || 'Medical Specialist'}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/doc-dashboard" className="nav-item active"><Activity size={20} /> Overview</Link>
          <Link to="/schedule" className="nav-item"><Calendar size={20} /> My Schedule</Link>
          <Link to="/patients" className="nav-item"><Users size={20} /> My Patients</Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, Dr. {lastName(user?.fullName)} 👋</h1>
            <p>Your practice overview at a glance.</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              <span className="notify-dot"></span>
            </button>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <div className="summary-grid mt-4">
          <div className="summary-card">
            <div className="summary-icon blue"><Calendar size={20} /></div>
            <div className="summary-info">
              <h3>Today's Appointments</h3>
              <p className="summary-value">{appointments.length || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon teal"><Users size={20} /></div>
            <div className="summary-info">
              <h3>Total Patients</h3>
              <p className="summary-value">24</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon green"><CheckCircle size={20} /></div>
            <div className="summary-info">
              <h3>Consultations Done</h3>
              <p className="summary-value">150+</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2col mt-4">
          {/* UPCOMING APPOINTMENTS */}
          <div className="col-left">
            <div className="dash-panel">
              <div className="panel-header">
                <h2>Upcoming Appointments</h2>
                <Link to="/schedule" className="view-all">View Schedule</Link>
              </div>
              <div className="appointment-list">
                {appointments.length > 0 ? appointments.map(apt => {
                  const { month, day } = getMonthDay(apt.date);
                  const patientName = apt.patient?.fullName || 'Patient';
                  return (
                    <div key={apt._id} className="appt-card">
                      <div className="appt-date">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                      </div>
                      <div className="appt-details">
                        <h4>{patientName}</h4>
                        <p>{apt.reason || 'General Checkup'}</p>
                        <div className="appt-time">
                          <Clock size={14} /> {apt.time}
                        </div>
                      </div>
                      <div className="appt-actions">
                         <button className="btn-small btn-primary">Start Consult</button>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    <Calendar size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>No upcoming appointments</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-right">
             <div className="dash-panel">
              <div className="panel-header">
                <h2>Clinic Details</h2>
              </div>
              <div className="p-4 flex flex-col gap-4">
                 <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                    <MapPin size={20} className="text-muted"/>
                    <div>
                      <strong>{profile?.hospital || 'HealthSphere Main'}</strong>
                      <p className="text-muted text-sm">Main Branch</p>
                    </div>
                 </div>
                 <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                    <FileText size={20} className="text-muted"/>
                    <div>
                      <strong>License Details</strong>
                      <p className="text-muted text-sm">{profile?.medicalLicense || 'MD-1234'}</p>
                    </div>
                 </div>
              </div>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

// Helper for doctor last name
function lastName(fullName) {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length > 1) {
       return parts[parts.length - 1];
    }
    return parts[0];
}

export default DoctorDashboard;
