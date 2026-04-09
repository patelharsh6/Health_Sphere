import React from 'react';
import { 
  Activity, Calendar, FileText, Bot, Bell, 
  User, Clock, AlertTriangle, ChevronRight, 
  Plus, Upload, TrendingUp, CheckCircle, Search
} from 'lucide-react';
import './PatientDashboard.css';

const PatientDashboard = () => {
  return (
    <div className="dashboard-page">
      
      {/* 1. DASHBOARD SIDEBAR (Desktop Only) */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-profile">
          <div className="avatar-large">HP</div>
          <div className="profile-info">
            <h3>Harsh Patel</h3>
            <span>Patient ID: HS-9821</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item active"><Activity size={20} /> Overview</a>
          <a href="/appointments" className="nav-item"><Calendar size={20} /> Appointments</a>
          <a href="/reports" className="nav-item"><FileText size={20} /> Lab Reports</a>
          <a href="/symptoms" className="nav-item"><Search size={20} /> Symptom Checker</a>
          <a href="/ai-assistant" className="nav-item ai-nav"><Bot size={20} /> AI Assistant</a>
        </nav>
      </aside>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="dashboard-main">
        
        {/* 2. DASHBOARD HEADER */}
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, Harsh 👋</h1>
            <p>Here is an overview of your health activity.</p>
          </div>
          <div className="header-actions">
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              <span className="notify-dot"></span>
            </button>
            {/* Mobile menu toggle would go here if needed, but we rely on global Navbar */}
          </div>
        </header>

        {/* 6. QUICK ACTIONS (Prioritized for Mobile) */}
        <div className="quick-actions-grid">
          <button className="action-card btn-teal">
            <Search size={24} />
            <span>Check Symptoms</span>
          </button>
          <button className="action-card btn-blue">
            <Calendar size={24} />
            <span>Book Doctor</span>
          </button>
          <button className="action-card btn-purple">
            <Upload size={24} />
            <span>Upload Report</span>
          </button>
          <button className="action-card btn-gradient">
            <Bot size={24} />
            <span>Ask AI Assistant</span>
          </button>
        </div>

        {/* 3. HEALTH SUMMARY CARDS */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue"><Calendar size={20} /></div>
            <div className="summary-info">
              <h3>Upcoming Visits</h3>
              <p className="summary-value">2</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon purple"><FileText size={20} /></div>
            <div className="summary-info">
              <h3>Lab Reports</h3>
              <p className="summary-value">5</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon teal"><Activity size={20} /></div>
            <div className="summary-info">
              <h3>Symptom Checks</h3>
              <p className="summary-value">3</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon green"><ShieldCheck size={20} /></div>
            <div className="summary-info">
              <h3>Overall Risk</h3>
              <p className="summary-value text-green">Low</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-2col">
          
          {/* LEFT COLUMN */}
          <div className="col-left">
            
            {/* 5. AI HEALTH INSIGHTS */}
            <div className="dash-panel ai-insight-panel">
              <div className="panel-header">
                <div className="header-title">
                  <Bot size={20} className="text-teal" />
                  <h2>AI Health Insights</h2>
                </div>
                <span className="risk-badge badge-yellow">Moderate Attention</span>
              </div>
              <div className="insight-content">
                <p><strong>Observation:</strong> Your latest blood sugar trend is slightly elevated compared to your last report.</p>
                <div className="recommendation-box">
                  <TrendingUp size={16} className="text-yellow" />
                  <p><strong>Recommendation:</strong> We recommend monitoring your carbohydrate intake and discussing this trend during your upcoming doctor consultation.</p>
                </div>
              </div>
            </div>

            {/* 4. UPCOMING APPOINTMENTS */}
            <div className="dash-panel">
              <div className="panel-header">
                <h2>Upcoming Appointments</h2>
                <a href="/appointments" className="view-all">View All</a>
              </div>
              <div className="appointment-list">
                <div className="appt-card">
                  <div className="appt-date">
                    <span className="month">MAR</span>
                    <span className="day">18</span>
                  </div>
                  <div className="appt-details">
                    <h4>Dr. Rahul Sharma</h4>
                    <p>Cardiologist • City Heart Center</p>
                    <div className="appt-time">
                      <Clock size={14} /> 10:30 AM
                    </div>
                  </div>
                  <div className="appt-actions">
                    <button className="btn-small btn-outline">Reschedule</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="col-right">
            
            {/* 5. RECENT LAB REPORTS */}
            <div className="dash-panel">
              <div className="panel-header">
                <h2>Recent Lab Reports</h2>
                <button className="btn-icon-small"><Plus size={16} /></button>
              </div>
              <div className="report-list">
                <div className="report-item">
                  <div className="report-icon"><FileText size={20} /></div>
                  <div className="report-info">
                    <h4>Complete Blood Count (CBC)</h4>
                    <p>Uploaded: Mar 12, 2026</p>
                  </div>
                  <span className="status-badge status-analyzed">Analyzed</span>
                </div>
                <div className="report-item">
                  <div className="report-icon"><FileText size={20} /></div>
                  <div className="report-info">
                    <h4>Lipid Profile</h4>
                    <p>Uploaded: Mar 10, 2026</p>
                  </div>
                  <span className="status-badge status-pending">Pending AI</span>
                </div>
              </div>
              <button className="btn-full-width mt-3">View All Reports</button>
            </div>

            {/* 7. HEALTH HISTORY TIMELINE */}
            <div className="dash-panel">
              <div className="panel-header">
                <h2>Health Timeline</h2>
              </div>
              <div className="timeline-container">
                <div className="timeline-item">
                  <div className="timeline-dot dot-blue"></div>
                  <div className="timeline-content">
                    <h4>Doctor Consultation</h4>
                    <p>Dr. Amit Kumar • General Checkup</p>
                    <span className="time-date">Mar 12, 2026</span>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot dot-purple"></div>
                  <div className="timeline-content">
                    <h4>Lab Report Uploaded</h4>
                    <p>Lipid Profile & Blood Sugar</p>
                    <span className="time-date">Mar 10, 2026</span>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot dot-teal"></div>
                  <div className="timeline-content">
                    <h4>AI Symptom Check</h4>
                    <p>Checked for: "Mild fatigue, headache"</p>
                    <span className="time-date">Mar 08, 2026</span>
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

// Simple ShieldCheck icon component since it wasn't imported directly
const ShieldCheck = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

export default PatientDashboard;