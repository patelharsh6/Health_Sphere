import React, { useState } from 'react';
import { 
  Search, X, AlertTriangle, Activity, 
  Stethoscope, Info, Bot, Thermometer, 
  ArrowRight, ShieldAlert, Calendar 
} from 'lucide-react';
import './SymptomChecker.css';

const commonSymptomsList = [
  "Fever", "Headache", "Cough", "Fatigue", 
  "Chest Pain", "Nausea", "Sore Throat", "Body Ache", "Shortness of Breath"
];

const SymptomChecker = () => {
  // Form State
  const [symptomInput, setSymptomInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [patientData, setPatientData] = useState({
    age: '',
    gender: '',
    duration: '1-3 days',
    severity: 'moderate'
  });

  // UI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  // Handle Symptom Input
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

  // Simulate ML Analysis
  const handleAnalyze = () => {
    if (selectedSymptoms.length === 0) {
      alert("Please enter at least one symptom.");
      return;
    }

    setIsAnalyzing(true);
    setResults(null);

    // Fake network/ML processing delay
    setTimeout(() => {
      // Generate mock results based on severity to make it feel dynamic
      const isSevere = patientData.severity === 'severe' || selectedSymptoms.includes('Chest Pain');
      
      setResults({
        riskLevel: isSevere ? 'High Risk' : 'Moderate Risk',
        riskColor: isSevere ? 'red' : 'yellow',
        predictions: [
          { name: isSevere ? "Pneumonia / Severe Infection" : "Viral Flu", probability: 65 },
          { name: "Seasonal Allergies", probability: 20 },
          { name: "Common Cold", probability: 15 }
        ]
      });
      setIsAnalyzing(false);
    }, 2500);
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
          
          {/* Patient Context */}
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

          {/* Symptom Input */}
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

            {/* Suggested Symptoms */}
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

            {/* Selected Symptoms Tags */}
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
          
          {/* Empty State */}
          {!isAnalyzing && !results && (
            <div className="empty-results">
              <Bot size={48} className="empty-icon" />
              <h3>Awaiting Symptoms</h3>
              <p>Add your details and symptoms on the left, then click Analyze to see AI predictions.</p>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="loading-results">
              <div className="loader-spinner"></div>
              <h3>Running AI Models...</h3>
              <p>Comparing your symptoms against thousands of medical records.</p>
            </div>
          )}

          {/* Actual Results */}
          {results && !isAnalyzing && (
            <div className="results-card">
              
              {/* Risk Indicator */}
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
                  <button className="book-btn-small">Book Doctor</button>
                )}
              </div>

              {/* Predictions */}
              <div className="predictions-list">
                <h3>Possible Conditions</h3>
                {results.predictions.map((pred, idx) => (
                  <div key={idx} className="prediction-item">
                    <div className="pred-info">
                      <div className="pred-rank">{idx + 1}</div>
                      <div>
                        <h4>{pred.name}</h4>
                        <a href="#" className="learn-more-link">Learn about this disease</a>
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

              {/* Recommendations */}
              <div className="recommendations">
                <h3>Recommended Actions</h3>
                <ul>
                  <li><Thermometer size={16}/> Rest and stay hydrated.</li>
                  <li><Activity size={16}/> Monitor symptoms for the next 24 hours.</li>
                  <li><Stethoscope size={16}/> <a href="/appointments">Consult a doctor</a> for a formal diagnosis.</li>
                </ul>
              </div>

              {/* AI Ethics Notice (Viva Point) */}
              <div className="ai-ethics-notice">
                <ShieldAlert size={16} />
                <p><strong>AI Ethics Notice:</strong> HealthSphere AI provides assistance and should not replace professional medical advice, diagnosis, or treatment.</p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SymptomChecker;