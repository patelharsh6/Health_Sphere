import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { adminAPI } from '../../services/api';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminNav from './AdminNav';

const AdminAppointments = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await adminAPI.getAppointments();
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchAppointments();
  }, [isAuthenticated, authLoading, user, navigate]);

  if (loading) {
    return (
      <div className="admin-page" style={{ textAlign: 'center', padding: '60px' }}>
        <Loader size={36} style={{ animation: 'spin 1s linear infinite', color: '#0d9488' }} />
        <p style={{ marginTop: '16px', color: '#64748b' }}>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminNav />
      <div className="admin-header">
        <h1><Calendar className="text-primary mr-2" /> Global Appointments</h1>
        <p>View all appointments booked across the platform.</p>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(app => (
                <tr key={app._id}>
                  <td>
                    <strong>{new Date(app.date).toLocaleDateString()}</strong>
                    <div className="text-sm text-muted">{app.time || app.timeSlot || 'Scheduled Time'}</div>
                  </td>
                  <td>{app.patient?.fullName || 'Unknown Patient'}</td>
                  <td>Dr. {app.doctor?.fullName || 'Unknown Doctor'}</td>
                  <td>
                    {app.status === 'completed' && <span className="badge success"><CheckCircle size={12}/> Completed</span>}
                    {(app.status === 'confirmed' || app.status === 'scheduled') && <span className="badge success" style={{ background: '#ecfdf5', color: '#059669' }}><CheckCircle size={12}/> Confirmed</span>}
                    {app.status === 'pending' && <span className="badge warning"><Clock size={12}/> Pending</span>}
                    {app.status === 'cancelled' && <span className="badge danger"><XCircle size={12}/> Cancelled</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && (
            <p className="text-center py-4 text-muted">No appointments found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAppointments;
