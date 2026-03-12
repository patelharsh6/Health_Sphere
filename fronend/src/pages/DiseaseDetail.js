import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, AlertTriangle, Stethoscope, 
  Pill, Info, ChevronDown, ChevronUp, Thermometer, 
  HeartPulse, FileText, ArrowRight, BookOpen, AlertCircle
} from 'lucide-react';
import './DiseaseDetail.css';

// Custom Component for Collapsible Sections
const CollapsibleSection = ({ title, icon, children, defaultOpen = true, type = "default" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Auto-collapse on mobile initially
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
  return (
    <div className="disease-page">
      
      {/* 1. DISEASE HEADER */}
      <header className="disease-hero">
        <div className="hero-container">
          <div className="breadcrumbs">
            <a href="/">Home</a> / <a href="/diseases">Encyclopedia</a> / <span>Influenza</span>
          </div>
          <div className="disease-badges">
            <span className="badge category">Viral Infection</span>
            <span className="badge severity">Usually Mild</span>
            <span className="badge commonness">Very Common</span>
          </div>
          <h1>Influenza (Flu)</h1>
          <p className="disease-summary">
            A highly contagious viral infection that attacks your respiratory system — your nose, throat and lungs. 
            For most people, the flu resolves on its own, but sometimes its complications can be deadly.
          </p>
        </div>
      </header>

      <div className="disease-layout">
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <main className="main-content">
          
          {/* 3. SYMPTOMS */}
          <CollapsibleSection title="Common Symptoms" icon={<Thermometer size={24} />} type="info">
            <p>Symptoms usually appear suddenly and include:</p>
            <div className="symptom-tags">
              <span className="symptom-tag">Fever over 38°C</span>
              <span className="symptom-tag">Aching muscles</span>
              <span className="symptom-tag">Chills and sweats</span>
              <span className="symptom-tag">Headache</span>
              <span className="symptom-tag">Dry, persistent cough</span>
              <span className="symptom-tag">Shortness of breath</span>
              <span className="symptom-tag">Fatigue and weakness</span>
            </div>
          </CollapsibleSection>

          {/* 4. CAUSES */}
          <CollapsibleSection title="Causes & Transmission" icon={<Activity size={24} />}>
            <p>
              Influenza is caused by <strong>influenza viruses</strong> that infect the nose, throat, and lungs. 
              These viruses spread when people with the flu cough, sneeze, or talk, sending droplets into the air.
            </p>
            <ul className="content-list">
              <li>Inhaling airborne droplets from an infected person.</li>
              <li>Touching a surface contaminated with the virus and then touching your face.</li>
            </ul>
          </CollapsibleSection>

          {/* 5. RISK FACTORS */}
          <CollapsibleSection title="Risk Factors" icon={<HeartPulse size={24} />}>
            <p>Certain factors may increase your risk of developing the flu or its complications:</p>
            <ul className="content-list">
              <li><strong>Age:</strong> Children under 5 and adults over 65 are at higher risk.</li>
              <li><strong>Pregnancy:</strong> Pregnant women are more likely to develop complications.</li>
              <li><strong>Weakened immune system:</strong> Due to conditions like HIV/AIDS or cancer treatments.</li>
              <li><strong>Chronic illnesses:</strong> Such as asthma, heart disease, or diabetes.</li>
            </ul>
          </CollapsibleSection>

          {/* 6. DIAGNOSIS */}
          <CollapsibleSection title="How it is Diagnosed" icon={<Stethoscope size={24} />}>
            <p>Doctors typically diagnose the flu based on your symptoms. They may also use:</p>
            <ul className="content-list">
              <li><strong>Physical examination:</strong> Checking for fever, throat inflammation, and breathing sounds.</li>
              <li><strong>Rapid Influenza Diagnostic Tests (RIDTs):</strong> A swab of the nose or throat that provides results in 10-15 minutes.</li>
              <li><strong>PCR Tests:</strong> More accurate molecular tests used in hospitals.</li>
            </ul>
          </CollapsibleSection>

          {/* 7. TREATMENT */}
          <CollapsibleSection title="Treatment Options" icon={<Pill size={24} />}>
            <p>Usually, you'll need nothing more than bed rest and plenty of fluids to treat the flu. However, treatments include:</p>
            <ul className="content-list">
              <li><strong>Antiviral Medications:</strong> Such as Oseltamivir (Tamiflu) to reduce symptom duration.</li>
              <li><strong>Pain Relievers:</strong> Acetaminophen or ibuprofen to reduce fever and muscle aches.</li>
              <li><strong>Hydration & Rest:</strong> Essential for immune recovery.</li>
            </ul>
            <div className="medical-disclaimer-box">
              <Info size={16} />
              <span><strong>Disclaimer:</strong> Always consult a certified healthcare provider before starting any medication. Do not give aspirin to children due to the risk of Reye's syndrome.</span>
            </div>
          </CollapsibleSection>

          {/* 8. PREVENTION */}
          <CollapsibleSection title="Prevention" icon={<ShieldCheck size={24} />} type="success">
            <p>The most effective way to prevent the flu and its complications is to get vaccinated every year.</p>
            <ul className="content-list">
              <li><strong>Annual Vaccination:</strong> Recommended for everyone 6 months and older.</li>
              <li><strong>Hand Hygiene:</strong> Wash your hands frequently with soap and water or use hand sanitizer.</li>
              <li><strong>Avoid Close Contact:</strong> Stay away from sick individuals.</li>
              <li><strong>Cover Coughs:</strong> Cough or sneeze into a tissue or your elbow.</li>
            </ul>
          </CollapsibleSection>

        </main>

        {/* RIGHT COLUMN: SIDEBAR */}
        <aside className="sidebar-content">
          
          {/* 2. QUICK INFO */}
          <div className="quick-info-panel">
            <h3>Quick Information</h3>
            <ul className="info-list">
              <li>
                <span className="info-label">Affected System</span>
                <span className="info-value">Respiratory System</span>
              </li>
              <li>
                <span className="info-label">Common Age Group</span>
                <span className="info-value">All Ages</span>
              </li>
              <li>
                <span className="info-label">Contagious</span>
                <span className="info-value yes">Yes (Highly)</span>
              </li>
              <li>
                <span className="info-label">Treatment Type</span>
                <span className="info-value">Medication + Rest</span>
              </li>
            </ul>
          </div>

          {/* 10. WHEN TO SEE DOCTOR */}
          <div className="alert-panel">
            <div className="alert-header">
              <AlertTriangle size={24} />
              <h3>When to See a Doctor</h3>
            </div>
            <p>Seek medical attention immediately if you experience:</p>
            <ul className="alert-list">
              <li>Fever above 39.5°C</li>
              <li>Difficulty breathing or shortness of breath</li>
              <li>Chest pain</li>
              <li>Confusion or sudden dizziness</li>
              <li>Severe vomiting</li>
            </ul>
            <button className="book-btn-sidebar">Book Appointment</button>
          </div>

          {/* 9. RELATED MEDICINES */}
          <div className="related-panel">
            <h3>Common Medicines</h3>
            <a href="/medicines/paracetamol" className="related-link">
              <Pill size={16} /> Paracetamol
            </a>
            <a href="/medicines/oseltamivir" className="related-link">
              <Pill size={16} /> Oseltamivir (Tamiflu)
            </a>
          </div>

          {/* 11. RELATED DISEASES */}
          <div className="related-panel">
            <h3>Similar Conditions</h3>
            <a href="/diseases/cold" className="related-link">
              <Activity size={16} /> Common Cold
            </a>
            <a href="/diseases/covid19" className="related-link">
              <AlertCircle size={16} /> COVID-19
            </a>
            <a href="/diseases/pneumonia" className="related-link">
              <FileText size={16} /> Pneumonia
            </a>
          </div>

          {/* 12. EDUCATIONAL CONTENT */}
          <div className="edu-panel">
            <h3>Learn More</h3>
            <a href="/blog/boost-immunity" className="edu-link">
              <BookOpen size={16} /> How to Boost Immunity Naturally <ArrowRight size={14} />
            </a>
            <a href="/blog/flu-prevention" className="edu-link">
              <BookOpen size={16} /> Flu Prevention Tips <ArrowRight size={14} />
            </a>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default DiseaseDetail;