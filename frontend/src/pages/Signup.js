import React, { useState } from 'react';
import {
  User, Mail, Lock, Phone, Calendar,
  Stethoscope, Building, ShieldCheck,
  AlertCircle, CheckCircle, ArrowRight,
  Activity, Eye, EyeOff, Heart
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
    medicalLicense: '',
    specialization: '',
    hospitalId: '',
    termsAccepted: false,
    aiDisclaimerAccepted: false
  });

  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email address";
    if (!phoneRegex.test(formData.phone)) newErrors.phone = "Phone must be 10 digits";

    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Min 8 chars: 1 Upper, 1 Lower, 1 Number, 1 Special";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (role === 'patient') {
      if (!formData.dob) newErrors.dob = "Date of Birth is required";
      if (!formData.gender) newErrors.gender = "Gender is required";
    }
    if (role === 'doctor') {
      if (!formData.medicalLicense) newErrors.medicalLicense = "License number is required";
      if (!formData.specialization) newErrors.specialization = "Specialization is required";
    }
    if (role === 'admin') {
      if (!formData.hospitalId) newErrors.hospitalId = "Hospital ID is required";
    }

    if (!formData.termsAccepted) newErrors.terms = "You must accept the Terms";
    if (!formData.aiDisclaimerAccepted) newErrors.ai = "You must acknowledge AI limitations";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (validateForm()) {
      setIsLoading(true);
      try {
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role,
          termsAccepted: formData.termsAccepted,
          aiDisclaimerAccepted: formData.aiDisclaimerAccepted,
        };

        // Add role-specific fields
        if (role === 'patient') {
          payload.dob = formData.dob;
          payload.gender = formData.gender;
        } else if (role === 'doctor') {
          payload.medicalLicense = formData.medicalLicense;
          payload.specialization = formData.specialization;
        } else if (role === 'admin') {
          payload.hospitalId = formData.hospitalId;
        }

        const result = await register(payload);
        if (result.success) {
          navigate('/dashboard');
        } else {
          setServerError(result.message || 'Registration failed.');
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Registration failed. Please try again.';
        setServerError(msg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="signup-page">

      {/* LEFT: Trust & Branding */}
      <div className="signup-left">
        <div className="signup-brand-inner">
          <Link to="/" className="signup-logo-link">
            <div className="su-logo-icon">
              <Activity size={28} />
            </div>
            <h1>HealthSphere</h1>
          </Link>
          <p className="su-subtitle">Create your secure health account</p>

          <div className="benefit-list">
            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4>Bank-Grade Security</h4>
                <p>Your medical data is 256-bit encrypted.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <CheckCircle size={22} />
              </div>
              <div>
                <h4>AI-Assisted Insights</h4>
                <p>Get smart health predictions instantly.</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon-wrap">
                <Heart size={22} />
              </div>
              <div>
                <h4>Role-Based Access</h4>
                <p>Dedicated portals for Patients & Doctors.</p>
              </div>
            </div>
          </div>

          {/* Decorative */}
          <div className="su-decoration">
            <div className="su-deco-circle su-d1"></div>
            <div className="su-deco-circle su-d2"></div>
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="signup-right">
        <div className="su-form-box">
          {/* Mobile logo */}
          <Link to="/" className="su-mobile-logo">
            <Activity size={24} color="#0d9488" />
            <span>HealthSphere</span>
          </Link>

          <h2>Get Started</h2>
          <p className="su-form-subtitle">Join thousands of users improving their health.</p>

          {/* Role Tabs */}
          <div className="su-role-tabs">
            <button
              className={`su-tab ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
              type="button"
            >
              <User size={16} /> Patient
            </button>
            <button
              className={`su-tab ${role === 'doctor' ? 'active' : ''}`}
              onClick={() => setRole('doctor')}
              type="button"
            >
              <Stethoscope size={16} /> Doctor
            </button>
            <button
              className={`su-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
              type="button"
            >
              <Building size={16} /> Admin
            </button>
          </div>

          {serverError && (
            <div className="su-server-error">
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="su-form">
            {/* Common Fields */}
            <div className="su-input-row">
              <div className="su-input-group">
                <label>Full Name</label>
                <div className="su-input-wrapper">
                  <User size={18} />
                  <input type="text" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} />
                </div>
                {errors.fullName && <span className="su-error">{errors.fullName}</span>}
              </div>
              <div className="su-input-group">
                <label>Mobile Number</label>
                <div className="su-input-wrapper">
                  <Phone size={18} />
                  <input type="text" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} />
                </div>
                {errors.phone && <span className="su-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="su-input-group">
              <label>Email Address</label>
              <div className="su-input-wrapper">
                <Mail size={18} />
                <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} />
              </div>
              {errors.email && <span className="su-error">{errors.email}</span>}
            </div>

            {/* DYNAMIC FIELDS BASED ON ROLE */}
            {role === 'patient' && (
              <div className="su-input-row">
                <div className="su-input-group">
                  <label>Date of Birth</label>
                  <div className="su-input-wrapper">
                    <Calendar size={18} />
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                  </div>
                  {errors.dob && <span className="su-error">{errors.dob}</span>}
                </div>
                <div className="su-input-group">
                  <label>Gender</label>
                  <select name="gender" className="su-select" value={formData.gender} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <span className="su-error">{errors.gender}</span>}
                </div>
              </div>
            )}

            {role === 'doctor' && (
              <div className="su-input-row">
                <div className="su-input-group">
                  <label>Medical License No.</label>
                  <div className="su-input-wrapper">
                    <Stethoscope size={18} />
                    <input type="text" name="medicalLicense" placeholder="MD-12345" value={formData.medicalLicense} onChange={handleChange} />
                  </div>
                  {errors.medicalLicense && <span className="su-error">{errors.medicalLicense}</span>}
                </div>
                <div className="su-input-group">
                  <label>Specialization</label>
                  <select name="specialization" className="su-select" value={formData.specialization} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Orthopedist">Orthopedist</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                  </select>
                  {errors.specialization && <span className="su-error">{errors.specialization}</span>}
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="su-input-group">
                <label>Hospital ID / Code</label>
                <div className="su-input-wrapper">
                  <Building size={18} />
                  <input type="text" name="hospitalId" placeholder="HOSP-001" value={formData.hospitalId} onChange={handleChange} />
                </div>
                {errors.hospitalId && <span className="su-error">{errors.hospitalId}</span>}
              </div>
            )}

            {/* Passwords */}
            <div className="su-input-row">
              <div className="su-input-group">
                <label>Password</label>
                <div className="su-input-wrapper">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button type="button" className="su-toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="su-error">{errors.password}</span>}
              </div>
              <div className="su-input-group">
                <label>Confirm Password</label>
                <div className="su-input-wrapper">
                  <Lock size={18} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button type="button" className="su-toggle-pw" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="su-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Legal Checkboxes */}
            <div className="su-checkboxes">
              <label className="su-checkbox-label">
                <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} />
                <span>I agree to the <a href="#">Terms & Conditions</a></span>
              </label>
              {errors.terms && <span className="su-error">{errors.terms}</span>}

              <label className="su-checkbox-label">
                <input type="checkbox" name="aiDisclaimerAccepted" checked={formData.aiDisclaimerAccepted} onChange={handleChange} />
                <span>I understand that AI suggestions are for assistance, not final diagnosis.</span>
              </label>
              {errors.ai && <span className="su-error">{errors.ai}</span>}
            </div>

            <button type="submit" className="su-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="su-btn-loading">
                  <span className="su-spinner"></span> Creating Account...
                </span>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="su-login-link">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;