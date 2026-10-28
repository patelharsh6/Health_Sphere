import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Search, User, ChevronDown, Activity, 
  Pill, Stethoscope, FileText, Calendar, Upload, 
  Bot, Bell, LayoutDashboard, LogOut,
  Heart, BookOpen, ShieldCheck
} from 'lucide-react';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

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
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin/dashboard' },
        { name: 'Users', icon: <User size={20} />, href: '/admin/users' },
        { name: 'Doctors', icon: <Stethoscope size={20} />, href: '/admin/doctors' },
        { name: 'Appointments', icon: <Calendar size={20} />, href: '/admin/appointments' },
        { name: 'Content', icon: <FileText size={20} />, href: '/admin/content' },
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
          <Link to="/" className="brand">
            <div className="logo-icon">
              <Activity size={24} />
            </div>
            <div className="brand-text">
              <h1>HealthSphere</h1>
              <span>Advanced Healthcare</span>
            </div>
          </Link>

          {/* CENTER: SEARCH */}
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search doctors, conditions..." 
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && navSearch.trim()) {
                  navigate(`/doctors?search=${encodeURIComponent(navSearch.trim())}`);
                  setNavSearch('');
                }
              }}
            />
          </div>

          {/* RIGHT: DESKTOP NAV */}
          <div className="desktop-nav">
            
            <div className="nav-item dropdown-trigger">
              <span>Explore</span> <ChevronDown size={14} />
              <div className="dropdown-menu">
                <Link to="/symptoms" className="dropdown-link">
                  <Stethoscope size={16} /> Symptom Checker
                </Link>
                <Link to="/diseases" className="dropdown-link">
                  <BookOpen size={16} /> Disease Encyclopedia
                </Link>
                <Link to="/medicines" className="dropdown-link">
                  <Pill size={16} /> Medicine Info
                </Link>
                {userRole !== 'doctor' && (
                  <Link to="/doctors" className="dropdown-link">
                    <Heart size={16} /> Find Doctors
                  </Link>
                )}
                {userRole === 'admin' && (
                  <Link to="/admin/dashboard" className="dropdown-link" style={{ color: '#0d9488', fontWeight: 600 }}>
                    <ShieldCheck size={16} /> Admin Panel
                  </Link>
                )}
              </div>
            </div>
            
            <div className="ai-badge">
              <Link to="/ai-assistant" className="ai-link">
                <Bot size={16} /> AI Assistant
              </Link>
            </div>

            {userRole === 'admin' && (
              <Link to="/admin/dashboard" className="nav-item" style={{ textDecoration: 'none', color: '#0d9488', fontWeight: 600 }}>
                Admin Portal
              </Link>
            )}

            {isAuthenticated ? (
              <div className="profile-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to={userRole === 'doctor' ? "/schedule" : "/my-appointments"} className="icon-btn" title="Appointments">
                  <Calendar size={18} />
                </Link>
                
                <div className="nav-item dropdown-trigger" style={{ padding: 0 }}>
                  <button className="avatar-btn" title={user?.fullName} style={{ pointerEvents: 'none' }}>
                    {getInitials()}
                  </button>
                  <div className="dropdown-menu profile-dropdown" style={{ minWidth: '200px' }}>
                    <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <strong style={{ display: 'block', color: '#1e293b' }}>{user?.fullName}</strong>
                      <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{userRole} account</span>
                    </div>

                    {userRole === 'patient' && (
                      <>
                        <Link to="/dashboard" className="dropdown-link">
                          <LayoutDashboard size={16} /> Dashboard
                        </Link>
                        <Link to="/my-appointments" className="dropdown-link">
                          <Calendar size={16} /> My Appointments
                        </Link>
                        <Link to="/upload" className="dropdown-link">
                          <Upload size={16} /> Lab Reports
                        </Link>
                      </>
                    )}

                    {userRole === 'doctor' && (
                      <>
                        <Link to="/doc-dashboard" className="dropdown-link">
                          <LayoutDashboard size={16} /> Doctor Dashboard
                        </Link>
                        <Link to="/schedule" className="dropdown-link">
                          <Calendar size={16} /> My Schedule
                        </Link>
                        <Link to="/patients" className="dropdown-link">
                          <User size={16} /> My Patients
                        </Link>
                      </>
                    )}

                    {userRole === 'admin' && (
                      <>
                        <Link to="/admin/dashboard" className="dropdown-link">
                          <LayoutDashboard size={16} /> Admin Dashboard
                        </Link>
                        <Link to="/admin/users" className="dropdown-link">
                          <User size={16} /> Manage Users
                        </Link>
                        <Link to="/admin/doctors" className="dropdown-link">
                          <Stethoscope size={16} /> Verify Doctors
                        </Link>
                        <Link to="/admin/appointments" className="dropdown-link">
                          <Calendar size={16} /> All Appointments
                        </Link>
                        <Link to="/admin/content" className="dropdown-link">
                          <FileText size={16} /> Content Catalog
                        </Link>
                      </>
                    )}

                    <Link to="/profile" className="dropdown-link">
                      <User size={16} /> Profile & Settings
                    </Link>
                    <button className="dropdown-link" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: '#ef4444' }}>
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
              <Link key={index} to={link.href} className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="icon-box">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mobile-section">
            <h3>Explore Health</h3>
            <Link to="/symptoms" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="icon-box"><Stethoscope size={20} /></span>
              Symptom Checker
            </Link>
            <Link to="/diseases" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="icon-box"><BookOpen size={20} /></span>
              Disease Encyclopedia
            </Link>
            <Link to="/medicines" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="icon-box"><Pill size={20} /></span>
              Medicine Info
            </Link>
            {userRole !== 'doctor' && (
              <Link to="/doctors" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                 <span className="icon-box"><Heart size={20} /></span>
                 Find Doctors
              </Link>
            )}
            <Link to="/ai-assistant" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="icon-box"><Bot size={20} /></span>
              AI Assistant
            </Link>
          </div>

          <div className="mobile-footer">
            {isAuthenticated ? (
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/login" className="logout-btn" style={{ textDecoration: 'none', textAlign: 'center', background: '#f0fdfa', color: '#0d9488' }}>Login</Link>
                <Link to="/signup" className="logout-btn" style={{ textDecoration: 'none', textAlign: 'center', background: '#0d9488', color: 'white' }}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;