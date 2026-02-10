import React, { useState } from 'react';
import { 
  Mail, Lock, Eye, EyeOff, ShieldCheck, 
  Activity, ArrowRight, CheckCircle 
} from 'lucide-react';
import './Login.css';

const Login = () => {
  const [role, setRole] = useState('patient'); // 'patient', 'doctor', 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // SIMULATION: Fake network delay
    setTimeout(() => {
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields.");
        setIsLoading(false);
        return;
      }

      // Mock Redirect Logic (For Viva explanation)
      alert(`Login Successful! Redirecting to ${role.toUpperCase()} Dashboard...`);
      
      // In real app, you would do: navigate(`/${role}-dashboard`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="login-container">
      
      {/* LEFT SECTION: BRANDING & TRUST */}
      <div className="login-brand-section">
        <div className="brand-content">
          <div className="login-logo">
            <Activity size={40} className="logo-icon-large" />
            <h1>HealthSphere</h1>
          </div>
          <p className="brand-tagline">Your Digital Healthcare Ecosystem</p>
          
          <div className="trust-points">
            <div className="trust-item">
              <ShieldCheck size={20} /> Secure Medical Data
            </div>
            <div className="trust-item">
              <CheckCircle size={20} /> AI-Assisted Insights
            </div>
            <div className="trust-item">
              <Activity size={20} /> Doctor-Guided Care
            </div>
          </div>

          <div className="brand-illustration">
             {/* Abstract medical visual */}
             <div className="pulse-circle"></div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: FORM */}
      <div className="login-form-section">
        <div className="form-wrapper">
          
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your details to access your secure health portal.</p>
          </div>

          {/* ROLE SELECTOR */}
          <div className="role-selector">
            <button 
              className={`role-btn ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
            >
              Patient
            </button>
            <button 
              className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
              onClick={() => setRole('doctor')}
            >
              Doctor
            </button>
            <button 
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="auth-form">
            
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-actions">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? "Verifying..." : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              {!isLoading && <ArrowRight size={18} />}
            </button>

          </form>

          <div className="form-footer">
            <p>Don't have an account? <a href="#">Register here</a></p>
            <div className="security-badge">
              <ShieldCheck size={14} /> Your data is 256-bit encrypted
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;