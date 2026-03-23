import React, { useState } from 'react';
import { 
  Search, Filter, Star, MapPin, Calendar, 
  Clock, X, Award, ThumbsUp, ChevronRight, 
  Stethoscope, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './DoctorListing.css';

// Mock Data for Doctors
const MOCK_DOCTORS = [
  { 
    id: 1, name: "Dr. Rahul Sharma", spec: "Cardiologist", exp: 12, hospital: "City Heart Center", 
    rating: 4.8, reviews: 124, fee: 800, availability: "Available Today", status: "green",
    about: "Dr. Rahul Sharma is a senior cardiologist with extensive experience in treating coronary artery diseases and heart failures.",
    education: "MBBS, MD - Cardiology (AIIMS)"
  },
  { 
    id: 2, name: "Dr. Sneha Patel", spec: "Dermatologist", exp: 8, hospital: "SkinCare Clinic", 
    rating: 4.9, reviews: 312, fee: 600, availability: "Available Tomorrow", status: "yellow",
    about: "Dr. Sneha specializes in clinical and cosmetic dermatology, helping patients with severe acne, eczema, and skin cancer screenings.",
    education: "MBBS, DDVL"
  },
  { 
    id: 3, name: "Dr. Amit Kumar", spec: "General Physician", exp: 15, hospital: "HealthSphere Main", 
    rating: 4.7, reviews: 450, fee: 500, availability: "Available Today", status: "green",
    about: "A trusted family physician handling everything from seasonal flus to chronic diabetes management.",
    education: "MBBS, MD - General Medicine"
  },
  { 
    id: 4, name: "Dr. Priya Singh", spec: "Pediatrician", exp: 10, hospital: "Kids Care Hospital", 
    rating: 4.9, reviews: 280, fee: 700, availability: "Available Today", status: "green",
    about: "Dr. Priya is exceptionally great with children, specializing in neonatal care and pediatric infectious diseases.",
    education: "MBBS, MD - Pediatrics"
  },
  { 
    id: 5, name: "Dr. Vikram Joshi", spec: "Neurologist", exp: 14, hospital: "Neuro Spine Center", 
    rating: 4.6, reviews: 98, fee: 1000, availability: "Not Available", status: "red",
    about: "Dr. Vikram is a leading neurologist focusing on migraines, epilepsy, and neurodegenerative disorders.",
    education: "MBBS, DM - Neurology"
  },
  { 
    id: 6, name: "Dr. Anjali Desai", spec: "General Physician", exp: 6, hospital: "HealthSphere Clinic", 
    rating: 4.5, reviews: 150, fee: 400, availability: "Available Tomorrow", status: "yellow",
    about: "Dr. Anjali focuses on preventive healthcare, routine checkups, and lifestyle disease management.",
    education: "MBBS"
  },
];

const SPECIALIZATIONS = ["All", "General Physician", "Cardiologist", "Dermatologist", "Neurologist", "Pediatrician"];

const DoctorListing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [selectedAvail, setSelectedAvail] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState(null); // For Modal

  // Filtering Logic
  const filteredDoctors = MOCK_DOCTORS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.hospital.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpec = selectedSpec === "All" || doc.spec === selectedSpec;
    const matchesAvail = selectedAvail === "All" || 
                         (selectedAvail === "Today" && doc.status === "green") ||
                         (selectedAvail === "Tomorrow" && doc.status === "yellow");
    return matchesSearch && matchesSpec && matchesAvail;
  });

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
          <p className="results-count">Showing {filteredDoctors.length} doctors</p>
          
          <div className="doctor-grid">
            {filteredDoctors.map(doc => (
              <div key={doc.id} className="doctor-card">
                
                {/* 6. Availability Indicator */}
                <div className={`avail-badge status-${doc.status}`}>
                  <span className="dot"></span> {doc.availability}
                </div>

                <div className="doc-card-top">
                  <div className="doc-avatar-large">
                    {doc.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </div>
                  <div className="doc-info-main">
                    <h3>{doc.name}</h3>
                    <span className="doc-spec-badge">{doc.spec}</span>
                    <div className="doc-rating-reviews">
                      <div className="rating-box">
                        <Star size={14} className="star-fill" /> {doc.rating}
                      </div>
                      <span className="reviews-text">({doc.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="doc-card-mid">
                  <div className="info-row">
                    <Award size={16} /> <span>{doc.exp} Years Experience</span>
                  </div>
                  <div className="info-row">
                    <MapPin size={16} /> <span>{doc.hospital}</span>
                  </div>
                  <div className="info-row fee">
                    <span>Consultation Fee:</span> <strong>₹{doc.fee}</strong>
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
            ))}
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

          {filteredDoctors.length > 0 && (
            <div className="load-more-container">
              <button className="btn-outline">Load More Doctors</button>
            </div>
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
                {selectedDoctor.name.split(' ').map(n => n[0]).join('').substring(0,2)}
              </div>
              <div className="modal-header-info">
                <h2>{selectedDoctor.name} <ShieldCheck size={20} className="verified-icon" /></h2>
                <p className="modal-spec">{selectedDoctor.spec}</p>
                <p className="modal-edu">{selectedDoctor.education}</p>
                <div className="modal-rating">
                  <Star size={16} className="star-fill" /> 
                  <strong>{selectedDoctor.rating}</strong> 
                  <span>({selectedDoctor.reviews} Patient Reviews)</span>
                </div>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>About Doctor</h3>
                <p>{selectedDoctor.about}</p>
              </div>

              <div className="modal-grid-2">
                <div className="modal-section">
                  <h3><MapPin size={18} /> Clinic Details</h3>
                  <p><strong>{selectedDoctor.hospital}</strong></p>
                  <p className="text-muted">Ahmedabad, Gujarat, India</p>
                </div>
                <div className="modal-section">
                  <h3><Clock size={18} /> Available Timings</h3>
                  <p>Mon - Sat: 10:00 AM - 02:00 PM</p>
                  <p>Evening: 05:00 PM - 08:00 PM</p>
                </div>
              </div>

              {/* 7. Reviews Preview */}
              <div className="modal-section">
                <h3><ThumbsUp size={18} /> Patient Feedback</h3>
                <div className="review-card">
                  <div className="review-stars">
                    <Star size={14} className="star-fill" />
                    <Star size={14} className="star-fill" />
                    <Star size={14} className="star-fill" />
                    <Star size={14} className="star-fill" />
                    <Star size={14} className="star-fill" />
                  </div>
                  <p className="review-text">"Very helpful doctor. Listened to all my symptoms patiently and explained the treatment clearly."</p>
                  <span className="review-author">- Verified Patient</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-fee">
                <span>Consultation Fee</span>
                <strong>₹{selectedDoctor.fee}</strong>
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