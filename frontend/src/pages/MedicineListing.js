import React, { useState, useEffect } from 'react';
import {
  Search, Pill, AlertTriangle, ArrowRight,
  ChevronRight, Shield, Clock, Activity, Filter, Loader
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { medicineAPI } from '../services/api';
import './MedicineListing.css';

const getCategoryColor = (cat) => {
  const map = {
    'Pain Relief': '#ef4444',
    'Antibiotic': '#f59e0b',
    'Diabetes': '#8b5cf6',
    'Cardiovascular': '#ec4899',
    'Gastrointestinal': '#22c55e',
    'Allergy': '#06b6d4',
    'Thyroid': '#f97316',
    'Respiratory': '#3b82f6',
    'Supplement': '#10b981',
  };
  return map[cat] || '#64748b';
};

const MedicineListing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showPrescription, setShowPrescription] = useState('all'); // all | otc | prescription
  
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await medicineAPI.getCategories();
        if (res.data.success) {
          setCategories(['All', ...res.data.data]);
        }
      } catch (err) {
        console.error('Error fetching categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      try {
        const res = await medicineAPI.getAll({
          search: debouncedSearch || undefined,
          category: activeCategory,
          prescriptionRequired: showPrescription,
          limit: 50 // Fetch enough for the listing
        });
        if (res.data.success) {
          setMedicines(res.data.data);
        }
      } catch (err) {
        setError('Failed to fetch medicines.');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, [debouncedSearch, activeCategory, showPrescription]);

  return (
    <div className="medicine-listing-page">
      {/* HERO */}
      <header className="ml-hero">
        <div className="ml-hero-content">
          <div className="ml-hero-badge">
            <Pill size={14} /> Medicine Database
          </div>
          <h1>Medicine Information Center</h1>
          <p>Detailed information on dosage, side effects, interactions, and uses for common medications.</p>

          <div className="ml-search-bar">
            <Search size={20} className="ml-search-icon" />
            <input
              type="text"
              placeholder="Search medicines, drugs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* DISCLAIMER */}
      <section className="ml-disclaimer">
        <div className="ml-container">
          <div className="ml-disclaimer-box">
            <AlertTriangle size={18} />
            <p><strong>Medical Disclaimer:</strong> This information is for educational purposes only. Always consult a qualified healthcare professional before taking any medication.</p>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="ml-filters">
        <div className="ml-container">
          <div className="ml-filter-row">
            <div className="ml-cat-scroll">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`ml-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="ml-type-filter">
              <button
                className={`ml-type-btn ${showPrescription === 'all' ? 'active' : ''}`}
                onClick={() => setShowPrescription('all')}
              >
                All
              </button>
              <button
                className={`ml-type-btn ${showPrescription === 'otc' ? 'active' : ''}`}
                onClick={() => setShowPrescription('otc')}
              >
                OTC
              </button>
              <button
                className={`ml-type-btn ${showPrescription === 'prescription' ? 'active' : ''}`}
                onClick={() => setShowPrescription('prescription')}
              >
                Rx Only
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="ml-results">
        <div className="ml-container">
          <div className="ml-results-header">
            <h2>{loading ? 'Loading...' : `${medicines.length} Medicines`}</h2>
          </div>

          {loading ? (
             <div className="ml-empty">
               <Loader size={48} className="spin-icon" style={{ opacity: 0.5, animation: 'spin 2s linear infinite' }} />
               <h3>Fetching Medicines</h3>
               <p>Please wait while we load the database.</p>
             </div>
          ) : error ? (
            <div className="ml-empty">
              <AlertTriangle size={48} style={{ opacity: 0.5, color: '#ef4444' }} />
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="ml-empty">
              <Pill size={48} style={{ opacity: 0.2 }} />
              <h3>No medicines found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="ml-grid">
              {medicines.map(med => (
                <Link
                  to={`/medicines/${med.slug}`}
                  key={med._id}
                  className="ml-card"
                >
                  <div className="ml-card-header">
                    <div className="ml-pill-icon" style={{ background: `${getCategoryColor(med.category)}15`, color: getCategoryColor(med.category) }}>
                      <Pill size={22} />
                    </div>
                    <div className="ml-card-badges">
                      <span className="ml-med-type">{med.type}</span>
                      {med.prescriptionRequired ? (
                        <span className="ml-rx-badge rx">Rx</span>
                      ) : (
                        <span className="ml-rx-badge otc">OTC</span>
                      )}
                    </div>
                  </div>

                  <h3 className="ml-card-name">{med.name}</h3>
                  <p className="ml-card-cat" style={{ color: getCategoryColor(med.category) }}>
                    {med.category}
                  </p>
                  <p className="ml-card-desc">{med.description?.substring(0, 90)}...</p>

                  <div className="ml-uses">
                    {med.uses?.slice(0, 3).map((u, i) => (
                      <span key={i} className="ml-use-chip">{u}</span>
                    ))}
                  </div>

                  <div className="ml-card-footer">
                    View Details <ChevronRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="ml-cta">
        <div className="ml-container">
          <div className="ml-cta-box">
            <div className="ml-cta-text">
              <h3>Need help with symptoms?</h3>
              <p>Our AI assistant can guide you to the right information.</p>
            </div>
            <Link to="/ai-assistant" className="ml-cta-btn">
              Talk to AI <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MedicineListing;
