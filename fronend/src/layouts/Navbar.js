import React, { useState, useEffect } from 'react';
import { 
  Menu, X, Search, User, ChevronDown, Activity, 
  Pill, Stethoscope, FileText, Calendar, Upload, 
  Bot, Bell, LayoutDashboard, ShieldCheck, LogOut 
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('patient'); // Mock role

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isMobileMenuOpen]);

  // Links Data
  const getLinks = (role) => {
    const links = {
      patient: [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
        { name: 'Appointments', icon: <Calendar size={20} />, href: '/appointments' },
        { name: 'Reports', icon: <Upload size={20} />, href: '/reports' },
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

          {/* CENTER: SEARCH (Hidden on Mobile/Tablet) */}
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search doctors, symptoms..." 
            />
          </div>

          {/* RIGHT: DESKTOP NAV (Hidden on Mobile/Tablet) */}
          <div className="desktop-nav">
            
            {/* Explore Dropdown */}
            <div className="nav-item dropdown-trigger">
              <span>Explore</span> <ChevronDown size={14} />
              
              {/* Dropdown Menu Content */}
              <div className="dropdown-menu">
                <a href="/diseases" className="dropdown-link">
                  <Stethoscope size={16} /> Disease Encyclopedia
                </a>
                <a href="/medicines" className="dropdown-link">
                  <Pill size={16} /> Medicine Store
                </a>
                <a href="/symptoms" className="dropdown-link">
                  <Activity size={16} /> Symptom Checker
                </a>
              </div>
            </div>
            
            <div className="ai-badge">
              <Bot size={16} /> AI Assistant
            </div>

            <div className="profile-actions">
              <button className="icon-btn"><Bell size={20} /></button>
              <button className="avatar-btn"><User size={20} /></button>
            </div>
          </div>

          {/* RIGHT: MOBILE TOGGLE (Visible on Mobile/Tablet) */}
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
          {/* Role Switcher Demo */}
          <div className="role-switcher">
            <p>DEMO ROLE:</p>
            <div className="role-buttons">
              {['patient', 'doctor', 'admin'].map(role => (
                <button 
                  key={role} 
                  onClick={() => setUserRole(role)}
                  className={userRole === role ? 'active' : ''}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="mobile-section">
            <h3>My Health ({userRole})</h3>
            {currentLinks.map((link, index) => (
              <a key={index} href={link.href} className="mobile-link">
                <span className="icon-box">{link.icon}</span>
                {link.name}
              </a>
            ))}
          </div>

          <div className="mobile-section">
            <h3>Explore Health</h3>
            <a href="/diseases" className="mobile-link">
              <span className="icon-box"><Stethoscope size={20} /></span>
              Diseases
            </a>
            <a href="/medicines" className="mobile-link">
               <span className="icon-box"><Pill size={20} /></span>
               Medicines
            </a>
             <a href="/blog" className="mobile-link">
               <span className="icon-box"><FileText size={20} /></span>
               Blog
            </a>
          </div>

          <div className="mobile-footer">
            <button className="logout-btn">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;