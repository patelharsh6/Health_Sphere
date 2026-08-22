import React, { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck,
  Activity, ArrowRight, CheckCircle, Heart
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password, role);
      if (result.success) {
        // Redirect based on role
        if (result.user.role === 'patient') {
          navigate('/dashboard');
        } else if (result.user.role === 'doctor') {
          navigate('/doc-dashboard');
        } else {
          navigate('/admin');
        }
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SECTION: BRANDING & TRUST */}
      <div className="login-brand-section">
        <div className="brand-content">
          <Link to="/" className="login-logo">
            <div className="logo-icon-wrap">
              <Activity size={28} />
            </div>
            <h1>HealthSphere</h1>
          </Link>
          <p className="brand-tagline">Your Digital Healthcare Ecosystem</p>

          <div className="trust-points">
            <div className="trust-item">
              <ShieldCheck size={20} /> 
              <span>Secure Medical Data</span>
            </div>
            <div className="trust-item">
              <CheckCircle size={20} /> 
              <span>AI-Assisted Insights</span>
            </div>
            <div className="trust-item">
              <Heart size={20} /> 
              <span>Doctor-Guided Care</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="brand-decoration">
            <div className="deco-circle deco-1"></div>
            <div className="deco-circle deco-2"></div>
            <div className="deco-circle deco-3"></div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: FORM */}
      <div className="login-form-section">
        <div className="form-wrapper">
          {/* Mobile logo */}
          <Link to="/" className="mobile-logo">
            <Activity size={24} color="#0d9488" />
            <span>HealthSphere</span>
          </Link>

          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your details to access your secure health portal.</p>
          </div>

          {/* ROLE SELECTOR */}
          <div className="role-selector">
            <button
              className={`role-btn ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
              type="button"
            >
              Patient
            </button>
            <button
              className={`role-btn ${role === 'doctor' ? 'active' : ''}`}
              onClick={() => setRole('doctor')}
              type="button"
            >
              Doctor
            </button>
            <button
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
              type="button"
            >
              Admin
            </button>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="auth-form">

            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
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
              <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner"></span> Verifying...
                </span>
              ) : (
                <>
                  Login as {role.charAt(0).toUpperCase() + role.slice(1)}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          <div className="form-footer">
            <p>Don't have an account? <Link to="/signup">Register here</Link></p>
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