import React, { useState, useEffect } from 'react';
import { 
  Pill, Activity, AlertTriangle, ShieldAlert, 
  Info, ChevronDown, ChevronUp, Beaker, 
  Zap, FileWarning, Thermometer 
} from 'lucide-react';
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
  return (
    <div className="medicine-page">
      
      {/* 1. MEDICINE HEADER */}
      <header className="medicine-hero">
        <div className="hero-container">
          <div className="breadcrumbs">
            <a href="/">Home</a> / <a href="/medicines">Medicines</a> / <span>Paracetamol</span>
          </div>
          <div className="medicine-badges">
            <span className="badge type-badge">Tablet / Syrup</span>
            <span className="badge category-badge">Pain Reliever / Fever Reducer</span>
            <span className="badge otc-badge">Over The Counter (OTC)</span>
          </div>
          <h1>Paracetamol</h1>
          <p className="generic-name"><strong>Generic Name:</strong> Acetaminophen</p>
          <p className="medicine-summary">
            A widely used medication to treat mild to moderate pain and reduce fever. 
            It is generally safe when used at recommended doses but can cause severe liver damage if overdosed.
          </p>
        </div>
      </header>

      <div className="medicine-layout">
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <main className="main-content">
          
          {/* 3. USES SECTION */}
          <CollapsibleSection title="Primary Uses" icon={<Activity size={24} />} type="info">
            <p>Paracetamol is commonly used to treat and manage the following conditions:</p>
            <div className="uses-tags">
              <span className="use-tag">Fever</span>
              <span className="use-tag">Headache</span>
              <span className="use-tag">Muscle Ache</span>
              <span className="use-tag">Toothache</span>
              <span className="use-tag">Cold & Flu Symptoms</span>
              <span className="use-tag">Menstrual Cramps</span>
            </div>
          </CollapsibleSection>

          {/* 4. HOW IT WORKS */}
          <CollapsibleSection title="How it Works" icon={<Beaker size={24} />}>
            <p>
              Paracetamol works by blocking the production of certain chemical messengers (prostaglandins) in the brain that cause pain and fever. 
              Unlike NSAIDs (like Ibuprofen), it has very little anti-inflammatory effect, meaning it doesn't reduce swelling.
            </p>
          </CollapsibleSection>

          {/* 5. DOSAGE GUIDELINES */}
          <CollapsibleSection title="Dosage Guidelines" icon={<Pill size={24} />} type="info">
            <div className="dosage-box">
              <div className="dose-group">
                <h4>Adults (12 years and older)</h4>
                <p>500mg to 1000mg every 4–6 hours as needed.</p>
                <span className="dose-limit">Maximum: 4,000mg (4 grams) in 24 hours.</span>
              </div>
              <div className="dose-group">
                <h4>Children (Under 12 years)</h4>
                <p>Dosage is strictly based on body weight (typically 10-15mg/kg every 4-6 hours).</p>
                <span className="dose-limit">Do not exceed 5 doses in 24 hours.</span>
              </div>
            </div>
            <div className="medical-note">
              <Info size={16} />
              <span><strong>Note:</strong> Always follow your doctor's recommendations or the instructions on the medicine label.</span>
            </div>
          </CollapsibleSection>

          {/* 7. PRECAUTIONS (YELLOW) */}
          <CollapsibleSection title="Precautions" icon={<FileWarning size={24} />} type="caution">
            <p>Consult a healthcare provider before using Paracetamol if you:</p>
            <ul className="content-list caution-list">
              <li>Have severe liver or kidney disease.</li>
              <li>Consume 3 or more alcoholic drinks every day.</li>
              <li>Are severely underweight or malnourished.</li>
              <li>Are allergic to acetaminophen.</li>
            </ul>
          </CollapsibleSection>

          {/* 6. SIDE EFFECTS (RED) */}
          <CollapsibleSection title="Side Effects" icon={<AlertTriangle size={24} />} type="warning">
            <div className="side-effects-grid">
              <div className="effect-column">
                <h4>Common (Rare if taken correctly)</h4>
                <ul>
                  <li>Mild nausea</li>
                  <li>Stomach upset</li>
                </ul>
              </div>
              <div className="effect-column danger">
                <h4>Serious (Seek immediate help)</h4>
                <ul>
                  <li>Dark urine or pale stools</li>
                  <li>Yellowing of skin/eyes (Jaundice)</li>
                  <li>Severe allergic reaction (Rash, swelling)</li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>

          {/* 8. DRUG INTERACTIONS */}
          <CollapsibleSection title="Drug Interactions" icon={<Zap size={24} />} type="caution">
            <p>Paracetamol can interact dangerously with certain substances. Avoid combining with:</p>
            <ul className="content-list interaction-list">
              <li><strong>Alcohol:</strong> Dramatically increases the risk of liver damage.</li>
              <li><strong>Other Cold Medicines:</strong> Many OTC cold medicines already contain Paracetamol. Taking both causes accidental overdose.</li>
              <li><strong>Ketoconazole:</strong> Can increase the risk of liver toxicity.</li>
              <li><strong>Blood Thinners (Warfarin):</strong> Long-term use of Paracetamol may increase bleeding risk.</li>
            </ul>
          </CollapsibleSection>

        </main>

        {/* RIGHT COLUMN: SIDEBAR */}
        <aside className="sidebar-content">
          
          {/* 2. QUICK INFO */}
          <div className="side-panel">
            <h3>Quick Information</h3>
            <ul className="info-list">
              <li>
                <span className="info-label">Used For</span>
                <span className="info-value">Pain, Fever</span>
              </li>
              <li>
                <span className="info-label">Prescription</span>
                <span className="info-value no">No (OTC)</span>
              </li>
              <li>
                <span className="info-label">Safe for Children</span>
                <span className="info-value yes">Yes (Dose specific)</span>
              </li>
              <li>
                <span className="info-label">Pregnancy Safe</span>
                <span className="info-value yes">Yes (Consult doctor)</span>
              </li>
            </ul>
          </div>

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
          <div className="side-panel">
            <h3>Used in Diseases</h3>
            <a href="/diseases/influenza" className="related-link">
              <Thermometer size={16} /> Influenza (Flu)
            </a>
            <a href="/diseases/cold" className="related-link">
              <Activity size={16} /> Common Cold
            </a>
            <a href="/diseases/dengue" className="related-link">
              <AlertTriangle size={16} /> Viral Fever
            </a>
          </div>

          {/* 10. RELATED MEDICINES */}
          <div className="side-panel">
            <h3>Alternative Medicines</h3>
            <a href="/medicines/ibuprofen" className="related-link">
              <Pill size={16} /> Ibuprofen
            </a>
            <a href="/medicines/aspirin" className="related-link">
              <Pill size={16} /> Aspirin
            </a>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default MedicineDetail;