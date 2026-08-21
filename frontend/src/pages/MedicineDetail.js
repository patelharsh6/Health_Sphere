import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Pill, Activity, AlertTriangle, ShieldAlert, 
  Info, ChevronDown, ChevronUp, Beaker, 
  Zap, FileWarning, Thermometer, Loader 
} from 'lucide-react';
import { medicineAPI } from '../services/api';
import './MedicineDetail.css';

// Reusable Collapsible Section Component
const CollapsibleSection = ({ title, icon, children, defaultOpen = true, type = "default" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className={`medicine-section card-${type}`}>
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

const MedicineDetail = () => {
  const { slug } = useParams();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedicine = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await medicineAPI.getBySlug(slug);
        if (res.data.success) {
          setMedicine(res.data.data);
        }
      } catch (err) {
        setError('Medicine not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [slug]);

  if (loading) {
    return (
      <div className="medicine-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader size={48} className="spin-icon" style={{ opacity: 0.5, animation: 'spin 2s linear infinite' }} />
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="medicine-page" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: '20px' }} />
        <h1>Medicine Not Found</h1>
        <p>The medicine you are looking for does not exist or has been removed.</p>
        <Link to="/medicines" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
          Back to Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="medicine-page">
      
      {/* 1. MEDICINE HEADER */}
      <header className="medicine-hero">
        <div className="hero-container">
          <div className="breadcrumbs">
            <Link to="/">Home</Link> / <Link to="/medicines">Medicines</Link> / <span>{medicine.name}</span>
          </div>
          <div className="medicine-badges">
            <span className="badge type-badge">{medicine.type}</span>
            <span className="badge category-badge">{medicine.category}</span>
            {medicine.prescriptionRequired ? (
              <span className="badge otc-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>Prescription Required (Rx)</span>
            ) : (
              <span className="badge otc-badge">Over The Counter (OTC)</span>
            )}
          </div>
          <h1>{medicine.name}</h1>
          <p className="generic-name"><strong>Generic Name:</strong> {medicine.genericName}</p>
          <p className="medicine-summary">
            {medicine.summary}
          </p>
        </div>
      </header>

      <div className="medicine-layout">
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <main className="main-content">
          
          {/* 3. USES SECTION */}
          {medicine.uses && medicine.uses.length > 0 && (
            <CollapsibleSection title="Primary Uses" icon={<Activity size={24} />} type="info">
              <p>{medicine.name} is commonly used to treat and manage the following conditions:</p>
              <div className="uses-tags">
                {medicine.uses.map((u, i) => (
                  <span key={i} className="use-tag">{u}</span>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* 4. HOW IT WORKS */}
          {medicine.howItWorks && (
            <CollapsibleSection title="How it Works" icon={<Beaker size={24} />}>
              <p>
                {medicine.howItWorks}
              </p>
            </CollapsibleSection>
          )}

          {/* 5. DOSAGE GUIDELINES */}
          {medicine.dosage && (
            <CollapsibleSection title="Dosage Guidelines" icon={<Pill size={24} />} type="info">
              <div className="dosage-box">
                {medicine.dosage.adult && (
                  <div className="dose-group">
                    <h4>Adults</h4>
                    <p>{medicine.dosage.adult}</p>
                    {medicine.dosage.maxDaily && <span className="dose-limit">{medicine.dosage.maxDaily}</span>}
                  </div>
                )}
                {medicine.dosage.child && (
                  <div className="dose-group">
                    <h4>Children</h4>
                    <p>{medicine.dosage.child}</p>
                  </div>
                )}
              </div>
              {medicine.dosage.notes && (
                <div className="medical-note">
                  <Info size={16} />
                  <span><strong>Note:</strong> {medicine.dosage.notes}</span>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 7. PRECAUTIONS (YELLOW) */}
          {medicine.precautions && medicine.precautions.length > 0 && (
            <CollapsibleSection title="Precautions" icon={<FileWarning size={24} />} type="caution">
              <p>Consult a healthcare provider before using {medicine.name} if you:</p>
              <ul className="content-list caution-list">
                {medicine.precautions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* 6. SIDE EFFECTS (RED) */}
          {medicine.sideEffects && (
            <CollapsibleSection title="Side Effects" icon={<AlertTriangle size={24} />} type="warning">
              <div className="side-effects-grid">
                {medicine.sideEffects.common && medicine.sideEffects.common.length > 0 && (
                  <div className="effect-column">
                    <h4>Common</h4>
                    <ul>
                      {medicine.sideEffects.common.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                {medicine.sideEffects.serious && medicine.sideEffects.serious.length > 0 && (
                  <div className="effect-column danger">
                    <h4>Serious (Seek immediate help)</h4>
                    <ul>
                      {medicine.sideEffects.serious.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* 8. DRUG INTERACTIONS */}
          {medicine.interactions && medicine.interactions.length > 0 && (
            <CollapsibleSection title="Drug Interactions" icon={<Zap size={24} />} type="caution">
              <p>{medicine.name} can interact with certain substances. Avoid combining with:</p>
              <ul className="content-list interaction-list">
                {medicine.interactions.map((int, i) => (
                  <li key={i}><strong>{int.with}:</strong> {int.effect}</li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

        </main>

        {/* RIGHT COLUMN: SIDEBAR */}
        <aside className="sidebar-content">
          
          {/* 2. QUICK INFO */}
          {medicine.quickInfo && (
            <div className="side-panel">
              <h3>Quick Information</h3>
              <ul className="info-list">
                <li>
                  <span className="info-label">Used For</span>
                  <span className="info-value">{medicine.quickInfo.usedFor || '-'}</span>
                </li>
                <li>
                  <span className="info-label">Prescription</span>
                  <span className={`info-value ${medicine.prescriptionRequired ? 'yes' : 'no'}`}>
                    {medicine.prescriptionRequired ? 'Yes (Rx)' : 'No (OTC)'}
                  </span>
                </li>
                <li>
                  <span className="info-label">Safe for Children</span>
                  <span className="info-value">{medicine.quickInfo.safeForChildren || 'Consult doctor'}</span>
                </li>
                <li>
                  <span className="info-label">Pregnancy Safe</span>
                  <span className="info-value">{medicine.quickInfo.pregnancySafe || 'Consult doctor'}</span>
                </li>
              </ul>
            </div>
          )}

          {/* 11. SAFETY DISCLAIMER */}
          <div className="disclaimer-panel">
            <ShieldAlert size={28} className="disclaimer-icon" />
            <h3>Medical Disclaimer</h3>
            <p>
              HealthSphere provides this medicine information for <strong>educational purposes only</strong>. 
              It is not a substitute for professional medical advice, diagnosis, or treatment. 
              Always consult a qualified healthcare professional before starting or stopping any medication.
            </p>
          </div>

          {/* 9. RELATED DISEASES */}
          {medicine.relatedDiseases && medicine.relatedDiseases.length > 0 && (
            <div className="side-panel">
              <h3>Used in Diseases</h3>
              {medicine.relatedDiseases.map((dSlug) => (
                <Link to={`/diseases/${dSlug}`} key={dSlug} className="related-link">
                  <Activity size={16} /> {dSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Link>
              ))}
            </div>
          )}

          {/* 10. RELATED MEDICINES */}
          {medicine.alternatives && medicine.alternatives.length > 0 && (
            <div className="side-panel">
              <h3>Alternative Medicines</h3>
              {medicine.alternatives.map((aSlug) => (
                <Link to={`/medicines/${aSlug}`} key={aSlug} className="related-link">
                  <Pill size={16} /> {aSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Link>
              ))}
            </div>
          )}

        </aside>
      </div>
    </div>
  );
};

export default MedicineDetail;