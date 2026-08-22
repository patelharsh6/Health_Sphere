import React, { useState, useEffect } from 'react';
import {
  Search, Heart, Brain, Bone, Eye, Stethoscope,
  Activity, ArrowRight, Filter, Loader, AlertCircle,
  ChevronRight, Shield, Pill
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../services/api';
import './DiseaseListing.css';


const getCategoryIcon = (category) => {
  switch (category) {
    case 'Cardiovascular': return <Heart size={16} />;
    case 'Neurological': return <Brain size={16} />;
    case 'Musculoskeletal': return <Bone size={16} />;
    case 'Respiratory': return <Activity size={16} />;
    case 'Mental Health': return <Brain size={16} />;
    default: return <Stethoscope size={16} />;
  }
};

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'mild': return '#22c55e';
    case 'moderate': return '#eab308';
    case 'severe': return '#ef4444';
    case 'chronic': return '#8b5cf6';
    default: return '#64748b';
  }
};

const DiseaseListing = () => {
  const [diseases, setDiseases] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchDiseases();
    fetchCategories();
  }, []);

  const fetchDiseases = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await aiAPI.getAllDiseases();
      setDiseases(res.data.success ? res.data.data || [] : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not load the medical database. Please check your connection and try again.'
      );
      setDiseases([]);
    } finally {
      setLoading(false);
    }
  };

  // Chips are driven by what is actually in the database, so they can never
  // drift from the Disease.category enum.
  const fetchCategories = async () => {
    try {
      const res = await aiAPI.getDiseaseCategories();
      if (res.data.success && res.data.data?.length) {
        setCategories(['All', ...res.data.data.sort()]);
      }
    } catch {
      // Non-fatal: the list still renders, just without category filtering.
    }
  };

  const filteredDiseases = diseases.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'All' || d.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="disease-listing-page">
      {/* HERO */}
      <header className="dl-hero">
        <div className="dl-hero-content">
          <div className="dl-hero-badge">
            <Shield size={14} /> Medical Encyclopedia
          </div>
          <h1>Explore Diseases & Conditions</h1>
          <p>Comprehensive information on symptoms, treatments, and prevention for over 100+ conditions.</p>

          {/* Search */}
          <div className="dl-search-bar">
            <Search size={20} className="dl-search-icon" />
            <input
              type="text"
              placeholder="Search diseases, symptoms, conditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* CATEGORY FILTER */}
      <section className="dl-categories">
        <div className="dl-container">
          <div className="dl-cat-scroll">
            {categories.map(cat => (
              <button
                key={cat}
                className={`dl-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat !== 'All' && getCategoryIcon(cat)}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="dl-results">
        <div className="dl-container">
          <div className="dl-results-header">
            <h2>{filteredDiseases.length} Conditions Found</h2>
            <span className="dl-results-sub">
              {activeCategory !== 'All' ? `Filtered by: ${activeCategory}` : 'Showing all categories'}
            </span>
          </div>

          {loading ? (
            <div className="dl-loading">
              <Loader size={40} className="spinning" />
              <p>Loading medical database...</p>
            </div>
          ) : error ? (
            <div className="dl-empty">
              <AlertCircle size={48} />
              <h3>Unable to load conditions</h3>
              <p>{error}</p>
              <button className="dl-retry-btn" onClick={fetchDiseases}>Try again</button>
            </div>
          ) : filteredDiseases.length === 0 ? (
            <div className="dl-empty">
              <AlertCircle size={48} />
              <h3>No conditions found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="dl-grid">
              {filteredDiseases.map(disease => (
                <Link
                  to={`/diseases/${disease.slug}`}
                  key={disease._id}
                  className="dl-card"
                >
                  <div className="dl-card-top">
                    <div className="dl-card-cat">
                      {getCategoryIcon(disease.category)}
                      <span>{disease.category}</span>
                    </div>
                    <span
                      className="dl-severity"
                      style={{ color: getSeverityColor(disease.severity), background: `${getSeverityColor(disease.severity)}15` }}
                    >
                      {disease.severity}
                    </span>
                  </div>

                  <h3 className="dl-card-title">{disease.name}</h3>
                  <p className="dl-card-desc">
                    {disease.description?.substring(0, 100)}...
                  </p>

                  {disease.symptoms && (
                    <div className="dl-symptoms-preview">
                      {disease.symptoms.slice(0, 3).map((s, i) => (
                        <span key={i} className="dl-symptom-chip">{s}</span>
                      ))}
                      {disease.symptoms.length > 3 && (
                        <span className="dl-symptom-more">+{disease.symptoms.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="dl-card-cta">
                    Learn More <ChevronRight size={16} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AI CTA */}
      <section className="dl-ai-cta">
        <div className="dl-container">
          <div className="dl-ai-box">
            <div className="dl-ai-text">
              <h3>Not sure what you have?</h3>
              <p>Use our AI-powered Symptom Checker to get preliminary insights.</p>
            </div>
            <Link to="/symptoms" className="dl-ai-btn">
              Check Symptoms <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DiseaseListing;
