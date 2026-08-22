import React, { useState } from 'react';
import { Lock, Eye, EyeOff, HeartPulse, CheckCircle, Loader, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
// Reuses the Login stylesheet so both auth screens stay visually identical.
import './Login.css';

// Mirrors STRONG_PASSWORD in backend/src/validators/authValidators.js — keeping
// them in sync means the user never gets a surprise 400 from the server.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&).';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!STRONG_PASSWORD.test(password)) {
      setError(PASSWORD_MESSAGE);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      // The token is single-use and the old session is invalidated server-side,
      // so send them to a clean sign-in rather than auto-logging them in.
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'This reset link is invalid or has expired. Please request a new one.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand-section">
        <div className="brand-content">
          <Link to="/" className="login-logo">
            <div className="logo-icon-wrap">
              <HeartPulse size={28} />
            </div>
            <span>HealthSphere</span>
          </Link>
          <h1 className="brand-tagline">Choose a new password</h1>
          <p>
            Pick something you have not used before. Once you save it, you will be
            signed out everywhere else for your security.
          </p>
        </div>
        <div className="brand-decoration">
          <div className="deco-circle deco-1"></div>
          <div className="deco-circle deco-2"></div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="form-wrapper">
          <Link to="/" className="mobile-logo">
            <HeartPulse size={24} />
            <span>HealthSphere</span>
          </Link>

          {done ? (
            <div className="form-header">
              <CheckCircle size={40} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
              <h2>Password updated</h2>
              <p>You can now sign in with your new password. Taking you there...</p>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h2>Set a new password</h2>
                <p>{PASSWORD_MESSAGE}</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                  <label htmlFor="rp-password">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="rp-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter a new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
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

                <div className="input-group">
                  <label htmlFor="rp-confirm">Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="rp-confirm"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter the new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? (
                    <span className="btn-loading">
                      <Loader size={18} className="spinner" /> Saving...
                    </span>
                  ) : (
                    'Save new password'
                  )}
                </button>
              </form>

              <div className="form-footer">
                <Link to="/forgot-password" className="forgot-link">
                  <ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Request a new link
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
