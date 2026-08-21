import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Brain, AlertTriangle, FileText, 
  Calendar, Building, CheckCircle, TrendingUp, 
  TrendingDown, Activity, Download, RefreshCw, 
  Stethoscope, ArrowRight, ShieldAlert, HeartPulse, Loader
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { reportAPI } from '../services/api';
import './ReportAnalysis.css';

const ReportAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await reportAPI.getById(id);
      if (res.data.success) {
        setReport(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    let interval;
    if (report && report.status === 'processing') {
      interval = setInterval(() => {
        fetchReport();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line
  }, [report?.status]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await reportAPI.reanalyze(id);
      fetchReport();
    } catch (err) {
      console.error(err);
      alert('Failed to trigger re-analysis.');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="analysis-page loading">
        <Loader className="spin" size={48} />
        <p>Loading report data...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="analysis-page error">
        <h2>Oops!</h2>
        <p>{error || 'Report not found'}</p>
        <Link to="/dashboard" className="action-btn btn-primary mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  const isProcessing = report.status === 'processing';
  const findings = report.aiAnalysis?.findings || [];
  const riskLevel = report.aiAnalysis?.riskLevel || 'low';
  const riskScore = report.aiAnalysis?.riskScore || 0;
  const recommendations = report.aiAnalysis?.recommendations || [];

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

      {isProcessing ? (
        <div className="analysis-layout processing-layout">
          <div className="processing-card">
            <Loader className="spin text-blue" size={64} />
            <h2>Analyzing your report...</h2>
            <p>Our AI is currently processing your document. This may take a few moments.</p>
          </div>
        </div>
      ) : (
        <div className="analysis-layout">
          {/* LEFT COLUMN: REPORT DATA & INDICATORS */}
          <div className="data-column">
            
            {/* 2. SELECTED REPORT INFO */}
            <div className="report-meta-card">
              <div className="meta-header">
                <FileText size={24} className="text-blue" />
                <h2>{report.title}</h2>
              </div>
              <div className="meta-details">
                <div className="meta-item">
                  <Calendar size={16} /> <span>{new Date(report.reportDate || report.uploadDate).toLocaleDateString()}</span>
                </div>
                <div className="meta-item">
                  <Building size={16} /> <span>{report.labName || 'Unknown Lab'}</span>
                </div>
              </div>
              <div className="meta-status">
                <CheckCircle size={16} /> {report.status === 'analyzed' ? 'Analysis Completed' : report.status}
              </div>
            </div>

            {/* 3. KEY HEALTH INDICATORS */}
            <div className="indicators-section">
              <div className="section-title">
                <Activity size={20} />
                <h3>Key Health Indicators</h3>
              </div>
              
              <div className="indicators-list">
                {findings.length > 0 ? findings.map((ind, idx) => (
                  <div key={idx} className={`indicator-card status-${ind.status.toLowerCase()}`}>
                    <div className="ind-header">
                      <h4>{ind.parameter}</h4>
                      <span className="ind-badge">{ind.status}</span>
                    </div>
                    <div className="ind-body">
                      <div className="ind-value-box">
                        <span className="ind-value">{ind.value}</span>
                        <span className="ind-unit">{ind.unit}</span>
                        {ind.trend === 'up' && <TrendingUp size={18} className="trend-icon up" />}
                        {ind.trend === 'down' && <TrendingDown size={18} className="trend-icon down" />}
                      </div>
                      <div className="ind-range">Normal Range: {ind.normalRange}</div>
                    </div>
                  </div>
                )) : (
                  <p>No numeric metrics found in this report.</p>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: AI INSIGHTS & ACTIONS */}
          <div className="insights-column">
            
            {/* 5. RISK LEVEL INDICATOR */}
            <div className={`risk-level-card ${riskLevel}-risk`}>
              <div className="risk-header">
                <AlertTriangle size={28} />
                <div>
                  <span className="risk-label">Overall Risk Level</span>
                  <h2 className="risk-value" style={{ textTransform: 'capitalize' }}>
                    {riskLevel} Risk (Score: {riskScore})
                  </h2>
                </div>
              </div>
            </div>

            {/* 4. AI DIAGNOSIS / PREDICTION */}
            <div className="ai-brain-card">
              <div className="brain-header">
                <Brain size={24} className="brain-icon" />
                <h3>AI ML Summary</h3>
              </div>
              <div className="prediction-box">
                <p className="prediction-text">
                  {report.aiAnalysis?.summary || "No summary available."}
                </p>
              </div>
            </div>

            {/* 7. HIGHLIGHT ABNORMAL VALUES */}
            <div className="abnormal-alerts">
              {findings.filter(f => f.status === 'high' || f.status === 'critical').map((f, i) => (
                <div key={i} className="alert-item critical">
                  <AlertTriangle size={18} />
                  <span><strong>High {f.parameter}:</strong> {f.value} {f.unit} (Normal is {f.normalRange})</span>
                </div>
              ))}
              {findings.filter(f => f.status === 'low').map((f, i) => (
                <div key={i} className="alert-item warning">
                  <ShieldAlert size={18} />
                  <span><strong>Low {f.parameter}:</strong> {f.value} {f.unit} (Normal is {f.normalRange})</span>
                </div>
              ))}
            </div>

            {/* 6. RECOMMENDATIONS SECTION */}
            <div className="recommendations-card">
              <h3>Recommended Next Steps</h3>
              
              <div className="rec-group">
                <div className="rec-title">
                  <HeartPulse size={18} className="text-green" /> Lifestyle Advice
                </div>
                <ul>
                  {recommendations.length > 0 ? (
                    recommendations.map((r, idx) => <li key={idx}>{r}</li>)
                  ) : (
                    <li>Maintain a healthy lifestyle and routine checkups.</li>
                  )}
                </ul>
              </div>

              <div className="rec-group">
                <div className="rec-title">
                  <Stethoscope size={18} className="text-blue" /> Doctor Suggestion
                </div>
                <p className="doc-sugg-text">
                  If you have concerns, please consult a physician to review these results.
                </p>
              </div>
            </div>

            {/* 9. ACTION BUTTONS */}
            <div className="action-buttons-grid">
              <Link to="/appointments" className="action-btn btn-primary">
                <Calendar size={18} /> Book Appointment
              </Link>
              <a href={reportAPI.getFileUrl(id)} target="_blank" rel="noopener noreferrer" className="action-btn btn-secondary">
                <Download size={18} /> Download Report
              </a>
              <button 
                className="action-btn btn-outline" 
                onClick={handleReanalyze}
                disabled={reanalyzing}
              >
                <RefreshCw size={18} className={reanalyzing ? 'spin' : ''} /> {reanalyzing ? 'Re-analyzing...' : 'Re-analyze'}
              </button>
              <Link to="/dashboard" className="action-btn btn-text">
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default ReportAnalysis;