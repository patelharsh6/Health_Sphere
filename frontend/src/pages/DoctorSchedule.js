import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DoctorSchedule = () => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
        <Calendar size={32} color="#8b5cf6" />
        <h1 style={{ margin: 0, fontSize: '28px', color: '#1e293b' }}>My Schedule</h1>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', color: '#64748b' }}>
        <Clock size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
        <h3>Schedule Management Coming Soon</h3>
        <p>In the next update, you will be able to set your daily availability, block out holidays, and manage time slots dynamically.</p>
        <Link to="/doc-dashboard" style={{ color: '#8b5cf6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', marginTop: '12px' }}>
          Back to Dashboard <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default DoctorSchedule;
