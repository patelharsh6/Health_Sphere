import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, FileText, Trash2, RefreshCw, 
  Bot, ShieldCheck, CheckCircle, ChevronLeft,
  Calendar, User, Building, File, Loader
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../services/api';
import './ReportUpload.css';

const ReportUpload = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [recentUploads, setRecentUploads] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    reportName: '',
    doctorName: '',
    reportDate: new Date().toISOString().split('T')[0],
    hospitalName: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchRecentReports();
  }, [isAuthenticated, authLoading]);

  const fetchRecentReports = async () => {
    try {
      const res = await reportAPI.getMyReports({ limit: 5 });
      if (res.data.success) {
        setRecentUploads(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a PDF, JPG, or PNG file.');
      return;
    }
    
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
    setFormData(prev => ({ ...prev, reportName: nameWithoutExt }));
    
    setFile(selectedFile);
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  const removeFile = () => {
    setFile(null);
    setUploadSuccess(false);
    setFormData({ ...formData, reportName: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (withAI = false) => {
    if (!file) return;
    if (!formData.reportName) {
      alert("Please enter a report name.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.reportName);
      uploadData.append('type', 'other');

      const res = await reportAPI.upload(uploadData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.data.success) {
        setTimeout(() => {
          setIsUploading(false);
          setUploadSuccess(true);
          // Refresh recent uploads
          fetchRecentReports();
          // Reset form
          setFile(null);
          setUploadProgress(0);
        }, 500);
      }
    } catch (error) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Upload failed. Please try again.');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="upload-page">
      
      {/* 1. HEADER SECTION */}
      <header className="upload-header">
        <div className="header-container">
          <Link to="/dashboard" className="back-link">
            <ChevronLeft size={20} /> Back to Dashboard
          </Link>
          <div className="header-titles">
            <h1>Upload Medical Report</h1>
            <p>Upload your reports for secure storage and AI-based analysis.</p>
          </div>
        </div>
      </header>

      <div className="upload-layout">
        
        {/* LEFT COLUMN: UPLOAD & FORM */}
        <main className="upload-main-area">
          
          {/* UPLOAD AREA */}
          {!file && !uploadSuccess && (
            <div 
              className={`drag-drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".pdf, .jpg, .jpeg, .png" 
                hidden 
              />
              <div className="upload-icon-circle">
                <UploadCloud size={40} />
              </div>
              <h3>Drag & Drop your report here</h3>
              <p>OR <span className="browse-text">Click to browse files</span></p>
              <span className="supported-formats">Supported: PDF, JPG, PNG (Max: 10MB)</span>
            </div>
          )}

          {/* FILE PREVIEW & FORM */}
          {file && !uploadSuccess && (
            <div className="file-prep-section">
              
              <div className="file-preview-card">
                <div className="file-info">
                  <div className="file-type-icon">
                    {file.type.includes('pdf') ? <FileText size={24} /> : <File size={24} />}
                  </div>
                  <div className="file-details">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="file-actions">
                  <button className="icon-btn-text" onClick={() => fileInputRef.current.click()}>
                    <RefreshCw size={16} /> Replace
                  </button>
                  <button className="icon-btn-text danger" onClick={removeFile}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="upload-progress-container">
                  <div className="progress-header">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* Metadata Form */}
              {!isUploading && (
                <div className="report-details-form">
                  <h3>Report Details</h3>
                  
                  <div className="input-group">
                    <label>Report Name *</label>
                    <input 
                      type="text" 
                      value={formData.reportName} 
                      onChange={(e) => setFormData({...formData, reportName: e.target.value})}
                      placeholder="e.g. Blood Test, Chest X-Ray"
                    />
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>Date of Report</label>
                      <div className="input-with-icon">
                        <Calendar size={16} />
                        <input 
                          type="date" 
                          value={formData.reportDate}
                          onChange={(e) => setFormData({...formData, reportDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Doctor Name (Optional)</label>
                      <div className="input-with-icon">
                        <User size={16} />
                        <input 
                          type="text" 
                          placeholder="e.g. Dr. Sharma"
                          value={formData.doctorName}
                          onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Hospital / Lab Name (Optional)</label>
                    <div className="input-with-icon">
                      <Building size={16} />
                      <input 
                        type="text" 
                        placeholder="e.g. City Path Labs"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD ACTION BUTTONS */}
              {!isUploading && (
                <div className="upload-actions">
                  <button className="btn-secondary" onClick={() => handleUpload(false)}>
                    <UploadCloud size={18} /> Secure Upload
                  </button>
                  <button className="btn-primary-ai" onClick={() => handleUpload(true)}>
                    <Bot size={18} /> Upload & Analyze with AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS STATE */}
          {uploadSuccess && (
            <div className="success-state">
              <CheckCircle size={60} className="success-icon" />
              <h2>Report Uploaded Successfully!</h2>
              <p>Your medical record has been securely stored.</p>
              <button className="btn-outline" onClick={() => setUploadSuccess(false)}>
                Upload Another Report
              </button>
            </div>
          )}

          {/* SECURITY NOTE */}
          <div className="security-note">
            <ShieldCheck size={18} className="shield-icon" />
            <p><strong>Bank-Grade Security:</strong> Your medical data is encrypted, securely stored, and strictly private.</p>
          </div>

        </main>

        {/* RIGHT COLUMN: RECENT UPLOADS */}
        <aside className="recent-uploads-sidebar">
          <div className="sidebar-header">
            <h3>Recent Uploads</h3>
          </div>
          
          <div className="recent-list">
            {loadingReports ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : recentUploads.length > 0 ? (
              recentUploads.map(report => (
                <div key={report._id} className="recent-report-card">
                  <div className="recent-icon">
                    <FileText size={20} />
                  </div>
                  <div className="recent-details">
                    <h4>{report.title}</h4>
                    <div className="recent-meta">
                      <span>{formatDate(report.uploadDate)}</span>
                      <span className={`status-dot ${report.aiAnalysis?.summary ? 'analyzed' : 'pending'}`}>
                        {report.aiAnalysis?.summary ? 'Analyzed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="recent-actions">
                    {!report.aiAnalysis?.summary && (
                      <button className="action-btn ai-btn" title="Analyze with AI"><Bot size={16} /></button>
                    )}
                    <button className="action-btn delete-btn" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                <p>No reports uploaded yet</p>
              </div>
            )}
          </div>
          
          <Link to="/dashboard" className="view-all-link">View all in Dashboard</Link>
        </aside>

      </div>
    </div>
  );
};

export default ReportUpload;