import React, { useState, useEffect } from 'react';
import {
  Users, Search, ChevronRight, User, Calendar,
  Mail, Phone, Activity, Clock, FileText, Loader,
  Filter, ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DoctorPatients.css';

// Mock patient data
const mockPatients = [
  {
    _id: '1', fullName: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543210',
    age: 28, gender: 'Male', lastVisit: '2026-04-10', condition: 'Hypertension', status: 'Active'
  },
  {
    _id: '2', fullName: 'Priya Patel', email: 'priya@example.com', phone: '9123456789',
    age: 35, gender: 'Female', lastVisit: '2026-04-08', condition: 'Diabetes Type 2', status: 'Active'
  },
  {
    _id: '3', fullName: 'Amit Singh', email: 'amit@example.com', phone: '9988776655',
    age: 45, gender: 'Male', lastVisit: '2026-03-28', condition: 'Arthritis', status: 'Follow Up'
  },
  {
    _id: '4', fullName: 'Neha Gupta', email: 'neha@example.com', phone: '9876501234',
    age: 32, gender: 'Female', lastVisit: '2026-04-05', condition: 'Migraine', status: 'Active'
  },
  {
    _id: '5', fullName: 'Vikram Joshi', email: 'vikram@example.com', phone: '9012345678',
    age: 52, gender: 'Male', lastVisit: '2026-03-15', condition: 'Back Pain', status: 'Discharged'
  }
];

const DoctorPatients = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState(mockPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

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

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: '#f0fdf4', color: '#16a34a' };
      case 'Follow Up': return { bg: '#fefce8', color: '#ca8a04' };
      case 'Discharged': return { bg: '#f1f5f9', color: '#64748b' };
      default: return { bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchSearch = p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="dp-page">
      {/* Header */}
      <header className="dp-header">
        <div className="dp-container">
          <div className="dp-header-top">
            <Link to="/doc-dashboard" className="dp-back">
              <ArrowLeft size={20} /> Dashboard
            </Link>
          </div>
          <div className="dp-header-content">
            <div>
              <h1><Users size={28} /> My Patients</h1>
              <p>View and manage your patient records</p>
            </div>
            <div className="dp-header-stats">
              <div className="dp-stat">
                <span className="dp-stat-num">{patients.length}</span>
                <span className="dp-stat-label">Total Patients</span>
              </div>
              <div className="dp-stat">
                <span className="dp-stat-num">{patients.filter(p => p.status === 'Active').length}</span>
                <span className="dp-stat-label">Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <section className="dp-controls">
        <div className="dp-container">
          <div className="dp-controls-row">
            <div className="dp-search">
              <Search size={18} className="dp-search-icon" />
              <input
                type="text"
                placeholder="Search patients by name or condition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="dp-filter-group">
              {['All', 'Active', 'Follow Up', 'Discharged'].map(status => (
                <button
                  key={status}
                  className={`dp-filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Patient List */}
      <section className="dp-list-section">
        <div className="dp-container">
          {filteredPatients.length === 0 ? (
            <div className="dp-empty">
              <Users size={48} style={{ opacity: 0.2 }} />
              <h3>No patients found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="dp-patient-grid">
              {filteredPatients.map(patient => {
                const statusStyle = getStatusColor(patient.status);
                return (
                  <div key={patient._id} className="dp-patient-card">
                    <div className="dp-patient-top">
                      <div className="dp-patient-avatar" style={{ background: '#ccfbf1', color: '#0f766e' }}>
                        {getInitials(patient.fullName)}
                      </div>
                      <div className="dp-patient-info">
                        <h3>{patient.fullName}</h3>
                        <p>{patient.age} yrs · {patient.gender}</p>
                      </div>
                      <span
                        className="dp-status-badge"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {patient.status}
                      </span>
                    </div>

                    <div className="dp-patient-details">
                      <div className="dp-detail-item">
                        <Activity size={14} />
                        <span><strong>Condition:</strong> {patient.condition}</span>
                      </div>
                      <div className="dp-detail-item">
                        <Calendar size={14} />
                        <span><strong>Last Visit:</strong> {new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="dp-detail-item">
                        <Mail size={14} />
                        <span>{patient.email}</span>
                      </div>
                      <div className="dp-detail-item">
                        <Phone size={14} />
                        <span>{patient.phone}</span>
                      </div>
                    </div>

                    <div className="dp-patient-actions">
                      <button className="dp-action-btn primary">
                        <FileText size={14} /> View Records
                      </button>
                      <button className="dp-action-btn secondary">
                        <Calendar size={14} /> Schedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DoctorPatients;
