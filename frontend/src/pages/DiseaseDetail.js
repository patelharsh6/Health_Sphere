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

// ═══════════════════════════════════════
// FALLBACK DISEASE DATA (mirrors DiseaseListing fallback)
// ═══════════════════════════════════════
const fallbackDiseases = [
  {
    name: 'Diabetes',
    slug: 'diabetes',
    category: 'Chronic',
    severity: 'severe',
    specialistType: 'Endocrinologist',
    description: 'A metabolic disease that causes high blood sugar levels over a prolonged period. It occurs when the pancreas does not produce enough insulin or the body cannot effectively use the insulin it produces.',
    symptoms: ['Increased thirst', 'Frequent urination', 'Extreme hunger', 'Fatigue', 'Blurred vision', 'Slow-healing wounds', 'Tingling in hands or feet', 'Unexplained weight loss'],
    causes: ['Insulin resistance', 'Genetics', 'Obesity', 'Sedentary lifestyle', 'Pancreatic dysfunction'],
    riskFactors: ['Obesity', 'Family history', 'Age above 45', 'Physical inactivity', 'High blood pressure', 'PCOS'],
    treatments: [
      { name: 'Metformin', description: 'Oral medication to control blood sugar levels', type: 'medication' },
      { name: 'Insulin Therapy', description: 'Injected insulin for advanced cases', type: 'medication' },
      { name: 'Diet Control', description: 'Low-carb, balanced meals with regular monitoring', type: 'lifestyle' },
      { name: 'Exercise', description: 'Regular physical activity to improve insulin sensitivity', type: 'lifestyle' },
    ],
    preventions: ['Healthy diet', 'Regular exercise', 'Maintain healthy weight', 'Regular blood sugar checks', 'Limit sugar intake'],
    relatedMedicines: ['Metformin', 'Glimepiride', 'Insulin', 'Sitagliptin'],
  },
  {
    name: 'Hypertension',
    slug: 'hypertension',
    category: 'Cardiovascular',
    severity: 'severe',
    specialistType: 'Cardiologist',
    description: 'A chronic medical condition in which blood pressure in the arteries is persistently elevated, increasing the risk of heart disease, stroke, and other complications.',
    symptoms: ['Headaches', 'Shortness of breath', 'Nosebleeds', 'Dizziness', 'Chest pain', 'Blurred vision'],
    causes: ['Genetics', 'High salt diet', 'Obesity', 'Lack of exercise', 'Chronic stress', 'Excessive alcohol'],
    riskFactors: ['Family history', 'Age above 40', 'Obesity', 'Smoking', 'Excessive alcohol', 'High sodium diet'],
    treatments: [
      { name: 'ACE Inhibitors', description: 'Medication to relax blood vessels', type: 'medication' },
      { name: 'Beta Blockers', description: 'Medication to reduce heart rate and blood pressure', type: 'medication' },
      { name: 'Lifestyle Changes', description: 'Diet, exercise, stress management', type: 'lifestyle' },
    ],
    preventions: ['Reduce salt intake', 'Regular exercise', 'Maintain healthy weight', 'Limit alcohol', 'Manage stress'],
    relatedMedicines: ['Amlodipine', 'Losartan', 'Metoprolol', 'Enalapril'],
  },
  {
    name: 'Asthma',
    slug: 'asthma',
    category: 'Respiratory',
    severity: 'moderate',
    specialistType: 'Pulmonologist',
    description: 'A chronic condition where airways narrow and swell, producing extra mucus, making breathing difficult and triggering coughing, wheezing, and shortness of breath.',
    symptoms: ['Shortness of breath', 'Chest tightness', 'Wheezing', 'Coughing', 'Difficulty sleeping due to breathing issues'],
    causes: ['Airborne allergens', 'Respiratory infections', 'Physical activity', 'Cold air', 'Air pollutants', 'Genetics'],
    riskFactors: ['Family history of asthma', 'Having allergies', 'Being overweight', 'Smoking exposure', 'Air pollution'],
    treatments: [
      { name: 'Inhaled Corticosteroids', description: 'Anti-inflammatory medication to reduce airway swelling', type: 'medication' },
      { name: 'Bronchodilators', description: 'Quick-relief medication to open airways', type: 'medication' },
      { name: 'Allergy Management', description: 'Identifying and avoiding triggers', type: 'lifestyle' },
    ],
    preventions: ['Identify and avoid triggers', 'Get vaccinated for flu and pneumonia', 'Monitor breathing', 'Take medications as prescribed'],
    relatedMedicines: ['Salbutamol (Albuterol)', 'Budesonide', 'Montelukast', 'Fluticasone'],
  },
  {
    name: 'Migraine',
    slug: 'migraine',
    category: 'Neurological',
    severity: 'moderate',
    specialistType: 'Neurologist',
    description: 'A neurological condition characterized by intense, debilitating headaches often accompanied by nausea, vomiting, and sensitivity to light and sound.',
    symptoms: ['Severe headache', 'Nausea', 'Vomiting', 'Sensitivity to light', 'Sensitivity to sound', 'Aura', 'Dizziness', 'Blurred vision'],
    causes: ['Neurological changes', 'Hormonal changes', 'Stress', 'Certain foods', 'Weather changes', 'Sleep disturbances'],
    riskFactors: ['Family history', 'Female gender', 'Hormonal changes', 'Stress', 'Sleep disturbances'],
    treatments: [
      { name: 'Sumatriptan', description: 'Triptan medication for acute attacks', type: 'medication' },
      { name: 'Preventive Medication', description: 'Beta blockers or anti-seizure drugs for frequent migraines', type: 'medication' },
      { name: 'Lifestyle Management', description: 'Trigger avoidance, regular sleep, stress management', type: 'lifestyle' },
    ],
    preventions: ['Identify and avoid triggers', 'Regular sleep schedule', 'Stress management', 'Stay hydrated', 'Regular exercise'],
    relatedMedicines: ['Sumatriptan', 'Ibuprofen', 'Propranolol', 'Topiramate'],
  },
  {
    name: 'Arthritis',
    slug: 'arthritis',
    category: 'Chronic',
    severity: 'moderate',
    specialistType: 'Rheumatologist',
    description: 'Swelling and tenderness of joints, causing pain and stiffness that typically worsens with age. Common types include osteoarthritis and rheumatoid arthritis.',
    symptoms: ['Joint pain', 'Stiffness', 'Swelling', 'Decreased range of motion', 'Redness around joints', 'Warmth in affected area'],
    causes: ['Wear and tear of cartilage', 'Autoimmune disorders', 'Infections', 'Genetics', 'Metabolic abnormalities'],
    riskFactors: ['Age', 'Gender (women more prone)', 'Family history', 'Previous joint injury', 'Obesity'],
    treatments: [
      { name: 'NSAIDs', description: 'Anti-inflammatory drugs to reduce pain and swelling', type: 'medication' },
      { name: 'Physical Therapy', description: 'Exercises to improve range of motion and strength', type: 'therapy' },
      { name: 'Joint Replacement', description: 'Surgery for severely damaged joints', type: 'surgery' },
    ],
    preventions: ['Maintain healthy weight', 'Regular exercise', 'Protect joints during activities', 'Avoid repetitive motions'],
    relatedMedicines: ['Ibuprofen', 'Naproxen', 'Methotrexate', 'Hydroxychloroquine'],
  },
  {
    name: 'COVID-19',
    slug: 'covid-19',
    category: 'Infectious',
    severity: 'severe',
    specialistType: 'Infectious Disease Specialist',
    description: 'An infectious disease caused by the SARS-CoV-2 virus, primarily affecting the respiratory system. It can range from mild to severe illness.',
    symptoms: ['Fever', 'Dry cough', 'Fatigue', 'Loss of taste or smell', 'Shortness of breath', 'Body aches', 'Sore throat', 'Headache'],
    causes: ['SARS-CoV-2 virus', 'Airborne transmission', 'Contact with contaminated surfaces', 'Close contact with infected person'],
    riskFactors: ['Age above 65', 'Heart disease', 'Diabetes', 'Obesity', 'Weakened immune system', 'Chronic lung disease'],
    treatments: [
      { name: 'Antiviral Medication', description: 'Paxlovid or similar antivirals for early treatment', type: 'medication' },
      { name: 'Supportive Care', description: 'Rest, fluids, and fever management', type: 'lifestyle' },
      { name: 'Oxygen Therapy', description: 'For severe cases with breathing difficulty', type: 'other' },
    ],
    preventions: ['Vaccination', 'Wear masks in crowded spaces', 'Frequent handwashing', 'Social distancing', 'Good ventilation'],
    relatedMedicines: ['Paracetamol', 'Dexamethasone', 'Remdesivir', 'Paxlovid'],
  },
  {
    name: 'Depression',
    slug: 'depression',
    category: 'Mental Health',
    severity: 'moderate',
    specialistType: 'Psychiatrist',
    description: 'A mood disorder causing persistent feelings of sadness and loss of interest that affects how you feel, think, and handle daily activities.',
    symptoms: ['Persistent sadness', 'Loss of interest', 'Fatigue', 'Difficulty concentrating', 'Changes in appetite', 'Sleep disturbances', 'Feelings of worthlessness'],
    causes: ['Brain chemistry imbalances', 'Genetics', 'Traumatic events', 'Chronic stress', 'Hormonal changes'],
    riskFactors: ['Family history', 'Major life changes', 'Chronic illness', 'Substance abuse', 'Social isolation'],
    treatments: [
      { name: 'Antidepressants', description: 'SSRIs or SNRIs to balance brain chemistry', type: 'medication' },
      { name: 'Psychotherapy (CBT)', description: 'Cognitive behavioral therapy to change thought patterns', type: 'therapy' },
      { name: 'Lifestyle Changes', description: 'Exercise, social connection, mindfulness', type: 'lifestyle' },
    ],
    preventions: ['Regular exercise', 'Strong social connections', 'Adequate sleep', 'Stress management', 'Seek help early'],
    relatedMedicines: ['Sertraline', 'Fluoxetine', 'Escitalopram', 'Venlafaxine'],
  },
  {
    name: 'Anemia',
    slug: 'anemia',
    category: 'Chronic',
    severity: 'mild',
    specialistType: 'Hematologist',
    description: 'A condition where blood lacks adequate healthy red blood cells or hemoglobin to carry oxygen to tissues, causing fatigue and weakness.',
    symptoms: ['Fatigue', 'Weakness', 'Pale skin', 'Shortness of breath', 'Dizziness', 'Cold hands and feet', 'Irregular heartbeat'],
    causes: ['Iron deficiency', 'Vitamin B12 deficiency', 'Chronic diseases', 'Bone marrow problems', 'Blood loss'],
    riskFactors: ['Poor diet', 'Intestinal disorders', 'Menstruation', 'Pregnancy', 'Chronic conditions', 'Family history'],
    treatments: [
      { name: 'Iron Supplements', description: 'Oral or IV iron to replenish stores', type: 'medication' },
      { name: 'Vitamin Supplements', description: 'B12 or folate supplementation', type: 'medication' },
      { name: 'Dietary Changes', description: 'Iron-rich foods like spinach, red meat, beans', type: 'lifestyle' },
    ],
    preventions: ['Iron-rich diet', 'Vitamin C to enhance absorption', 'Regular health checkups', 'Treat underlying conditions'],
    relatedMedicines: ['Ferrous Sulfate', 'Vitamin B12', 'Folic Acid', 'Epoetin Alfa'],
  },
  {
    name: 'Pneumonia',
    slug: 'pneumonia',
    category: 'Respiratory',
    severity: 'severe',
    specialistType: 'Pulmonologist',
    description: 'An infection that inflames air sacs in one or both lungs, which may fill with fluid or pus, causing cough, fever, and difficulty breathing.',
    symptoms: ['Chest pain', 'Cough with phlegm', 'Fever', 'Difficulty breathing', 'Fatigue', 'Nausea', 'Chills'],
    causes: ['Bacteria (Streptococcus pneumoniae)', 'Viruses', 'Fungi', 'Aspiration of foreign substances'],
    riskFactors: ['Age (very young or elderly)', 'Chronic lung disease', 'Weakened immune system', 'Smoking', 'Hospitalization'],
    treatments: [
      { name: 'Antibiotics', description: 'For bacterial pneumonia treatment', type: 'medication' },
      { name: 'Antivirals', description: 'For viral pneumonia treatment', type: 'medication' },
      { name: 'Supportive Care', description: 'Rest, fluids, fever reducers', type: 'lifestyle' },
    ],
    preventions: ['Vaccination (pneumococcal vaccine)', 'Good hygiene', "Don't smoke", 'Keep immune system strong'],
    relatedMedicines: ['Amoxicillin', 'Azithromycin', 'Levofloxacin', 'Oseltamivir'],
  },
  {
    name: "Alzheimer's Disease",
    slug: 'alzheimers',
    category: 'Neurological',
    severity: 'severe',
    specialistType: 'Neurologist',
    description: 'A progressive neurological disorder that causes brain cells to degenerate, leading to a continuous decline in memory, thinking, and social skills.',
    symptoms: ['Memory loss', 'Confusion', 'Difficulty with routine tasks', 'Mood changes', 'Disorientation', 'Difficulty speaking or writing'],
    causes: ['Brain cell degeneration', 'Protein buildup (amyloid plaques, tau tangles)', 'Genetics', 'Age-related changes'],
    riskFactors: ['Age above 65', 'Family history', 'Genetics (APOE gene)', 'Head trauma', 'Cardiovascular disease'],
    treatments: [
      { name: 'Cholinesterase Inhibitors', description: 'Medications to boost cell-to-cell communication', type: 'medication' },
      { name: 'Cognitive Stimulation', description: 'Mental exercises and activities', type: 'therapy' },
      { name: 'Supportive Care', description: 'Structured environment and caregiver support', type: 'lifestyle' },
    ],
    preventions: ['Mental stimulation', 'Regular exercise', 'Heart-healthy diet', 'Quality sleep', 'Social engagement'],
    relatedMedicines: ['Donepezil', 'Rivastigmine', 'Memantine', 'Galantamine'],
  },
  {
    name: 'Kidney Stones',
    slug: 'kidney-stones',
    category: 'Chronic',
    severity: 'moderate',
    specialistType: 'Urologist',
    description: 'Hard deposits of minerals and salts that form inside your kidneys, causing severe pain when passing through the urinary tract.',
    symptoms: ['Severe pain in side/back', 'Blood in urine', 'Nausea', 'Frequent urination', 'Pain while urinating', 'Cloudy or foul-smelling urine'],
    causes: ['Concentrated urine', 'High calcium diet', 'Dehydration', 'Certain medications', 'Metabolic conditions'],
    riskFactors: ['Dehydration', 'High-sodium diet', 'Obesity', 'Digestive problems', 'Family history'],
    treatments: [
      { name: 'Pain Management', description: 'NSAIDs and prescription pain relievers', type: 'medication' },
      { name: 'Lithotripsy', description: 'Sound waves to break up large stones', type: 'surgery' },
      { name: 'Hydration Therapy', description: 'Drinking plenty of water to pass small stones', type: 'lifestyle' },
    ],
    preventions: ['Stay well hydrated', 'Reduce sodium intake', 'Eat less animal protein', 'Avoid oxalate-rich foods'],
    relatedMedicines: ['Tamsulosin', 'Potassium Citrate', 'Allopurinol', 'Ibuprofen'],
  },
  {
    name: 'Thyroid Disorder',
    slug: 'thyroid-disorder',
    category: 'Chronic',
    severity: 'moderate',
    specialistType: 'Endocrinologist',
    description: 'Conditions affecting the thyroid gland which can cause it to produce too much (hyperthyroidism) or too little (hypothyroidism) thyroid hormone, impacting metabolism.',
    symptoms: ['Weight changes', 'Fatigue', 'Temperature sensitivity', 'Mood changes', 'Hair changes', 'Irregular heartbeat'],
    causes: ['Autoimmune disease (Hashimoto\'s, Graves\')', 'Iodine deficiency', 'Thyroid nodules', 'Genetics'],
    riskFactors: ['Family history', 'Female gender', 'Age above 60', 'Autoimmune conditions', 'Radiation exposure'],
    treatments: [
      { name: 'Levothyroxine', description: 'Synthetic thyroid hormone for hypothyroidism', type: 'medication' },
      { name: 'Anti-thyroid Medication', description: 'Methimazole for hyperthyroidism', type: 'medication' },
      { name: 'Regular Monitoring', description: 'Regular blood tests to monitor thyroid levels', type: 'lifestyle' },
    ],
    preventions: ['Regular thyroid checkups', 'Adequate iodine intake', 'Be aware of family history', 'Monitor symptoms'],
    relatedMedicines: ['Levothyroxine', 'Methimazole', 'Propylthiouracil', 'Liothyronine'],
  },
];

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
      if (res.data.success && res.data.data) {
        setDisease(res.data.data);
      } else {
        // Try fallback data
        const fallback = fallbackDiseases.find(d => d.slug === slug);
        if (fallback) {
          setDisease(fallback);
        } else {
          setError('Disease not found.');
        }
      }
    } catch (err) {
      console.error('API failed, trying fallback data:', err);
      // Use fallback data when API is unavailable
      const fallback = fallbackDiseases.find(d => d.slug === slug);
      if (fallback) {
        setDisease(fallback);
      } else {
        setError('Failed to load disease details.');
      }
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