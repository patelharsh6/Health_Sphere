import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Activity, ShieldCheck, AlertTriangle, Stethoscope, 
  Pill, Info, ChevronDown, ChevronUp, Thermometer, 
  HeartPulse, FileText, ArrowRight, BookOpen, AlertCircle,
  Loader
} from 'lucide-react';
import { aiAPI } from '../services/api';
import './DiseaseDetail.css';

// Collapsible Section Component
const CollapsibleSection = ({ title, icon, children, defaultOpen = true, type = "default" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className={`disease-section card-${type}`}>
      <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="section-title">
          {icon}
          <h2>{title}</h2>
        </div>
        <button className="toggle-btn">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
};

const DiseaseDetail = () => {
  const { slug } = useParams();
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchDisease();
    }
  }, [slug]);

  const fetchDisease = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.getDiseaseBySlug(slug);
      if (res.data.success) {
        setDisease(res.data.data);
      } else {
        setError('Disease not found.');
      }
    } catch (err) {
      console.error('Failed to load disease:', err);
      setError('Failed to load disease details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="disease-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader size={40} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading disease details...</p>
        </div>
      </div>
    );
  }

  if (error || !disease) {
    return (
      <div className="disease-page" style={{ textAlign: 'center', padding: '60px' }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
        <h2>{error || 'Disease not found'}</h2>
        <Link to="/symptoms" style={{ color: '#14b8a6', marginTop: '12px', display: 'inline-block' }}>← Back to Symptom Checker</Link>
      </div>
    );
  }

  return (
    <div className="disease-page">
      
      {/* 1. DISEASE HEADER */}
      <header className="disease-hero">
        <div className="hero-container">
          <div className="breadcrumbs">
            <Link to="/">Home</Link> / <Link to="/symptoms">Health</Link> / <span>{disease.name}</span>
          </div>
          <div className="disease-badges">
            <span className="badge category">{disease.category}</span>
            <span className="badge severity">{disease.severity}</span>
          </div>
          <h1>{disease.name}</h1>
          <p className="disease-summary">{disease.description}</p>
        </div>
      </header>

      <div className="disease-layout">
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <main className="main-content">
          
          {/* SYMPTOMS */}
          {disease.symptoms && disease.symptoms.length > 0 && (
            <CollapsibleSection title="Common Symptoms" icon={<Thermometer size={24} />} type="info">
              <p>Symptoms associated with {disease.name}:</p>
              <div className="symptom-tags">
                {disease.symptoms.map((sym, idx) => (
                  <span key={idx} className="symptom-tag">{sym}</span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* CAUSES */}
          {disease.causes && disease.causes.length > 0 && (
            <CollapsibleSection title="Causes & Transmission" icon={<Activity size={24} />}>
              <ul className="content-list">
                {disease.causes.map((cause, idx) => (
                  <li key={idx}>{cause}</li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* RISK FACTORS */}
          {disease.riskFactors && disease.riskFactors.length > 0 && (
            <CollapsibleSection title="Risk Factors" icon={<HeartPulse size={24} />}>
              <ul className="content-list">
                {disease.riskFactors.map((rf, idx) => (
                  <li key={idx}>{rf}</li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* TREATMENT */}
          {disease.treatments && disease.treatments.length > 0 && (
            <CollapsibleSection title="Treatment Options" icon={<Pill size={24} />}>
              <ul className="content-list">
                {disease.treatments.map((t, idx) => (
                  <li key={idx}><strong>{t.name}:</strong> {t.description}</li>
                ))}
              </ul>
              <div className="medical-disclaimer-box">
                <Info size={16} />
                <span><strong>Disclaimer:</strong> Always consult a certified healthcare provider before starting any medication.</span>
              </div>
            </CollapsibleSection>
          )}

          {/* PREVENTION */}
          {disease.preventions && disease.preventions.length > 0 && (
            <CollapsibleSection title="Prevention" icon={<ShieldCheck size={24} />} type="success">
              <ul className="content-list">
                {disease.preventions.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

        </main>

        {/* RIGHT COLUMN: SIDEBAR */}
        <aside className="sidebar-content">
          
          {/* QUICK INFO */}
          <div className="quick-info-panel">
            <h3>Quick Information</h3>
            <ul className="info-list">
              <li>
                <span className="info-label">Category</span>
                <span className="info-value">{disease.category}</span>
              </li>
              <li>
                <span className="info-label">Severity</span>
                <span className="info-value">{disease.severity}</span>
              </li>
              <li>
                <span className="info-label">Specialist</span>
                <span className="info-value">{disease.specialistType}</span>
              </li>
            </ul>
          </div>

          {/* WHEN TO SEE DOCTOR */}
          <div className="alert-panel">
            <div className="alert-header">
              <AlertTriangle size={24} />
              <h3>When to See a Doctor</h3>
            </div>
            <p>Seek medical attention if symptoms persist or worsen. Consult a {disease.specialistType} for proper diagnosis.</p>
            <Link to="/appointments" className="book-btn-sidebar" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
              Book Appointment
            </Link>
          </div>

          {/* RELATED MEDICINES */}
          {disease.relatedMedicines && disease.relatedMedicines.length > 0 && (
            <div className="related-panel">
              <h3>Common Medicines</h3>
              {disease.relatedMedicines.map((med, idx) => (
                <span key={idx} className="related-link" style={{ display: 'block', padding: '8px 0' }}>
                  <Pill size={16} /> {med}
                </span>
              ))}
            </div>
          )}

        </aside>
      </div>
    </div>
  );
};

export default DiseaseDetail;