import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, Calendar, Edit2, Save,
  X, Droplet, Activity, AlertCircle, Shield,
  Heart, Bell, Lock, LogOut, Camera, MapPin,
  CheckCircle, ChevronLeft, Loader, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientAPI, doctorAPI, assetUrl } from '../services/api';
import './UserProfile.css';

const UserProfile = () => {
  const {
    user, profile, isAuthenticated, loading: authLoading,
    logout, refreshProfile, changePassword, uploadAvatar, isVerified,
  } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Avatar ──
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // ── Change password ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    location: '',
    bloodGroup: '',
    height: '',
    weight: '',
    allergies: '',
    conditions: '',
    emName: '',
    emRelation: '',
    emPhone: '',
    specialization: '',
    experience: '',
    hospital: '',
    consultationFee: '',
    bio: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfileData();
  }, [isAuthenticated, authLoading, user, profile]);

  const loadProfileData = () => {
    if (user && profile) {
      const names = (user.fullName || '').split(' ');
      setUserData({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        gender: profile.gender || '',
        location: '',
        bloodGroup: profile.bloodGroup || '',
        height: profile.height || '',
        weight: profile.weight || '',
        allergies: (profile.allergies || []).join(', '),
        conditions: (profile.chronicConditions || []).join(', '),
        emName: profile.emergencyContact?.name || '',
        emRelation: profile.emergencyContact?.relation || '',
        emPhone: profile.emergencyContact?.phone || '',
        specialization: profile.specialization || '',
        experience: profile.experience || '',
        hospital: profile.hospital || '',
        consultationFee: profile.consultationFee || '',
        bio: profile.bio || ''
      });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let res;
      if (user.role === 'doctor') {
        const payload = {
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          phone: userData.phone,
          specialization: userData.specialization,
          experience: userData.experience ? Number(userData.experience) : null,
          hospital: userData.hospital,
          consultationFee: userData.consultationFee ? Number(userData.consultationFee) : null,
          bio: userData.bio
        };
        res = await doctorAPI.updateProfile(payload);
      } else {
        const payload = {
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          phone: userData.phone,
          dateOfBirth: userData.dob,
          gender: userData.gender,
          bloodGroup: userData.bloodGroup,
          height: userData.height ? Number(userData.height) : null,
          weight: userData.weight ? Number(userData.weight) : null,
          allergies: userData.allergies ? userData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          chronicConditions: userData.conditions ? userData.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
          emergencyContact: {
            name: userData.emName,
            relation: userData.emRelation,
            phone: userData.emPhone,
          }
        };
        res = await patientAPI.updateProfile(payload);
      }

      if (res.data.success) {
        setIsEditing(false);
        setSaveSuccess(true);
        await refreshProfile();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // ──────────────────────────────────────────────
  // AVATAR
  // ──────────────────────────────────────────────

  const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file after a failed attempt.
    e.target.value = '';
    if (!file) return;

    setAvatarError('');

    // Check client-side too so an obviously wrong file never costs a round trip.
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image is too large. Maximum size is 2 MB.');
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setAvatarError(error.response?.data?.message || 'Failed to upload the image.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // ──────────────────────────────────────────────
  // CHANGE PASSWORD
  // ──────────────────────────────────────────────

  // Same rule the server enforces, so the form fails fast with the same message.
  const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const openPasswordModal = () => {
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwErrors({});
    setShowPw(false);
    setShowPasswordModal(true);
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
    if (pwErrors[name] || pwErrors.form) {
      setPwErrors((prev) => ({ ...prev, [name]: '', form: '' }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = 'Enter your current password.';
    if (!STRONG_PASSWORD.test(pwForm.newPassword)) {
      errors.newPassword = 'Min 8 chars: 1 Upper, 1 Lower, 1 Number, 1 Special';
    }
    if (pwForm.newPassword && pwForm.newPassword === pwForm.currentPassword) {
      errors.newPassword = 'The new password must be different from the current one.';
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (Object.keys(errors).length) {
      setPwErrors(errors);
      return;
    }

    setPwSaving(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setShowPasswordModal(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const data = error.response?.data;
      setPwErrors(
        data?.errors
          ? data.errors
          : { form: data?.message || 'Failed to change the password.' }
      );
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* 1. HEADER SECTION */}
      <header className="profile-header">
        <div className="header-container">
          <Link to="/dashboard" className="back-link">
            <ChevronLeft size={20} /> Back to Dashboard
          </Link>
          <div className="header-titles flex-between">
            <div>
              <h1>My Profile</h1>
              <p>Manage your personal and health information.</p>
            </div>
            {!isEditing && (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                <Edit2 size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SUCCESS MESSAGE */}
      {saveSuccess && (
        <div className="toast-success">
          <CheckCircle size={20} />
          Profile updated successfully!
        </div>
      )}

      {/* A doctor stays hidden from patient-facing doctor lists until an
          administrator verifies their medical license. */}
      {user?.role === 'doctor' && !isVerified && (
        <div className="verify-banner-wrap">
          <div className="verify-banner">
            <AlertCircle size={20} />
            <div>
              <strong>Verification pending</strong>
              <p>
                An administrator is reviewing your medical license. Until it is approved your
                profile will not appear in patient searches and you cannot receive bookings.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="profile-layout">

        {/* LEFT COLUMN: OVERVIEW CARD */}
        <aside className="profile-sidebar">

          <div className="profile-card main-profile-card">
            <div className="avatar-wrapper">
              {user?.avatar ? (
                <img src={assetUrl(user.avatar)} alt="Profile" className="avatar-huge avatar-image" />
              ) : (
                <div className="avatar-huge">
                  {userData.firstName[0]}{userData.lastName[0]}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <button
                className="avatar-edit-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                title={user?.avatar ? 'Change photo' : 'Upload photo'}
              >
                {avatarUploading
                  ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Camera size={16} />}
              </button>
            </div>

            {avatarError && <p className="avatar-error">{avatarError}</p>}

            <h2 className="profile-name">{userData.firstName} {userData.lastName}</h2>
            <p className="profile-id">{user?.role === 'doctor' ? 'Doctor' : 'Patient'} ID: {user?.id?.slice(-6).toUpperCase() || 'N/A'}</p>

            <div className="contact-info-list">
              <div className="info-item">
                <Mail size={16} /> <span>{userData.email}</span>
              </div>
              <div className="info-item">
                <Phone size={16} /> <span>{userData.phone || 'Not set'}</span>
              </div>
            </div>
          </div>

          {/* EMERGENCY CONTACT (Only for patient) */}
          {user?.role !== 'doctor' && (
            <div className="profile-card">
              <div className="card-header">
                <Shield size={18} className="text-red" />
                <h3>Emergency Contact</h3>
              </div>
              {!isEditing ? (
                <div className="read-only-data">
                  <p><strong>{userData.emName || 'Not set'}</strong> {userData.emRelation && `(${userData.emRelation})`}</p>
                  <p className="text-muted"><Phone size={14} className="inline-icon" /> {userData.emPhone || 'Not set'}</p>
                </div>
              ) : (
                <div className="edit-form-small">
                  <input type="text" name="emName" value={userData.emName} onChange={handleChange} placeholder="Name" />
                  <input type="text" name="emRelation" value={userData.emRelation} onChange={handleChange} placeholder="Relationship" />
                  <input type="text" name="emPhone" value={userData.emPhone} onChange={handleChange} placeholder="Phone Number" />
                </div>
              )}
            </div>
          )}

        </aside>

        {/* RIGHT COLUMN: DETAILS & SETTINGS */}
        <main className="profile-main">

          <div className="profile-card detailed-card">

            {isEditing ? (
              <div className="edit-mode-container">
                <div className="form-section">
                  <h3><User size={18} /> Basic Information</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>First Name</label>
                      <input type="text" name="firstName" value={userData.firstName} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Last Name</label>
                      <input type="text" name="lastName" value={userData.lastName} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Phone Number</label>
                      <input type="text" name="phone" value={userData.phone} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {user.role === 'doctor' ? (
                  <div className="form-section mt-4">
                    <h3><Activity size={18} /> Professional Details</h3>
                    <div className="form-grid">
                      <div className="input-group">
                        <label>Specialization</label>
                        <input type="text" name="specialization" value={userData.specialization} onChange={handleChange} />
                      </div>
                      <div className="input-group">
                        <label>Experience (Years)</label>
                        <input type="number" name="experience" value={userData.experience} onChange={handleChange} />
                      </div>
                      <div className="input-group full-width">
                        <label>Hospital/Clinic</label>
                        <input type="text" name="hospital" value={userData.hospital} onChange={handleChange} />
                      </div>
                      <div className="input-group">
                        <label>Consultation Fee (₹)</label>
                        <input type="number" name="consultationFee" value={userData.consultationFee} onChange={handleChange} />
                      </div>
                      <div className="input-group full-width">
                        <label>Bio</label>
                        <textarea name="bio" value={userData.bio} onChange={handleChange} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #e2e8f0'}} rows="3"></textarea>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="input-group">
                      <label>Date of Birth</label>
                      <input type="date" name="dob" value={userData.dob} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Gender</label>
                      <select name="gender" value={userData.gender} onChange={handleChange}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="form-section mt-4" style={{gridColumn: '1 / -1'}}>
                      <h3><Heart size={18} /> Medical Profile</h3>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>Blood Group</label>
                          <select name="bloodGroup" value={userData.bloodGroup} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Height (cm)</label>
                          <input type="number" name="height" value={userData.height} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                          <label>Weight (kg)</label>
                          <input type="number" name="weight" value={userData.weight} onChange={handleChange} />
                        </div>
                        <div className="input-group full-width">
                          <label>Allergies (comma separated)</label>
                          <input type="text" name="allergies" value={userData.allergies} onChange={handleChange} placeholder="e.g. Peanuts, Penicillin" />
                        </div>
                        <div className="input-group full-width">
                          <label>Chronic Conditions (comma separated)</label>
                          <input type="text" name="conditions" value={userData.conditions} onChange={handleChange} placeholder="e.g. Diabetes, Hypertension" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button className="btn-outline" onClick={() => { setIsEditing(false); loadProfileData(); }}>
                    <X size={18} /> Cancel
                  </button>
                  <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-mode-container">

                <div className="data-section">
                  <div className="section-header-row">
                    <h3><User size={18} /> Basic Information</h3>
                  </div>
                  <div className="data-grid">
                    <div className="data-item">
                      <span className="data-label">Date of Birth</span>
                      <strong className="data-value">{userData.dob || 'Not set'}</strong>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Gender</span>
                      <strong className="data-value">{userData.gender || 'Not set'}</strong>
                    </div>
                  </div>
                </div>

                {user.role === 'doctor' ? (
                  <div className="data-section mt-4">
                    <div className="section-header-row">
                      <h3><Activity size={18} /> Professional Details</h3>
                    </div>
                    <div className="data-grid mt-3">
                      <div className="data-item">
                        <span className="data-label">Specialization</span>
                        <strong className="data-value">{userData.specialization || 'Not set'}</strong>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Experience</span>
                        <strong className="data-value">{userData.experience ? `${userData.experience} Years` : 'Not set'}</strong>
                      </div>
                      <div className="data-item">
                        <span className="data-label">Consultation Fee</span>
                        <strong className="data-value">{userData.consultationFee ? `₹${userData.consultationFee}` : 'Not set'}</strong>
                      </div>
                      <div className="data-item full-width">
                        <span className="data-label">Hospital/Clinic</span>
                        <strong className="data-value">{userData.hospital || 'Not set'}</strong>
                      </div>
                      <div className="data-item full-width">
                        <span className="data-label">Bio</span>
                        <strong className="data-value" style={{fontWeight: 400, color: '#333'}}>{userData.bio || 'No bio available'}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="data-section mt-4">
                    <div className="section-header-row">
                      <h3><Activity size={18} /> Medical Profile</h3>
                    </div>
                    <p className="health-note">This data is used to personalize your AI Assistant insights and report analysis.</p>

                    <div className="health-metrics-row">
                      <div className="metric-box bg-red-light">
                        <Droplet size={20} className="text-red" />
                        <div className="metric-info">
                          <span>Blood Group</span>
                          <strong>{userData.bloodGroup || 'Not set'}</strong>
                        </div>
                      </div>
                      <div className="metric-box bg-blue-light">
                        <Activity size={20} className="text-blue" />
                        <div className="metric-info">
                          <span>Height</span>
                          <strong>{userData.height ? `${userData.height} cm` : 'Not set'}</strong>
                        </div>
                      </div>
                      <div className="metric-box bg-green-light">
                        <Heart size={20} className="text-green" />
                        <div className="metric-info">
                          <span>Weight</span>
                          <strong>{userData.weight ? `${userData.weight} kg` : 'Not set'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="data-grid mt-3">
                      <div className="data-item full-width">
                        <span className="data-label">Known Allergies</span>
                        <strong className="data-value">{userData.allergies || 'None reported'}</strong>
                      </div>
                      <div className="data-item full-width">
                        <span className="data-label">Existing Conditions</span>
                        <strong className="data-value">{userData.conditions || 'None reported'}</strong>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* ACCOUNT SETTINGS */}
          {!isEditing && (
            <div className="profile-card">
              <h3>Account Settings</h3>
              <div className="settings-list">
                <button className="setting-btn" onClick={openPasswordModal}>
                  <div className="setting-info">
                    <Lock size={18} className="text-muted" />
                    <span>Change Password</span>
                  </div>
                  <ChevronLeft size={16} className="rotate-180 text-muted" />
                </button>
                <button className="setting-btn">
                  <div className="setting-info">
                    <Bell size={18} className="text-muted" />
                    <span>Notification Preferences</span>
                  </div>
                  <ChevronLeft size={16} className="rotate-180 text-muted" />
                </button>
              </div>
            </div>
          )}

          {/* PRIVACY & SECURITY */}
          {!isEditing && (
            <div className="profile-card security-card">
              <h3>Privacy & Security</h3>
              <p className="privacy-text">
                Your medical data is encrypted and strictly private. HealthSphere complies with standard healthcare data protection regulations.
              </p>
              <div className="danger-zone">
                <button className="btn-text-danger" onClick={handleLogout}>
                  <LogOut size={16} /> Logout from all devices
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="pw-modal-overlay" onClick={() => !pwSaving && setShowPasswordModal(false)}>
          <div className="pw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><KeyRound size={20} /> Change Password</h2>
              <button
                className="close-btn"
                onClick={() => setShowPasswordModal(false)}
                disabled={pwSaving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="pw-form">
              {pwErrors.form && (
                <div className="pw-form-error">
                  <AlertCircle size={16} /> {pwErrors.form}
                </div>
              )}

              <div className="input-group">
                <label>Current Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="currentPassword"
                  value={pwForm.currentPassword}
                  onChange={handlePwChange}
                  autoComplete="current-password"
                />
                {pwErrors.currentPassword && <span className="pw-error">{pwErrors.currentPassword}</span>}
              </div>

              <div className="input-group">
                <label>New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="newPassword"
                  value={pwForm.newPassword}
                  onChange={handlePwChange}
                  autoComplete="new-password"
                />
                {pwErrors.newPassword && <span className="pw-error">{pwErrors.newPassword}</span>}
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="confirmPassword"
                  value={pwForm.confirmPassword}
                  onChange={handlePwChange}
                  autoComplete="new-password"
                />
                {pwErrors.confirmPassword && <span className="pw-error">{pwErrors.confirmPassword}</span>}
              </div>

              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPw ? 'Hide passwords' : 'Show passwords'}
              </button>

              <p className="pw-hint">
                Must be at least 8 characters with an uppercase letter, a lowercase letter,
                a number, and a special character.
              </p>

              <div className="pw-actions">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={pwSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={pwSaving}>
                  {pwSaving
                    ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</>
                    : <><Save size={16} /> Update Password</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;