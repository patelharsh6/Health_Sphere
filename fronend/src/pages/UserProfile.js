import React, { useState } from 'react';
import { 
  User, Mail, Phone, Calendar, Edit2, Save, 
  X, Droplet, Activity, AlertCircle, Shield, 
  Heart, Bell, Lock, LogOut, Camera, MapPin, 
  CheckCircle, ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Mock User Data
  const [userData, setUserData] = useState({
    firstName: 'Harsh',
    lastName: 'Patel',
    email: 'harsh.patel@example.com',
    phone: '+91 98765 43210',
    dob: '1999-08-08',
    gender: 'Male',
    location: 'Ahmedabad, Gujarat',
    
    // Health Info
    bloodGroup: 'O+',
    height: '175', // cm
    weight: '70', // kg
    allergies: 'None',
    conditions: 'Mild Asthma',
    
    // Emergency Contact
    emName: 'Amit Patel',
    emRelation: 'Brother',
    emPhone: '+91 98765 00000'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API Call
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

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

      <div className="profile-layout">
        
        {/* LEFT COLUMN: OVERVIEW CARD */}
        <aside className="profile-sidebar">
          
          {/* 2. PROFILE OVERVIEW */}
          <div className="profile-card main-profile-card">
            <div className="avatar-wrapper">
              <div className="avatar-huge">
                {userData.firstName[0]}{userData.lastName[0]}
              </div>
              {isEditing && (
                <button className="avatar-edit-btn">
                  <Camera size={16} />
                </button>
              )}
            </div>
            
            <h2 className="profile-name">{userData.firstName} {userData.lastName}</h2>
            <p className="profile-id">Patient ID: HS-9821</p>

            <div className="contact-info-list">
              <div className="info-item">
                <Mail size={16} /> <span>{userData.email}</span>
              </div>
              <div className="info-item">
                <Phone size={16} /> <span>{userData.phone}</span>
              </div>
              <div className="info-item">
                <MapPin size={16} /> <span>{userData.location}</span>
              </div>
            </div>
          </div>

          {/* 5. EMERGENCY CONTACT */}
          <div className="profile-card">
            <div className="card-header">
              <Shield size={18} className="text-red" />
              <h3>Emergency Contact</h3>
            </div>
            {!isEditing ? (
              <div className="read-only-data">
                <p><strong>{userData.emName}</strong> ({userData.emRelation})</p>
                <p className="text-muted"><Phone size={14} className="inline-icon"/> {userData.emPhone}</p>
              </div>
            ) : (
              <div className="edit-form-small">
                <input type="text" name="emName" value={userData.emName} onChange={handleChange} placeholder="Name" />
                <input type="text" name="emRelation" value={userData.emRelation} onChange={handleChange} placeholder="Relationship" />
                <input type="text" name="emPhone" value={userData.emPhone} onChange={handleChange} placeholder="Phone Number" />
              </div>
            )}
          </div>

        </aside>

        {/* RIGHT COLUMN: DETAILS & SETTINGS */}
        <main className="profile-main">
          
          {/* 3 & 4. PERSONAL & HEALTH INFO FORM / VIEW */}
          <div className="profile-card detailed-card">
            
            {isEditing ? (
              /* EDIT MODE */
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
                      <label>Date of Birth</label>
                      <input type="date" name="dob" value={userData.dob} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                      <label>Gender</label>
                      <select name="gender" value={userData.gender} onChange={handleChange}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="input-group full-width">
                      <label>Location / Address</label>
                      <input type="text" name="location" value={userData.location} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="form-section mt-4">
                  <h3><Heart size={18} /> Medical Profile</h3>
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Blood Group</label>
                      <select name="bloodGroup" value={userData.bloodGroup} onChange={handleChange}>
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
                      <label>Allergies</label>
                      <input type="text" name="allergies" value={userData.allergies} onChange={handleChange} placeholder="e.g. Peanuts, Penicillin" />
                    </div>
                    <div className="input-group full-width">
                      <label>Chronic Conditions</label>
                      <input type="text" name="conditions" value={userData.conditions} onChange={handleChange} placeholder="e.g. Diabetes, Hypertension" />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-outline" onClick={() => setIsEditing(false)}>
                    <X size={18} /> Cancel
                  </button>
                  <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : <><Save size={18} /> Save Changes</>}
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <div className="view-mode-container">
                
                <div className="data-section">
                  <div className="section-header-row">
                    <h3><User size={18} /> Basic Information</h3>
                  </div>
                  <div className="data-grid">
                    <div className="data-item">
                      <span className="data-label">Date of Birth</span>
                      <strong className="data-value">{userData.dob}</strong>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Gender</span>
                      <strong className="data-value">{userData.gender}</strong>
                    </div>
                  </div>
                </div>

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
                        <strong>{userData.bloodGroup}</strong>
                      </div>
                    </div>
                    <div className="metric-box bg-blue-light">
                      <Activity size={20} className="text-blue" />
                      <div className="metric-info">
                        <span>Height</span>
                        <strong>{userData.height} cm</strong>
                      </div>
                    </div>
                    <div className="metric-box bg-green-light">
                      <Heart size={20} className="text-green" />
                      <div className="metric-info">
                        <span>Weight</span>
                        <strong>{userData.weight} kg</strong>
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

              </div>
            )}
          </div>

          {/* 6. ACCOUNT SETTINGS */}
          {!isEditing && (
            <div className="profile-card">
              <h3>Account Settings</h3>
              <div className="settings-list">
                <button className="setting-btn">
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

          {/* 7. PRIVACY & SECURITY */}
          {!isEditing && (
            <div className="profile-card security-card">
              <h3>Privacy & Security</h3>
              <p className="privacy-text">
                Your medical data is encrypted and strictly private. HealthSphere complies with standard healthcare data protection regulations.
              </p>
              <div className="danger-zone">
                <button className="btn-text-danger">
                  <LogOut size={16} /> Logout from all devices
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default UserProfile;