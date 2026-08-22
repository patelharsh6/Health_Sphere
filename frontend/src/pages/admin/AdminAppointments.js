import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { adminAPI } from '../../services/api';
import './Admin.css';

const AdminAppointments = () => {
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
    fetchAppointments();
  }, []);

  if (loading) return <div className="admin-page loading">Loading appointments...</div>;

  return (
    <div className="admin-page">
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
                    <div className="text-sm text-muted">{app.timeSlot}</div>
                  </td>
                  <td>{app.patient?.fullName || 'Unknown Patient'}</td>
                  <td>Dr. {app.doctor?.fullName || 'Unknown Doctor'}</td>
                  <td>
                    {app.status === 'completed' && <span className="badge success"><CheckCircle size={12}/> Completed</span>}
                    {app.status === 'scheduled' && <span className="badge warning"><Clock size={12}/> Scheduled</span>}
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
