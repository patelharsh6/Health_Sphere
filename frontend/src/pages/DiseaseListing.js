import React, { useState, useEffect } from 'react';
import {
  Search, Heart, Brain, Bone, Eye, Stethoscope,
  Activity, ArrowRight, Filter, Loader, AlertCircle,
  ChevronRight, Shield, Pill
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../services/api';
import './DiseaseListing.css';

// Fallback disease data when API is not available
const fallbackDiseases = [
  { _id: '1', name: 'Diabetes', slug: 'diabetes', category: 'Endocrine', severity: 'Chronic', description: 'A metabolic disease that causes high blood sugar levels over a prolonged period.', symptoms: ['Increased thirst', 'Frequent urination', 'Extreme hunger', 'Fatigue'] },
  { _id: '2', name: 'Hypertension', slug: 'hypertension', category: 'Cardiovascular', severity: 'Chronic', description: 'Long-term force of blood against artery walls, potentially causing health issues.', symptoms: ['Headaches', 'Shortness of breath', 'Nosebleeds', 'Dizziness'] },
  { _id: '3', name: 'Asthma', slug: 'asthma', category: 'Respiratory', severity: 'Chronic', description: 'A condition where airways narrow and swell, producing extra mucus.', symptoms: ['Shortness of breath', 'Chest tightness', 'Wheezing', 'Coughing'] },
  { _id: '4', name: 'Migraine', slug: 'migraine', category: 'Neurological', severity: 'Moderate', description: 'A type of headache with intense, debilitating pain often accompanied by nausea.', symptoms: ['Throbbing headache', 'Nausea', 'Light sensitivity', 'Aura'] },
  { _id: '5', name: 'Arthritis', slug: 'arthritis', category: 'Musculoskeletal', severity: 'Chronic', description: 'Swelling and tenderness of joints, common with aging but treatable.', symptoms: ['Joint pain', 'Stiffness', 'Swelling', 'Decreased range of motion'] },
  { _id: '6', name: 'COVID-19', slug: 'covid-19', category: 'Infectious', severity: 'Variable', description: 'Infectious disease caused by the SARS-CoV-2 virus affecting respiratory system.', symptoms: ['Fever', 'Dry cough', 'Fatigue', 'Loss of taste or smell'] },
  { _id: '7', name: 'Depression', slug: 'depression', category: 'Mental Health', severity: 'Moderate', description: 'A mood disorder causing persistent feelings of sadness and loss of interest.', symptoms: ['Persistent sadness', 'Loss of interest', 'Fatigue', 'Difficulty concentrating'] },
  { _id: '8', name: 'Anemia', slug: 'anemia', category: 'Hematological', severity: 'Mild', description: 'A condition where blood lacks adequate healthy red blood cells.', symptoms: ['Fatigue', 'Weakness', 'Pale skin', 'Shortness of breath'] },
  { _id: '9', name: 'Pneumonia', slug: 'pneumonia', category: 'Respiratory', severity: 'Severe', description: 'An infection that inflames air sacs in one or both lungs, filling with fluid.', symptoms: ['Chest pain', 'Cough', 'Fever', 'Difficulty breathing'] },
  { _id: '10', name: 'Alzheimer\'s Disease', slug: 'alzheimers', category: 'Neurological', severity: 'Severe', description: 'A progressive neurological disorder causing brain cells to degenerate.', symptoms: ['Memory loss', 'Confusion', 'Difficulty with routine tasks', 'Mood changes'] },
  { _id: '11', name: 'Kidney Stones', slug: 'kidney-stones', category: 'Urological', severity: 'Moderate', description: 'Hard deposits of minerals and salts that form inside your kidneys.', symptoms: ['Severe pain', 'Blood in urine', 'Nausea', 'Frequent urination'] },
  { _id: '12', name: 'Thyroid Disorder', slug: 'thyroid-disorder', category: 'Endocrine', severity: 'Chronic', description: 'Conditions affecting the thyroid gland, impacting metabolism.', symptoms: ['Weight changes', 'Fatigue', 'Temperature sensitivity', 'Mood changes'] },
];

const categories = [
  'All', 'Cardiovascular', 'Respiratory', 'Neurological', 'Endocrine',
  'Musculoskeletal', 'Infectious', 'Mental Health', 'Hematological', 'Urological'
];

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      const res = await aiAPI.getAllDiseases();
      if (res.data.success && res.data.data?.length > 0) {
        setDiseases(res.data.data);
      } else {
        setDiseases(fallbackDiseases);
      }
    } catch (error) {
      console.log('Using fallback disease data');
      setDiseases(fallbackDiseases);
    } finally {
      setLoading(false);
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
