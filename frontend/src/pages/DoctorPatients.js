import React, { useState, useEffect } from 'react';
import {
  Users, Search, Calendar,
  Mail, Phone, Activity, FileText, Loader,
  ArrowLeft, X, Heart
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorAPI } from '../services/api';
import './DoctorPatients.css';

const DoctorPatients = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'doctor') {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!isAuthenticated || user?.role !== 'doctor') return;
      try {
        setLoading(true);
        const res = await doctorAPI.getPatients({
          search: debouncedSearch || undefined,
          status: filterStatus
        });
        if (res.data.success) {
          setPatients(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [debouncedSearch, filterStatus, isAuthenticated, user]);

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

  // Filter is handled by API mostly, but keeping this in case for any minor sync issue
  const filteredPatients = patients;

  if (loading && patients.length === 0) {
    return (
      <div className="dp-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={48} className="spin-icon" style={{ opacity: 0.5, animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

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
                        <span><strong>Last Visit:</strong> {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No visits yet'}</span>
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
                      <button className="dp-action-btn primary" onClick={() => setSelectedPatient(patient)}>
                        <FileText size={14} /> View Records
                      </button>
                      <button className="dp-action-btn secondary" onClick={() => navigate('/doc-schedule')}>
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

      {/* Patient Records Modal */}
      {selectedPatient && (
        <div className="dp-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedPatient(null)}>
          <div className="dp-modal-content" style={{ backgroundColor: '#fff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {getInitials(selectedPatient.fullName)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>{selectedPatient.fullName}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{selectedPatient.age} yrs · {selectedPatient.gender}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Condition</span>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#0f172a' }}>{selectedPatient.condition || 'General'}</p>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: getStatusColor(selectedPatient.status).color }}>{selectedPatient.status}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#334155', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="#64748b" />
                <span>{selectedPatient.email || 'No email on record'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="#64748b" />
                <span>{selectedPatient.phone || 'No phone on record'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#64748b" />
                <span>Last Consultation: {selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No visits recorded yet'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => { setSelectedPatient(null); navigate('/doc-schedule'); }}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0d9488', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Schedule Appointment
              </button>
              <button 
                onClick={() => setSelectedPatient(null)}
                style={{ padding: '0.75rem 1.25rem', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
