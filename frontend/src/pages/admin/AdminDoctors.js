import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, ShieldAlert } from 'lucide-react';
import { adminAPI } from '../../../services/api';
import './Admin.css';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingDoctors = async () => {
    try {
      const res = await adminAPI.getPendingDoctors();
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const handleVerify = async (id) => {
    if (!window.confirm('Verify this doctor\'s medical license? They will be immediately available for appointments.')) return;
    try {
      await adminAPI.verifyDoctor(id);
      fetchPendingDoctors();
    } catch (err) {
      alert('Failed to verify doctor.');
    }
  };

  if (loading) return <div className="admin-page loading">Loading pending verifications...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><UserPlus className="text-primary mr-2" /> Pending Doctor Verifications</h1>
        <p>Review medical licenses and approve doctor profiles.</p>
      </div>

      <div className="admin-card">
        {doctors.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={48} className="text-green mb-3" />
            <h3>All caught up!</h3>
            <p>There are no doctors awaiting verification.</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Doctor Name</th>
                  <th>Contact</th>
                  <th>Specialization</th>
                  <th>Medical License</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => (
                  <tr key={doc._id}>
                    <td>
                      <strong>Dr. {doc.user?.fullName}</strong>
                      <div className="text-sm text-muted">Joined {new Date(doc.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div className="text-sm">{doc.user?.email}</div>
                      <div className="text-sm text-muted">{doc.user?.phone}</div>
                    </td>
                    <td><span className="badge info">{doc.specialization}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={16} className="text-orange" />
                        <span className="font-mono">{doc.medicalLicense}</span>
                      </div>
                    </td>
                    <td className="actions">
                      <button 
                        className="action-btn small btn-primary"
                        onClick={() => handleVerify(doc._id)}
                      >
                        <CheckCircle size={14} /> Verify & Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoctors;
