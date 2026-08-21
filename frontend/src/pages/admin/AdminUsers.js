import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { adminAPI, assetUrl } from '../../../services/api';
import './Admin.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
    try {
      await adminAPI.updateUserStatus(id, !currentStatus);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('WARNING: This will permanently delete the user and their profile. Proceed?')) return;
    try {
      await adminAPI.deleteUser(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  if (loading) return <div className="admin-page loading">Loading users...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><Users className="text-primary mr-2" /> User Management</h1>
        <p>View, suspend, or delete platform users.</p>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td className="avatar-cell">
                    <img 
                      src={assetUrl(user.avatar) || 'https://via.placeholder.com/40'} 
                      alt="avatar" 
                      className="avatar" 
                    />
                    <div>
                      <strong>{user.fullName}</strong>
                      <div className="text-sm text-muted">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <div className="text-sm">{user.email}</div>
                    <div className="text-sm text-muted">{user.phone}</div>
                  </td>
                  <td>
                    {user.isActive ? (
                      <span className="badge success"><CheckCircle size={12}/> Active</span>
                    ) : (
                      <span className="badge danger"><XCircle size={12}/> Suspended</span>
                    )}
                  </td>
                  <td className="actions">
                    <button 
                      className={`action-btn small ${user.isActive ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleToggleStatus(user._id, user.isActive)}
                      disabled={user.role === 'admin'}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="action-btn small btn-danger"
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={user.role === 'admin'}
                      title="Delete Permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
