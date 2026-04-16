import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, ChevronRight, ChevronLeft,
  Plus, Check, X, Activity, ArrowLeft,
  Loader, Save, Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DoctorSchedule.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

const mockSchedule = {
  Monday: { enabled: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00'] },
  Tuesday: { enabled: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30'] },
  Wednesday: { enabled: true, slots: ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'] },
  Thursday: { enabled: true, slots: ['09:00', '09:30', '10:00', '14:00', '14:30', '15:00'] },
  Friday: { enabled: true, slots: ['09:00', '09:30', '10:00', '10:30', '11:00'] },
  Saturday: { enabled: false, slots: [] },
  Sunday: { enabled: false, slots: [] },
};

const upcomingAppointments = [
  { id: 1, patient: 'Rahul Sharma', time: '09:00', date: 'Today', reason: 'Blood Pressure Review', status: 'confirmed' },
  { id: 2, patient: 'Priya Patel', time: '10:30', date: 'Today', reason: 'Diabetes Follow-up', status: 'confirmed' },
  { id: 3, patient: 'Neha Gupta', time: '14:00', date: 'Tomorrow', reason: 'Migraine Assessment', status: 'pending' },
  { id: 4, patient: 'Amit Singh', time: '09:30', date: 'Apr 18', reason: 'Arthritis Consultation', status: 'confirmed' },
];

const DoctorSchedule = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(mockSchedule);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'doctor') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const toggleDayEnabled = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled, slots: prev[day].enabled ? [] : prev[day].slots }
    }));
  };

  const toggleSlot = (day, slot) => {
    setSchedule(prev => {
      const daySchedule = prev[day];
      const newSlots = daySchedule.slots.includes(slot)
        ? daySchedule.slots.filter(s => s !== slot)
        : [...daySchedule.slots, slot].sort();
      return { ...prev, [day]: { ...daySchedule, slots: newSlots } };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };

  const getStatusColor = (status) => {
    return status === 'confirmed'
      ? { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' }
      : { bg: '#fefce8', color: '#ca8a04', dot: '#eab308' };
  };

  const totalSlots = Object.values(schedule).reduce((sum, day) => sum + (day.enabled ? day.slots.length : 0), 0);
  const activeDays = Object.values(schedule).filter(d => d.enabled).length;

  return (
    <div className="ds-page">
      {/* Header */}
      <header className="ds-header">
        <div className="ds-container">
          <Link to="/doc-dashboard" className="ds-back">
            <ArrowLeft size={20} /> Dashboard
          </Link>
          <div className="ds-header-content">
            <div>
              <h1><Calendar size={28} /> My Schedule</h1>
              <p>Manage your availability and view upcoming appointments</p>
            </div>
            <div className="ds-header-stats">
              <div className="ds-stat-card">
                <span className="ds-stat-value">{activeDays}</span>
                <span className="ds-stat-label">Working Days</span>
              </div>
              <div className="ds-stat-card">
                <span className="ds-stat-value">{totalSlots}</span>
                <span className="ds-stat-label">Total Slots</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="ds-main">
        <div className="ds-container">
          <div className="ds-grid">
            {/* LEFT: Schedule Manager */}
            <div className="ds-schedule-panel">
              <div className="ds-panel-header">
                <h2>Weekly Schedule</h2>
                <button className="ds-save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <><span className="ds-spinner"></span> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
                </button>
              </div>

              {/* Day Tabs */}
              <div className="ds-day-tabs">
                {DAYS.map(day => (
                  <button
                    key={day}
                    className={`ds-day-tab ${selectedDay === day ? 'active' : ''} ${schedule[day]?.enabled ? '' : 'disabled-day'}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className="ds-day-name">{day.substring(0, 3)}</span>
                    <span className="ds-day-slots">{schedule[day]?.slots.length || 0}</span>
                  </button>
                ))}
              </div>

              {/* Day Controls */}
              <div className="ds-day-config">
                <div className="ds-day-toggle-row">
                  <h3>{selectedDay}</h3>
                  <label className="ds-toggle">
                    <input
                      type="checkbox"
                      checked={schedule[selectedDay]?.enabled || false}
                      onChange={() => toggleDayEnabled(selectedDay)}
                    />
                    <span className="ds-toggle-slider"></span>
                    <span className="ds-toggle-label">
                      {schedule[selectedDay]?.enabled ? 'Available' : 'Off Day'}
                    </span>
                  </label>
                </div>

                {schedule[selectedDay]?.enabled ? (
                  <div className="ds-slot-grid">
                    {TIME_SLOTS.map(slot => {
                      const isActive = schedule[selectedDay]?.slots.includes(slot);
                      return (
                        <button
                          key={slot}
                          className={`ds-slot-btn ${isActive ? 'active' : ''}`}
                          onClick={() => toggleSlot(selectedDay, slot)}
                        >
                          <Clock size={14} />
                          {slot}
                          {isActive && <Check size={14} className="ds-check" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ds-off-day">
                    <Calendar size={32} style={{ opacity: 0.2 }} />
                    <p>{selectedDay} is marked as off day.</p>
                    <span>Toggle availability above to set time slots.</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Upcoming Appointments */}
            <div className="ds-appointments-panel">
              <div className="ds-panel-header">
                <h2>Upcoming</h2>
                <Link to="/my-appointments" className="ds-view-all">View All</Link>
              </div>

              <div className="ds-appt-list">
                {upcomingAppointments.map(appt => {
                   const statusStyle = getStatusColor(appt.status);
                   return (
                    <div key={appt.id} className="ds-appt-card">
                      <div className="ds-appt-time-col">
                        <span className="ds-appt-time">{appt.time}</span>
                        <span className="ds-appt-date">{appt.date}</span>
                      </div>
                      <div className="ds-appt-info">
                        <h4>{appt.patient}</h4>
                        <p>{appt.reason}</p>
                      </div>
                      <span
                        className="ds-appt-status"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        <span className="ds-status-dot" style={{ background: statusStyle.dot }}></span>
                        {appt.status}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quick Info */}
              <div className="ds-quick-info">
                <Activity size={16} />
                <span>Consultation duration: ~30 minutes per slot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;
