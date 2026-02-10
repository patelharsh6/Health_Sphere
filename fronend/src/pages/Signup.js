import React, { useState } from 'react';
import { 
  User, Mail, Lock, Phone, Calendar, 
  Stethoscope, Building, ShieldCheck, 
  AlertCircle, CheckCircle, ArrowRight 
} from 'lucide-react';
import './Signup.css';

const Signup = () => {
  const [role, setRole] = useState('patient'); // 'patient', 'doctor', 'admin'
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Patient Specific
    dob: '',
    gender: '',
    // Doctor Specific
    medicalLicense: '',
    specialization: '',
    // Admin Specific
    hospitalId: '',
    termsAccepted: false,
    aiDisclaimerAccepted: false
  });

  // Validation Logic
  const validateForm = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email address";
    if (!phoneRegex.test(formData.phone)) newErrors.phone = "Phone must be 10 digits";
    
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Password: 8+ chars, 1 Upper, 1 Lower, 1 Number, 1 Special";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Role Specific Validation
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

    // Checkboxes
    if (!formData.termsAccepted) newErrors.terms = "You must accept the Terms";
    if (!formData.aiDisclaimerAccepted) newErrors.ai = "You must acknowledge AI limitations";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      // Simulate API Call
      setTimeout(() => {
        alert("Account Created Successfully! Redirecting to Dashboard...");
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };

  return (
    <div className="signup-container">
      
      {/* LEFT: Trust & Guidance */}
      <div className="signup-left">
        <div className="signup-brand">
          <h1>HealthSphere</h1>
          <p className="brand-subtitle">Create your secure health account</p>
          
          <div className="benefit-list">
            <div className="benefit-item">
              <ShieldCheck className="benefit-icon" />
              <div>
                <h4>Bank-Grade Security</h4>
                <p>Your medical data is 256-bit encrypted.</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle className="benefit-icon" />
              <div>
                <h4>AI-Assisted Insights</h4>
                <p>Get smart health predictions instantly.</p>
              </div>
            </div>
            <div className="benefit-item">
              <User className="benefit-icon" />
              <div>
                <h4>Role-Based Access</h4>
                <p>Dedicated portals for Patients & Doctors.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="signup-right">
        <div className="form-box">
          <h2>Get Started</h2>
          <p className="form-subtitle">Join thousands of users improving their health.</p>

          {/* Role Tabs */}
          <div className="role-tabs">
            <button 
              className={`tab ${role === 'patient' ? 'active' : ''}`}
              onClick={() => setRole('patient')}
            >
              Patient
            </button>
            <button 
              className={`tab ${role === 'doctor' ? 'active' : ''}`}
              onClick={() => setRole('doctor')}
            >
              Doctor
            </button>
            <button 
              className={`tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Common Fields */}
            <div className="input-row">
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input type="text" name="fullName" placeholder="John Doe" onChange={handleChange} />
                </div>
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>
              <div className="input-group">
                <label>Mobile Number</label>
                <div className="input-wrapper">
                  <Phone size={18} />
                  <input type="text" name="phone" placeholder="9876543210" onChange={handleChange} />
                </div>
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>

            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} />
                <input type="email" name="email" placeholder="john@example.com" onChange={handleChange} />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            {/* DYNAMIC FIELDS BASED ON ROLE */}
            {role === 'patient' && (
              <div className="input-row">
                <div className="input-group">
                  <label>Date of Birth</label>
                  <div className="input-wrapper">
                    <Calendar size={18} />
                    <input type="date" name="dob" onChange={handleChange} />
                  </div>
                  {errors.dob && <span className="error-text">{errors.dob}</span>}
                </div>
                <div className="input-group">
                  <label>Gender</label>
                  <select name="gender" className="custom-select" onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <span className="error-text">{errors.gender}</span>}
                </div>
              </div>
            )}

            {role === 'doctor' && (
              <div className="input-row">
                 <div className="input-group">
                  <label>Medical License No.</label>
                  <div className="input-wrapper">
                    <Stethoscope size={18} />
                    <input type="text" name="medicalLicense" placeholder="MD-12345" onChange={handleChange} />
                  </div>
                  {errors.medicalLicense && <span className="error-text">{errors.medicalLicense}</span>}
                </div>
                <div className="input-group">
                  <label>Specialization</label>
                  <select name="specialization" className="custom-select" onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="cardio">Cardiologist</option>
                    <option value="derma">Dermatologist</option>
                    <option value="gp">General Physician</option>
                  </select>
                  {errors.specialization && <span className="error-text">{errors.specialization}</span>}
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="input-group">
                <label>Hospital ID / Code</label>
                <div className="input-wrapper">
                  <Building size={18} />
                  <input type="text" name="hospitalId" placeholder="HOSP-001" onChange={handleChange} />
                </div>
                {errors.hospitalId && <span className="error-text">{errors.hospitalId}</span>}
              </div>
            )}

            {/* Passwords */}
            <div className="input-row">
              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input type="password" name="password" placeholder="********" onChange={handleChange} />
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input type="password" name="confirmPassword" placeholder="********" onChange={handleChange} />
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Legal Checkboxes */}
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" name="termsAccepted" onChange={handleChange} />
                <span>I agree to the <a href="#">Terms & Conditions</a></span>
              </label>
              {errors.terms && <span className="error-text block">{errors.terms}</span>}
              
              <label className="checkbox-label">
                <input type="checkbox" name="aiDisclaimerAccepted" onChange={handleChange} />
                <span>I understand that AI suggestions are for assistance, not final diagnosis.</span>
              </label>
              {errors.ai && <span className="error-text block">{errors.ai}</span>}
            </div>

            <button type="submit" className="signup-btn" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
              {!isLoading && <ArrowRight size={18} />}
            </button>

            <p className="login-link">
              Already have an account? <a href="/login">Login here</a>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;