import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Search, User, ChevronDown, Activity, 
  Pill, Stethoscope, FileText, Calendar, Upload, 
  Bot, Bell, LayoutDashboard, ShieldCheck, LogOut 
} from 'lucide-react';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = user?.role || 'patient';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMobileMenuOpen]);

  const getLinks = (role) => {
    const links = {
      patient: [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
        { name: 'Appointments', icon: <Calendar size={20} />, href: '/appointments' },
        { name: 'Reports', icon: <Upload size={20} />, href: '/upload' },
      ],
      doctor: [
        { name: 'Doctor Panel', icon: <Activity size={20} />, href: '/doc-dashboard' },
        { name: 'Patients', icon: <User size={20} />, href: '/patients' },
        { name: 'Schedule', icon: <Calendar size={20} />, href: '/schedule' },
      ],
      admin: [
        { name: 'Admin', icon: <ShieldCheck size={20} />, href: '/admin' },
        { name: 'Analytics', icon: <Activity size={20} />, href: '/analytics' },
      ]
    };
    return links[role] || links.patient;
  };

  const currentLinks = getLinks(userRole);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const profileClick = () => {
    navigate('/profile');
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return 'U';
    return user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          
          {/* LEFT: LOGO */}
          <a href="/" className="brand">
            <div className="logo-icon">
              <Activity size={24} />
            </div>
            <div className="brand-text">
              <h1>HealthSphere</h1>
              <span>Advanced Healthcare</span>
            </div>
          </a>

          {/* CENTER: SEARCH */}
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search doctors, symptoms..." 
            />
          </div>

          {/* RIGHT: DESKTOP NAV */}
          <div className="desktop-nav">
            
            <div className="nav-item dropdown-trigger">
              <span>Explore</span> <ChevronDown size={14} />
              <div className="dropdown-menu">
                <a href="/symptoms" className="dropdown-link">
                  <Stethoscope size={16} /> Symptom Checker
                </a>
                {userRole !== 'doctor' && (
                  <a href="/doctors" className="dropdown-link">
                    <Activity size={16} /> Find Doctors
                  </a>
                )}
              </div>
            </div>
            
            <div className="ai-badge">
              <Link to="/ai-assistant" className="ai-link">
                <Bot size={16} /> AI Assistant
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="profile-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="icon-btn"><Bell size={20} /></button>
                
                <div className="nav-item dropdown-trigger" style={{ padding: 0 }}>
                  <button className="avatar-btn" title={user?.fullName} style={{ pointerEvents: 'none' }}>
                    {getInitials()}
                  </button>
                  <div className="dropdown-menu profile-dropdown" style={{ minWidth: '180px' }}>
                    <a href={userRole === 'doctor' ? "/doc-dashboard" : "/dashboard"} className="dropdown-link">
                      <LayoutDashboard size={16} /> Dashboard
                    </a>
                    <a href="/profile" className="dropdown-link">
                      <User size={16} /> My Profile
                    </a>
                    <button className="dropdown-link" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="profile-actions">
                <Link to="/login" className="nav-login-btn">Login</Link>
                <Link to="/signup" className="nav-signup-btn">Sign Up</Link>
              </div>
            )}
          </div>

          {/* RIGHT: MOBILE TOGGLE */}
          <button 
            className="mobile-toggle" 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-header">
           <span className="mobile-brand">Menu</span>
           <button className="close-btn" onClick={() => setIsMobileMenuOpen(false)}>
             <X size={28} />
           </button>
        </div>

        <div className="mobile-content">
          {isAuthenticated && (
            <div className="role-switcher">
              <p>Logged in as: <strong>{user?.fullName}</strong> ({userRole})</p>
            </div>
          )}

          <div className="mobile-section">
            <h3>My Health ({userRole})</h3>
            {currentLinks.map((link, index) => (
              <a key={index} href={link.href} className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="icon-box">{link.icon}</span>
                {link.name}
              </a>
            ))}
          </div>

          <div className="mobile-section">
            <h3>Explore Health</h3>
            <a href="/symptoms" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="icon-box"><Stethoscope size={20} /></span>
              Symptom Checker
            </a>
            {userRole !== 'doctor' && (
              <a href="/doctors" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                 <span className="icon-box"><Activity size={20} /></span>
                 Find Doctors
              </a>
            )}
          </div>

          <div className="mobile-footer">
            {isAuthenticated ? (
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="/login" className="logout-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Login</a>
                <a href="/signup" className="logout-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>Sign Up</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;