import React from 'react';
import { 
  ChevronLeft, Brain, AlertTriangle, FileText, 
  Calendar, Building, CheckCircle, TrendingUp, 
  TrendingDown, Activity, Download, RefreshCw, 
  Stethoscope, ArrowRight, ShieldAlert, HeartPulse
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './ReportAnalysis.css';

const ReportAnalysis = () => {
  // Mock ML Data Output
  const reportDetails = {
    name: "Comprehensive Blood & Glucose Panel",
    date: "12 March 2026",
    lab: "Apollo Diagnostics",
    status: "Analysis Completed"
  };

  const indicators = [
    { name: "Fasting Blood Sugar", value: "185", unit: "mg/dL", range: "70-100", status: "Critical", trend: "up" },
    { name: "Hemoglobin (Hb)", value: "11.2", unit: "g/dL", range: "13.8-17.2", status: "Warning", trend: "down" },
    { name: "Total Cholesterol", value: "160", unit: "mg/dL", range: "< 200", status: "Normal", trend: "stable" },
    { name: "White Blood Cells", value: "7.5", unit: "thou/uL", range: "4.5-11.0", status: "Normal", trend: "stable" }
  ];

  return (
    <div className="analysis-page">
      
      {/* 1. HEADER SECTION */}
      <header className="analysis-header">
        <div className="header-container">
          <Link to="/dashboard" className="back-link">
            <ChevronLeft size={20} /> Back to Dashboard
          </Link>
          <div className="header-titles">
            <h1>AI Report Analysis</h1>
            <p>AI-powered insights based on your uploaded medical report.</p>
          </div>
        </div>
      </header>

      <div className="analysis-layout">
        
        {/* LEFT COLUMN: REPORT DATA & INDICATORS */}
        <div className="data-column">
          
          {/* 2. SELECTED REPORT INFO */}
          <div className="report-meta-card">
            <div className="meta-header">
              <FileText size={24} className="text-blue" />
              <h2>{reportDetails.name}</h2>
            </div>
            <div className="meta-details">
              <div className="meta-item">
                <Calendar size={16} /> <span>{reportDetails.date}</span>
              </div>
              <div className="meta-item">
                <Building size={16} /> <span>{reportDetails.lab}</span>
              </div>
            </div>
            <div className="meta-status">
              <CheckCircle size={16} /> {reportDetails.status}
            </div>
          </div>

          {/* 3. KEY HEALTH INDICATORS */}
          <div className="indicators-section">
            <div className="section-title">
              <Activity size={20} />
              <h3>Key Health Indicators</h3>
            </div>
            
            <div className="indicators-list">
              {indicators.map((ind, idx) => (
                <div key={idx} className={`indicator-card status-${ind.status.toLowerCase()}`}>
                  <div className="ind-header">
                    <h4>{ind.name}</h4>
                    <span className="ind-badge">{ind.status}</span>
                  </div>
                  <div className="ind-body">
                    <div className="ind-value-box">
                      <span className="ind-value">{ind.value}</span>
                      <span className="ind-unit">{ind.unit}</span>
                      {ind.trend === 'up' && <TrendingUp size={18} className="trend-icon up" />}
                      {ind.trend === 'down' && <TrendingDown size={18} className="trend-icon down" />}
                    </div>
                    <div className="ind-range">Normal Range: {ind.range}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8. TREND VISUALIZATION (Optional but Powerful) */}
          <div className="trend-graph-section">
            <div className="section-title">
              <TrendingUp size={20} />
              <h3>Blood Sugar Trend (Last 3 Reports)</h3>
            </div>
            <div className="simple-bar-chart">
              <div className="bar-group">
                <div className="bar safe" style={{height: '40%'}}></div>
                <span>Jan</span>
                <span className="bar-val">95</span>
              </div>
              <div className="bar-group">
                <div className="bar warning" style={{height: '60%'}}></div>
                <span>Feb</span>
                <span className="bar-val">120</span>
              </div>
              <div className="bar-group">
                <div className="bar critical" style={{height: '90%'}}></div>
                <span>Mar</span>
                <span className="bar-val">185</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI INSIGHTS & ACTIONS */}
        <div className="insights-column">
          
          {/* 5. RISK LEVEL INDICATOR */}
          <div className="risk-level-card high-risk">
            <div className="risk-header">
              <AlertTriangle size={28} />
              <div>
                <span className="risk-label">Overall Risk Level</span>
                <h2 className="risk-value">High Attention Required</h2>
              </div>
            </div>
          </div>

          {/* 4. AI DIAGNOSIS / PREDICTION */}
          <div className="ai-brain-card">
            <div className="brain-header">
              <Brain size={24} className="brain-icon" />
              <h3>AI ML Prediction</h3>
            </div>
            <div className="prediction-box">
              <p className="prediction-text">
                Based on your elevated Fasting Blood Sugar (185 mg/dL) and historical trends, our models detect early signs of <strong>Type 2 Diabetes / Hyperglycemia</strong>.
              </p>
              <div className="confidence-meter">
                <div className="conf-label">
                  <span>AI Confidence Score</span>
                  <strong>88%</strong>
                </div>
                <div className="conf-bar-bg">
                  <div className="conf-bar-fill" style={{width: '88%'}}></div>
                </div>
              </div>
            </div>

            {/* 10. EXPLANATION SECTION */}
            <div className="friendly-explanation">
              <strong>What does this mean?</strong>
              <p>Your blood sugar is significantly higher than the normal range. Combined with slightly low hemoglobin, this indicates a metabolic imbalance that requires professional medical review.</p>
            </div>
          </div>

          {/* 7. HIGHLIGHT ABNORMAL VALUES */}
          <div className="abnormal-alerts">
            <div className="alert-item critical">
              <AlertTriangle size={18} />
              <span><strong>High Glucose Level:</strong> 185 mg/dL (Normal is &lt;100)</span>
            </div>
            <div className="alert-item warning">
              <ShieldAlert size={18} />
              <span><strong>Low Hemoglobin:</strong> 11.2 g/dL (Normal is &gt;13.8)</span>
            </div>
          </div>

          {/* 6. RECOMMENDATIONS SECTION */}
          <div className="recommendations-card">
            <h3>Recommended Next Steps</h3>
            
            <div className="rec-group">
              <div className="rec-title">
                <HeartPulse size={18} className="text-green" /> Lifestyle Advice
              </div>
              <ul>
                <li>Strictly reduce processed sugar and carbohydrate intake.</li>
                <li>Engage in 30 minutes of light cardio (walking) daily.</li>
                <li>Monitor blood sugar fasting levels every morning.</li>
              </ul>
            </div>

            <div className="rec-group">
              <div className="rec-title">
                <Stethoscope size={18} className="text-blue" /> Doctor Suggestion
              </div>
              <p className="doc-sugg-text">
                Please consult an <strong>Endocrinologist</strong> or General Physician immediately for a formal diagnosis and medication plan.
              </p>
            </div>
          </div>

          {/* 9. ACTION BUTTONS */}
          <div className="action-buttons-grid">
            <button className="action-btn btn-primary">
              <Calendar size={18} /> Book Appointment
            </button>
            <button className="action-btn btn-secondary">
              <Download size={18} /> Download Report
            </button>
            <button className="action-btn btn-outline">
              <RefreshCw size={18} /> Re-analyze
            </button>
            <a href="/dashboard" className="action-btn btn-text">
              Go to Dashboard <ArrowRight size={16} />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReportAnalysis;