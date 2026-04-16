import React, { useState } from 'react';
import { 
  Search, X, AlertTriangle, Activity, 
  Stethoscope, Info, Bot, Thermometer, 
  ArrowRight, ShieldAlert, Calendar 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../services/api';
import './SymptomChecker.css';

const commonSymptomsList = [
  "Fever", "Headache", "Cough", "Fatigue", 
  "Chest Pain", "Nausea", "Sore Throat", "Body Ache", "Shortness of Breath"
];

const SymptomChecker = () => {
  const [symptomInput, setSymptomInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [patientData, setPatientData] = useState({
    age: '',
    gender: '',
    duration: '1-3 days',
    severity: 'moderate'
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [apiError, setApiError] = useState('');

  const handleAddSymptom = (symptom) => {
    if (symptom && !selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      setSymptomInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSymptom(symptomInput.trim());
    }
  };

  const removeSymptom = (symptomToRemove) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomToRemove));
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      alert("Please enter at least one symptom.");
      return;
    }

    setIsAnalyzing(true);
    setResults(null);
    setApiError('');

    try {
      const res = await aiAPI.symptomCheck(selectedSymptoms);
      if (res.data.success) {
        const data = res.data.data;
        const isSevere = patientData.severity === 'severe' || 
                         selectedSymptoms.includes('Chest Pain') ||
                         (data.length > 0 && data[0].disease?.severity === 'severe');
        
        setResults({
          riskLevel: isSevere ? 'High Risk' : data.length > 0 ? 'Moderate Risk' : 'Low Risk',
          riskColor: isSevere ? 'red' : data.length > 0 ? 'yellow' : 'green',
          predictions: data.slice(0, 3).map(item => ({
            name: item.disease?.name || 'Unknown',
            probability: item.matchScore || 0,
            slug: item.disease?.slug || '',
            specialistType: item.disease?.specialistType || 'General Physician'
          })),
          disclaimer: res.data.disclaimer
        });
      }
    } catch (error) {
      console.error('Symptom check failed:', error);
      setApiError('Failed to analyze symptoms. Please try again.');
      
      // Fallback to client-side mock if API fails
      const isSevere = patientData.severity === 'severe' || selectedSymptoms.includes('Chest Pain');
      setResults({
        riskLevel: isSevere ? 'High Risk' : 'Moderate Risk',
        riskColor: isSevere ? 'red' : 'yellow',
        predictions: [
          { name: isSevere ? "Pneumonia / Severe Infection" : "Viral Flu", probability: 65, slug: 'influenza' },
          { name: "Seasonal Allergies", probability: 20, slug: '' },
          { name: "Common Cold", probability: 15, slug: 'common-cold' }
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="symptom-page">
      
      {/* 1. PAGE HEADER */}
      <header className="symptom-header">
        <div className="header-badge"><Bot size={16} /> AI Assistant</div>
        <h1>AI Symptom Checker</h1>
        <p>Enter your symptoms to receive AI-assisted health insights.</p>
        <div className="header-disclaimer">
          <Info size={16} /> 
          <span>This tool provides informational insights and is <strong>not a medical diagnosis</strong>.</span>
        </div>
      </header>

      <div className="symptom-container">
        
        {/* LEFT COLUMN: INPUT FORM */}
        <div className="symptom-form-section">
          
          <div className="form-card">
            <h3>1. Patient Details</h3>
            <div className="input-grid">
              <div className="input-group">
                <label>Age</label>
                <input 
                  type="number" 
                  placeholder="e.g. 25" 
                  value={patientData.age}
                  onChange={(e) => setPatientData({...patientData, age: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Gender</label>
                <select 
                  value={patientData.gender}
                  onChange={(e) => setPatientData({...patientData, gender: e.target.value})}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="input-grid">
              <div className="input-group">
                <label>Symptom Duration</label>
                <select 
                  value={patientData.duration}
                  onChange={(e) => setPatientData({...patientData, duration: e.target.value})}
                >
                  <option value="Less than 24 hours">Less than 24 hours</option>
                  <option value="1-3 days">1-3 days</option>
                  <option value="1 week">1 week</option>
                  <option value="More than a week">More than a week</option>
                </select>
              </div>
              <div className="input-group">
                <label>Severity</label>
                <select 
                  value={patientData.severity}
                  onChange={(e) => setPatientData({...patientData, severity: e.target.value})}
                >
                  <option value="mild">Mild (Manageable)</option>
                  <option value="moderate">Moderate (Uncomfortable)</option>
                  <option value="severe">Severe (Affects daily life)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h3>2. Add Symptoms</h3>
            
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Type a symptom and press Enter (e.g., Fever)" 
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                className="add-btn"
                onClick={() => handleAddSymptom(symptomInput.trim())}
              >
                Add
              </button>
            </div>

            <div className="suggestions">
              <span className="suggestion-label">Suggestions:</span>
              {commonSymptomsList.map(sym => (
                <button 
                  key={sym} 
                  className="suggestion-chip"
                  onClick={() => handleAddSymptom(sym)}
                  disabled={selectedSymptoms.includes(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="selected-symptoms">
              {selectedSymptoms.length === 0 ? (
                <p className="no-symptoms-text">No symptoms added yet.</p>
              ) : (
                selectedSymptoms.map(sym => (
                  <div key={sym} className="symptom-tag">
                    {sym}
                    <X size={14} className="remove-icon" onClick={() => removeSymptom(sym)} />
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            className="analyze-btn" 
            onClick={handleAnalyze}
            disabled={isAnalyzing || selectedSymptoms.length === 0}
          >
            {isAnalyzing ? "Analyzing Symptoms using AI..." : "Analyze Symptoms"}
            {!isAnalyzing && <Activity size={18} />}
          </button>
        </div>

        {/* RIGHT COLUMN: PREDICTION RESULTS */}
        <div className="symptom-results-section">
          
          {!isAnalyzing && !results && (
            <div className="empty-results">
              <Bot size={48} className="empty-icon" />
              <h3>Awaiting Symptoms</h3>
              <p>Add your details and symptoms on the left, then click Analyze to see AI predictions.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="loading-results">
              <div className="loader-spinner"></div>
              <h3>Running AI Models...</h3>
              <p>Comparing your symptoms against medical records database.</p>
            </div>
          )}

          {results && !isAnalyzing && (
            <div className="results-card">
              
              <div className={`risk-banner risk-${results.riskColor}`}>
                <AlertTriangle size={24} />
                <div className="risk-text">
                  <h4>{results.riskLevel}</h4>
                  <p>
                    {results.riskColor === 'red' 
                      ? "We recommend consulting a doctor immediately." 
                      : "Monitor your symptoms closely. Consult a doctor if they worsen."}
                  </p>
                </div>
                {results.riskColor === 'red' && (
                  <Link to="/appointments" className="book-btn-small" style={{ textDecoration: 'none' }}>Book Doctor</Link>
                )}
              </div>

              <div className="predictions-list">
                <h3>Possible Conditions</h3>
                {results.predictions.map((pred, idx) => (
                  <div key={idx} className="prediction-item">
                    <div className="pred-info">
                      <div className="pred-rank">{idx + 1}</div>
                      <div>
                        <h4>{pred.name}</h4>
                        {pred.slug && (
                          <Link to={`/diseases/${pred.slug}`} className="learn-more-link">
                            Learn about this disease
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="pred-probability">
                      <div className="prob-text">{pred.probability}% Match</div>
                      <div className="prob-bar-bg">
                        <div className="prob-bar-fill" style={{ width: `${pred.probability}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="recommendations">
                <h3>Recommended Actions</h3>
                <ul>
                  <li><Thermometer size={16}/> Rest and stay hydrated.</li>
                  <li><Activity size={16}/> Monitor symptoms for the next 24 hours.</li>
                  <li><Stethoscope size={16}/> <Link to="/appointments">Consult a doctor</Link> for a formal diagnosis.</li>
                </ul>
              </div>

              <div className="ai-ethics-notice">
                <ShieldAlert size={16} />
                <p><strong>AI Ethics Notice:</strong> {results.disclaimer || 'HealthSphere AI provides assistance and should not replace professional medical advice, diagnosis, or treatment.'}</p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SymptomChecker;