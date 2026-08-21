import React, { useState, useEffect } from 'react';
import { FileText, Trash2, PlusCircle } from 'lucide-react';
import { adminAPI } from '../../../services/api';
import './Admin.css';

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState('diseases');
  const [diseases, setDiseases] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'diseases') {
        const res = await adminAPI.getDiseases();
        if (res.data.success) setDiseases(res.data.data);
      } else {
        const res = await adminAPI.getMedicines();
        if (res.data.success) setMedicines(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load content", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item? This action cannot be undone.')) return;
    try {
      if (activeTab === 'diseases') {
        await adminAPI.deleteDisease(id);
      } else {
        await adminAPI.deleteMedicine(id);
      }
      fetchContent();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const handleCreatePrompt = async () => {
    const name = window.prompt(`Enter new ${activeTab === 'diseases' ? 'Disease' : 'Medicine'} Name:`);
    if (!name) return;
    
    // Very basic creation payload to seed DB. 
    // In production, this would open a rich form modal.
    const payload = {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: 'Pending description',
      category: 'General',
      specialistType: 'General Physician'
    };

    try {
      if (activeTab === 'diseases') {
        await adminAPI.createDisease(payload);
      } else {
        await adminAPI.createMedicine({ ...payload, manufacturer: 'Unknown' });
      }
      fetchContent();
    } catch (err) {
      alert('Failed to create item.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><FileText className="text-primary mr-2" /> Content Management</h1>
        <p>Manage diseases and medicines catalog.</p>
      </div>

      <div className="admin-card">
        <div className="flex justify-between items-center mb-4">
          <div className="tabs" style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={`action-btn ${activeTab === 'diseases' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('diseases')}
            >
              Diseases
            </button>
            <button 
              className={`action-btn ${activeTab === 'medicines' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('medicines')}
            >
              Medicines
            </button>
          </div>
          <button className="action-btn btn-secondary" onClick={handleCreatePrompt}>
            <PlusCircle size={16} /> Add New Entry
          </button>
        </div>

        {loading ? (
          <div className="loading py-4">Loading content...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'diseases' ? diseases : medicines).map(item => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="text-sm text-muted">/{item.slug}</div>
                    </td>
                    <td><span className="badge info">{item.category}</span></td>
                    <td className="actions">
                      <button 
                        className="action-btn small btn-danger"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(activeTab === 'diseases' ? diseases : medicines).length === 0 && (
              <p className="text-center py-4 text-muted">No entries found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContent;
