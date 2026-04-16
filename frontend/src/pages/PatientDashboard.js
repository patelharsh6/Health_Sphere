import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, FileText, Bot, Bell, 
  User, Clock, AlertTriangle, ChevronRight, 
  Plus, Upload, TrendingUp, CheckCircle, Search,
  Loader
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientAPI, appointmentAPI, reportAPI } from '../services/api';
import './PatientDashboard.css';

const ShieldCheck = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

const PatientDashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, authLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard summary
      const dashRes = await patientAPI.getDashboard();
      if (dashRes.data.success) {
        setDashboardData(dashRes.data.data);
      }

      // Fetch upcoming appointments
      const aptRes = await appointmentAPI.getMyAppointments({ status: 'confirmed', limit: 3 });
      if (aptRes.data.success) {
        setAppointments(aptRes.data.data);
      }

      // Fetch recent reports
      const repRes = await reportAPI.getMyReports({ limit: 3 });
      if (repRes.data.success) {
        setReports(repRes.data.data);
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

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  const stats = dashboardData?.stats || {};
  const riskAssessment = dashboardData?.riskAssessment || {};

  // Format date helper
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMonthDay = (dateStr) => {
    const d = new Date(dateStr);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate()
    };
  };

  return (
    <div className="dashboard-page">
      
      {/* 1. DASHBOARD SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-profile">
          <div className="avatar-large">{initials}</div>
          <div className="profile-info">
            <h3>{user?.fullName || 'Patient'}</h3>
            <span>Patient ID: {user?.id?.slice(-6).toUpperCase() || 'N/A'}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item active"><Activity size={20} /> Overview</Link>
          <Link to="/appointments" className="nav-item"><Calendar size={20} /> Appointments</Link>
          <Link to="/upload" className="nav-item"><FileText size={20} /> Lab Reports</Link>
          <Link to="/symptoms" className="nav-item"><Search size={20} /> Symptom Checker</Link>
          <Link to="/symptoms" className="nav-item ai-nav"><Bot size={20} /> AI Assistant</Link>
        </nav>
      </aside>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="dashboard-main">
        
        {/* 2. DASHBOARD HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, {firstName} 👋</h1>
            <p>Here is an overview of your health activity.</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              <span className="notify-dot"></span>
            </button>
          </div>
        </header>

        {/* QUICK ACTIONS */}
        <div className="quick-actions-grid">
          <Link to="/symptoms" className="action-card btn-teal" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Search size={24} />
            <span>Check Symptoms</span>
          </Link>
          <Link to="/appointments" className="action-card btn-blue" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Calendar size={24} />
            <span>Book Doctor</span>
          </Link>
          <Link to="/upload" className="action-card btn-purple" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Upload size={24} />
            <span>Upload Report</span>
          </Link>
          <Link to="/ai-assistant" className="action-card btn-gradient" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Bot size={24} />
            <span>Ask AI Assistant</span>
          </Link>
        </div>

        {/* HEALTH SUMMARY CARDS */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue"><Calendar size={20} /></div>
            <div className="summary-info">
              <h3>Upcoming Visits</h3>
              <p className="summary-value">{stats.upcomingAppointments || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon purple"><FileText size={20} /></div>
            <div className="summary-info">
              <h3>Lab Reports</h3>
              <p className="summary-value">{stats.totalReports || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon teal"><Activity size={20} /></div>
            <div className="summary-info">
              <h3>Total Appointments</h3>
              <p className="summary-value">{stats.totalAppointments || 0}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon green"><ShieldCheck size={20} /></div>
            <div className="summary-info">
              <h3>Overall Risk</h3>
              <p className={`summary-value text-${riskAssessment.level === 'Low' ? 'green' : riskAssessment.level === 'Moderate' ? 'yellow' : 'red'}`}>
                {riskAssessment.level || 'Low'}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2col">
          
          {/* LEFT COLUMN */}
          <div className="col-left">
            
            {/* AI HEALTH INSIGHTS */}
            {riskAssessment.insights && (
              <div className="dash-panel ai-insight-panel">
                <div className="panel-header">
                  <div className="header-title">
                    <Bot size={20} className="text-teal" />
                    <h2>AI Health Insights</h2>
                  </div>
                  <span className={`risk-badge badge-${riskAssessment.level === 'Low' ? 'green' : 'yellow'}`}>
                    {riskAssessment.level || 'Low'} Attention
                  </span>
                </div>
                <div className="insight-content">
                  <p><strong>Observation:</strong> {riskAssessment.insights}</p>
                  {riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
                    <div className="recommendation-box">
                      <TrendingUp size={16} className="text-yellow" />
                      <p><strong>Recommendation:</strong> {riskAssessment.recommendations[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UPCOMING APPOINTMENTS */}
            <div className="dash-panel">
              <div className="panel-header">
                <h2>Upcoming Appointments</h2>
                <Link to="/my-appointments" className="view-all">View All</Link>
              </div>
              <div className="appointment-list">
                {appointments.length > 0 ? appointments.map(apt => {
                  const { month, day } = getMonthDay(apt.date);
                  const doctorName = apt.doctor?.fullName || 'Doctor';
                  return (
                    <div key={apt._id} className="appt-card">
                      <div className="appt-date">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                      </div>
                      <div className="appt-details">
                        <h4>{doctorName}</h4>
                        <p>{apt.reason || 'General Consultation'}</p>
                        <div className="appt-time">
                          <Clock size={14} /> {apt.time}
                        </div>
                      </div>
                      <div className="appt-actions">
                        <span className={`btn-small btn-outline status-${apt.status}`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    <Calendar size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>No upcoming appointments</p>
                    <Link to="/appointments" style={{ color: '#14b8a6', fontSize: '14px' }}>Book one now →</Link>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="col-right">
            
            {/* RECENT LAB REPORTS */}
            <div className="dash-panel">
              <div className="panel-header">
                <h2>Recent Lab Reports</h2>
                <Link to="/upload" className="btn-icon-small"><Plus size={16} /></Link>
              </div>
              <div className="report-list">
                {reports.length > 0 ? reports.map(report => (
                  <div key={report._id} className="report-item">
                    <div className="report-icon"><FileText size={20} /></div>
                    <div className="report-info">
                      <h4>{report.title}</h4>
                      <p>Uploaded: {formatDate(report.uploadDate)}</p>
                    </div>
                    <span className={`status-badge ${report.aiAnalysis?.summary ? 'status-analyzed' : 'status-pending'}`}>
                      {report.aiAnalysis?.summary ? 'Analyzed' : 'Pending AI'}
                    </span>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    <FileText size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>No reports uploaded yet</p>
                  </div>
                )}
              </div>
              <Link to="/upload" className="btn-full-width mt-3" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Upload Report
              </Link>
            </div>

            {/* HEALTH HISTORY TIMELINE */}
            <div className="dash-panel">
              <div className="panel-header">
                <h2>Health Timeline</h2>
              </div>
              <div className="timeline-container">
                {appointments.slice(0, 2).map((apt, idx) => (
                  <div key={apt._id} className="timeline-item">
                    <div className={`timeline-dot dot-${idx === 0 ? 'blue' : 'purple'}`}></div>
                    <div className="timeline-content">
                      <h4>Doctor Consultation</h4>
                      <p>{apt.doctor?.fullName || 'Doctor'} • {apt.reason || 'Consultation'}</p>
                      <span className="time-date">{formatDate(apt.date)}</span>
                    </div>
                  </div>
                ))}
                {reports.slice(0, 1).map(report => (
                  <div key={report._id} className="timeline-item">
                    <div className="timeline-dot dot-teal"></div>
                    <div className="timeline-content">
                      <h4>Lab Report Uploaded</h4>
                      <p>{report.title}</p>
                      <span className="time-date">{formatDate(report.uploadDate)}</span>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && reports.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    <p>No health activity yet</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
};

export default PatientDashboard;