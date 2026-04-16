import React, { useState } from 'react';
import {
  Search, Pill, AlertTriangle, ArrowRight,
  ChevronRight, Shield, Clock, Activity, Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './MedicineListing.css';

// Static medicine data
const medicinesData = [
  { _id: '1', name: 'Paracetamol', slug: 'paracetamol', category: 'Pain Relief', type: 'Tablet', description: 'Common pain reliever and fever reducer. Used for headaches, muscle aches, and colds.', uses: ['Fever', 'Headache', 'Pain'], prescriptionRequired: false },
  { _id: '2', name: 'Amoxicillin', slug: 'amoxicillin', category: 'Antibiotic', type: 'Capsule', description: 'Penicillin-type antibiotic used to treat bacterial infections like ear, nose, and throat infections.', uses: ['Bacterial infections', 'Ear infections', 'UTI'], prescriptionRequired: true },
  { _id: '3', name: 'Metformin', slug: 'metformin', category: 'Diabetes', type: 'Tablet', description: 'First-line medication for treating type 2 diabetes by controlling blood sugar levels.', uses: ['Type 2 Diabetes', 'PCOS', 'Blood sugar control'], prescriptionRequired: true },
  { _id: '4', name: 'Omeprazole', slug: 'omeprazole', category: 'Gastrointestinal', type: 'Capsule', description: 'Proton pump inhibitor that reduces stomach acid production for acid reflux and ulcers.', uses: ['Acid reflux', 'GERD', 'Stomach ulcers'], prescriptionRequired: true },
  { _id: '5', name: 'Cetirizine', slug: 'cetirizine', category: 'Allergy', type: 'Tablet', description: 'Antihistamine used for allergies, hay fever, and hives. Non-drowsy formula.', uses: ['Allergies', 'Hay fever', 'Hives'], prescriptionRequired: false },
  { _id: '6', name: 'Amlodipine', slug: 'amlodipine', category: 'Cardiovascular', type: 'Tablet', description: 'Calcium channel blocker used for treating high blood pressure and chest pain.', uses: ['Hypertension', 'Chest pain', 'Angina'], prescriptionRequired: true },
  { _id: '7', name: 'Ibuprofen', slug: 'ibuprofen', category: 'Pain Relief', type: 'Tablet', description: 'Nonsteroidal anti-inflammatory drug (NSAID) for pain relief and inflammation reduction.', uses: ['Pain relief', 'Inflammation', 'Arthritis'], prescriptionRequired: false },
  { _id: '8', name: 'Azithromycin', slug: 'azithromycin', category: 'Antibiotic', type: 'Tablet', description: 'Macrolide antibiotic used for treating respiratory infections and sexually transmitted infections.', uses: ['Pneumonia', 'Bronchitis', 'Skin infections'], prescriptionRequired: true },
  { _id: '9', name: 'Levothyroxine', slug: 'levothyroxine', category: 'Thyroid', type: 'Tablet', description: 'Synthetic thyroid hormone replacement for hypothyroidism treatment.', uses: ['Hypothyroidism', 'Goiter', 'Thyroid cancer'], prescriptionRequired: true },
  { _id: '10', name: 'Vitamin D3', slug: 'vitamin-d3', category: 'Supplement', type: 'Softgel', description: 'Essential vitamin supplement for bone health and immune function support.', uses: ['Bone health', 'Vitamin D deficiency', 'Immune support'], prescriptionRequired: false },
  { _id: '11', name: 'Atorvastatin', slug: 'atorvastatin', category: 'Cardiovascular', type: 'Tablet', description: 'Statin medication for lowering high cholesterol and reducing cardiovascular risk.', uses: ['High cholesterol', 'Heart disease prevention'], prescriptionRequired: true },
  { _id: '12', name: 'Montelukast', slug: 'montelukast', category: 'Respiratory', type: 'Tablet', description: 'Leukotriene receptor antagonist for treating asthma and seasonal allergies.', uses: ['Asthma prevention', 'Allergic rhinitis'], prescriptionRequired: true },
];

const categories = [
  'All', 'Pain Relief', 'Antibiotic', 'Diabetes', 'Cardiovascular',
  'Gastrointestinal', 'Allergy', 'Thyroid', 'Respiratory', 'Supplement'
];

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
  const [activeCategory, setActiveCategory] = useState('All');
  const [showPrescription, setShowPrescription] = useState('all'); // all | otc | prescription

  const filteredMedicines = medicinesData.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = activeCategory === 'All' || m.category === activeCategory;
    const matchType = showPrescription === 'all' ||
      (showPrescription === 'otc' && !m.prescriptionRequired) ||
      (showPrescription === 'prescription' && m.prescriptionRequired);
    return matchSearch && matchCategory && matchType;
  });

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
            <h2>{filteredMedicines.length} Medicines</h2>
          </div>

          {filteredMedicines.length === 0 ? (
            <div className="ml-empty">
              <Pill size={48} style={{ opacity: 0.2 }} />
              <h3>No medicines found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="ml-grid">
              {filteredMedicines.map(med => (
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
