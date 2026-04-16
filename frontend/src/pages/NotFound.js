import React from 'react';
import { Home, ArrowLeft, Search, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-content">
        {/* Animated 404 */}
        <div className="notfound-visual">
          <div className="notfound-number">
            <span>4</span>
            <div className="notfound-pulse">
              <Activity size={64} />
            </div>
            <span>4</span>
          </div>
        </div>

        <h1>Page Not Found</h1>
        <p className="notfound-desc">
          The page you're looking for doesn't exist or has been moved to
          another location in the HealthSphere ecosystem.
        </p>

        <div className="notfound-actions">
          <button className="nf-btn nf-btn-primary" onClick={() => navigate('/')}>
            <Home size={18} /> Go Home
          </button>
          <button className="nf-btn nf-btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>

        <div className="notfound-links">
          <p>Quick links:</p>
          <div className="nf-link-grid">
            <Link to="/symptoms">Symptom Checker</Link>
            <Link to="/doctors">Find Doctors</Link>
            <Link to="/diseases">Explore Diseases</Link>
            <Link to="/ai-assistant">AI Assistant</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
