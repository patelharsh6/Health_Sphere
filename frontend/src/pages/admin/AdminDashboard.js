import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Activity, FileText, CheckCircle, Clock, XCircle, LayoutDashboard } from 'lucide-react';
import { adminAPI } from '../../../services/api';
import './Admin.css';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminAPI.getStats();
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="admin-page loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><LayoutDashboard className="text-primary mr-2" /> Admin Dashboard</h1>
        <p>Platform Overview and Statistics</p>
      </div>

      <div className="admin-grid">
        {/* USERS STATS */}
        <div className="admin-card stats-card">
          <div className="stats-icon text-blue"><Users size={24} /></div>
          <div className="stats-info">
            <h3>Total Users</h3>
            <p className="stats-number">{stats?.users?.total || 0}</p>
            <div className="stats-sub">
              <span>{stats?.users?.patients || 0} Patients</span>
              <span>{stats?.users?.doctors || 0} Doctors</span>
            </div>
          </div>
        </div>

        {/* DOCTORS STATS */}
        <div className="admin-card stats-card">
          <div className="stats-icon text-green"><UserPlus size={24} /></div>
          <div className="stats-info">
            <h3>Verified Doctors</h3>
            <p className="stats-number">{stats?.users?.verifiedDoctors || 0}</p>
            <Link to="/admin/doctors" className="admin-link">Review pending doctors →</Link>
          </div>
        </div>

        {/* APPOINTMENTS STATS */}
        <div className="admin-card stats-card">
          <div className="stats-icon text-orange"><Activity size={24} /></div>
          <div className="stats-info">
            <h3>Appointments</h3>
            <p className="stats-number">
              {Object.values(stats?.appointments || {}).reduce((a, b) => a + b, 0)}
            </p>
            <div className="stats-sub badges">
              <span className="badge warning"><Clock size={12}/> {stats?.appointments?.pending || 0}</span>
              <span className="badge success"><CheckCircle size={12}/> {stats?.appointments?.completed || 0}</span>
              <span className="badge danger"><XCircle size={12}/> {stats?.appointments?.cancelled || 0}</span>
            </div>
          </div>
        </div>

        {/* CONTENT STATS */}
        <div className="admin-card stats-card">
          <div className="stats-icon text-purple"><FileText size={24} /></div>
          <div className="stats-info">
            <h3>System Content</h3>
            <div className="content-breakdown">
              <div><strong>{stats?.content?.reports || 0}</strong> Reports Uploaded</div>
              <div><strong>{stats?.content?.diseases || 0}</strong> Diseases Listed</div>
              <div><strong>{stats?.content?.medicines || 0}</strong> Medicines Listed</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
