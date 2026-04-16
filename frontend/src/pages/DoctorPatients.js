import React from 'react';
import { Users, Search, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorPatients = () => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
        <Users size={32} color="#0ea5e9" />
        <h1 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>My Patients</h1>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input type="text" placeholder="Search patients..." style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px' }} />
          </div>
          <button style={{ padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Search</button>
        </div>

        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <h3>No patients found</h3>
          <p>You haven't consulted any patients yet.</p>
          <Link to="/doc-dashboard" style={{ color: '#0ea5e9', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginTop: '12px' }}>
            Back to Dashboard <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;
