import React, { useState } from 'react';
import { Mail, ArrowLeft, HeartPulse, CheckCircle, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
// Reuses the Login stylesheet so both auth screens stay visually identical.
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  // Outside production the API returns the reset URL so the flow is testable
  // without a mail server wired up.
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.forgotPassword(email.trim());
      setDevResetUrl(res.data?.data?.resetUrl || "");
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not send the reset link. Please check your connection and try again.'
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
          <h1 className="brand-tagline">Reset your password</h1>
          <p>
            Enter the email you signed up with and we will send you a secure link
            to choose a new password. The link expires in 30 minutes.
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

          {sent ? (
            <>
              <div className="form-header">
                <CheckCircle size={40} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
                <h2>Check your email</h2>
                <p>
                  If an account exists for <strong>{email}</strong>, a reset link is
                  on its way. It expires in 30 minutes and can only be used once.
                </p>
              </div>

              {devResetUrl && (
                <div className="error-message" style={{ background: '#eff6ff', color: '#1e40af', wordBreak: 'break-all' }}>
                  <strong>Development mode:</strong> mail delivery is not configured yet, so
                  here is your link directly —{' '}
                  <a href={devResetUrl} style={{ color: '#1d4ed8', textDecoration: 'underline' }}>
                    {devResetUrl}
                  </a>
                </div>
              )}

              <div className="form-footer">
                <Link to="/login" className="forgot-link">
                  <ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Back to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="form-header">
                <h2>Forgot password?</h2>
                <p>No problem — we will email you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                  <label htmlFor="fp-email">Email Address</label>
                  <div className="input-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      id="fp-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? (
                    <span className="btn-loading">
                      <Loader size={18} className="spinner" /> Sending...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <div className="form-footer">
                <Link to="/login" className="forgot-link">
                  <ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
