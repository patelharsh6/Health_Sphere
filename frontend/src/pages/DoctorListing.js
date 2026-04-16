import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Star, MapPin, Calendar, 
  Clock, X, Award, ThumbsUp, ChevronRight, 
  Stethoscope, ShieldCheck, Loader
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import './DoctorListing.css';

const SPECIALIZATIONS = ["All", "General Physician", "Cardiologist", "Dermatologist", "Neurologist", "Pediatrician"];

const DoctorListing = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [selectedAvail, setSelectedAvail] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpec]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSpec !== 'All') params.specialization = selectedSpec;
      if (searchTerm) params.search = searchTerm;

      const res = await doctorAPI.getAll(params);
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search when pressing Enter or debounced
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      fetchDoctors();
    }
  };

  // Filter locally by search term
  const filteredDoctors = doctors.filter(doc => {
    const name = doc.user?.fullName || '';
    const hospital = doc.hospital || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          hospital.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Helper to get availability status
  const getAvailStatus = (doc) => {
    if (doc.availableSlots && doc.availableSlots.length > 0) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySlot = doc.availableSlots.find(s => s.day === today);
      if (todaySlot) return { text: 'Available Today', status: 'green' };
      
      const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long' });
      const tomorrowSlot = doc.availableSlots.find(s => s.day === tomorrow);
      if (tomorrowSlot) return { text: 'Available Tomorrow', status: 'yellow' };
      
      return { text: 'Check Schedule', status: 'yellow' };
    }
    return { text: 'Not Available', status: 'red' };
  };

  return (
    <div className="doctor-listing-page">
      
      {/* 1. PAGE HEADER */}
      <header className="listing-header">
        <div className="header-content">
          <h1>Find a Doctor</h1>
          <p>Connect with verified healthcare professionals and book your consultation.</p>
        </div>
      </header>

      <div className="listing-layout">
        
        {/* 2. SEARCH & FILTERS */}
        <div className="filter-bar">
          <div className="search-input-box">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by doctor name or clinic..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
          </div>

          <div className="filter-dropdowns">
            <div className="filter-select">
              <Filter size={16} className="filter-icon" />
              <select value={selectedSpec} onChange={(e) => setSelectedSpec(e.target.value)}>
                {SPECIALIZATIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="filter-select">
              <Clock size={16} className="filter-icon" />
              <select value={selectedAvail} onChange={(e) => setSelectedAvail(e.target.value)}>
                <option value="All">Any Availability</option>
                <option value="Today">Available Today</option>
                <option value="Tomorrow">Available Tomorrow</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. DOCTOR CARDS GRID */}
        <div className="doctor-results">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading doctors...</p>
            </div>
          ) : (
            <>
              <p className="results-count">Showing {filteredDoctors.length} doctors</p>
              
              <div className="doctor-grid">
                {filteredDoctors.map(doc => {
                  const avail = getAvailStatus(doc);
                  const name = doc.user?.fullName || 'Doctor';
                  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                  
                  return (
                    <div key={doc._id} className="doctor-card">
                      
                      <div className={`avail-badge status-${avail.status}`}>
                        <span className="dot"></span> {avail.text}
                      </div>

                      <div className="doc-card-top">
                        <div className="doc-avatar-large">{initials}</div>
                        <div className="doc-info-main">
                          <h3>{name}</h3>
                          <span className="doc-spec-badge">{doc.specialization}</span>
                          <div className="doc-rating-reviews">
                            <div className="rating-box">
                              <Star size={14} className="star-fill" /> {doc.rating || 0}
                            </div>
                            <span className="reviews-text">({doc.totalRatings || 0} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="doc-card-mid">
                        <div className="info-row">
                          <Award size={16} /> <span>{doc.experience || 0} Years Experience</span>
                        </div>
                        <div className="info-row">
                          <MapPin size={16} /> <span>{doc.hospital}</span>
                        </div>
                        <div className="info-row fee">
                          <span>Consultation Fee:</span> <strong>₹{doc.consultationFee}</strong>
                        </div>
                      </div>

                      <div className="doc-card-actions">
                        <button className="btn-secondary" onClick={() => setSelectedDoctor(doc)}>
                          View Profile
                        </button>
                        <Link to="/appointments" className="btn-primary-link">
                          Book Appointment
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDoctors.length === 0 && (
                <div className="no-results">
                  <Stethoscope size={48} className="text-muted" />
                  <h3>No doctors found</h3>
                  <p>Try adjusting your search or filters to find what you're looking for.</p>
                  <button className="btn-outline mt-3" onClick={() => {setSearchTerm(""); setSelectedSpec("All"); setSelectedAvail("All");}}>
                    Clear Filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* 4. DOCTOR DETAILS MODAL */}
      {selectedDoctor && (
        <div className="doctor-modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="doctor-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDoctor(null)}>
              <X size={24} />
            </button>

            <div className="modal-header-profile">
              <div className="doc-avatar-huge">
                {(selectedDoctor.user?.fullName || 'D').split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="modal-header-info">
                <h2>{selectedDoctor.user?.fullName} <ShieldCheck size={20} className="verified-icon" /></h2>
                <p className="modal-spec">{selectedDoctor.specialization}</p>
                <p className="modal-edu">{selectedDoctor.bio || `Experienced ${selectedDoctor.specialization}`}</p>
                <div className="modal-rating">
                  <Star size={16} className="star-fill" /> 
                  <strong>{selectedDoctor.rating || 0}</strong> 
                  <span>({selectedDoctor.totalRatings || 0} Patient Reviews)</span>
                </div>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>About Doctor</h3>
                <p>{selectedDoctor.bio || `${selectedDoctor.user?.fullName} is an experienced ${selectedDoctor.specialization} with ${selectedDoctor.experience} years of practice.`}</p>
              </div>

              <div className="modal-grid-2">
                <div className="modal-section">
                  <h3><MapPin size={18} /> Clinic Details</h3>
                  <p><strong>{selectedDoctor.hospital}</strong></p>
                </div>
                <div className="modal-section">
                  <h3><Clock size={18} /> Available Days</h3>
                  <p>{selectedDoctor.availableSlots?.map(s => s.day).join(', ') || 'Contact for availability'}</p>
                </div>
              </div>

              <div className="modal-section">
                <h3><ThumbsUp size={18} /> Patient Feedback</h3>
                <div className="review-card">
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="star-fill" />
                    ))}
                  </div>
                  <p className="review-text">"Very helpful doctor. Listened to all my symptoms patiently and explained the treatment clearly."</p>
                  <span className="review-author">- Verified Patient</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-fee">
                <span>Consultation Fee</span>
                <strong>₹{selectedDoctor.consultationFee}</strong>
              </div>
              <Link to="/appointments" className="btn-primary-link large">
                Book Appointment <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorListing;