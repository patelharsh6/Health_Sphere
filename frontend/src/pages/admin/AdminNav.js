import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, 
  Calendar, FileText, ArrowLeft, Shield 
} from 'lucide-react';

const AdminNav = () => {
  return (
    <div style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '0.75rem 2rem',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      borderRadius: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: '#f0fdfa',
          color: '#0d9488',
          padding: '6px',
          borderRadius: '8px',
          display: 'flex'
        }}>
          <Shield size={20} />
        </div>
        <div>
          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>Administration Control Panel</strong>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Platform Management & Governance</span>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <NavLink 
          to="/admin/dashboard" 
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? '#0d9488' : '#475569',
            background: isActive ? '#f0fdfa' : 'transparent',
            border: isActive ? '1px solid #ccfbf1' : '1px solid transparent',
            transition: 'all 0.15s ease'
          })}
        >
          <LayoutDashboard size={16} /> Overview
        </NavLink>

        <NavLink 
          to="/admin/users" 
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? '#0d9488' : '#475569',
            background: isActive ? '#f0fdfa' : 'transparent',
            border: isActive ? '1px solid #ccfbf1' : '1px solid transparent',
            transition: 'all 0.15s ease'
          })}
        >
          <Users size={16} /> Users
        </NavLink>

        <NavLink 
          to="/admin/doctors" 
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? '#0d9488' : '#475569',
            background: isActive ? '#f0fdfa' : 'transparent',
            border: isActive ? '1px solid #ccfbf1' : '1px solid transparent',
            transition: 'all 0.15s ease'
          })}
        >
          <UserPlus size={16} /> Doctor Approvals
        </NavLink>

        <NavLink 
          to="/admin/appointments" 
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? '#0d9488' : '#475569',
            background: isActive ? '#f0fdfa' : 'transparent',
            border: isActive ? '1px solid #ccfbf1' : '1px solid transparent',
            transition: 'all 0.15s ease'
          })}
        >
          <Calendar size={16} /> Appointments
        </NavLink>

        <NavLink 
          to="/admin/content" 
          style={({ isActive }) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? '#0d9488' : '#475569',
            background: isActive ? '#f0fdfa' : 'transparent',
            border: isActive ? '1px solid #ccfbf1' : '1px solid transparent',
            transition: 'all 0.15s ease'
          })}
        >
          <FileText size={16} /> Content
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminNav;
