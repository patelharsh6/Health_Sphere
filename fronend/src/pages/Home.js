import React from 'react';
import { 
  Activity, Calendar, FileText, Bot, 
  Stethoscope, ShieldCheck, ArrowRight, 
  CheckCircle, AlertTriangle, User, 
  Search, Pill 
} from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      
      {/* 1. HERO SECTION */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Activity size={16} /> 
              <span>v1.0 Live Beta</span>
            </div>
            <h1>Your Complete Digital Healthcare Ecosystem</h1>
            <p className="hero-subtext">
              AI-assisted insights. Doctor-guided decisions. Secure medical management. 
              Experience the future of healthcare today.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">
                <Activity size={20} /> Check Symptoms
              </button>
              <button className="btn-secondary">
                <Calendar size={20} /> Book Appointment
              </button>
            </div>
          </div>
          
          {/* Visual Representation (Abstract Medical UI) */}
          <div className="hero-visual">
            <div className="visual-card main-card">
              <div className="card-header">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
              </div>
              <div className="card-body">
                <div className="mock-row">
                  <Bot size={24} className="text-teal" />
                  <div className="mock-line long"></div>
                </div>
                <div className="mock-graph">
                  <div className="bar" style={{height: '40%'}}></div>
                  <div className="bar" style={{height: '70%'}}></div>
                  <div className="bar active" style={{height: '55%'}}></div>
                  <div className="bar" style={{height: '80%'}}></div>
                </div>
                <div className="mock-alert">
                  <CheckCircle size={16} /> Health Status: Good
                </div>
              </div>
            </div>
            {/* Floating Elements */}
            <div className="float-card float-1">
              <Stethoscope size={20} /> 
              <span>Doctor Connected</span>
            </div>
            <div className="float-card float-2">
              <ShieldCheck size={20} /> 
              <span>Data Encrypted</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. QUICK ACCESS CARDS */}
      <section className="section-padding quick-access">
        <div className="section-header">
          <h2>What would you like to do?</h2>
          <p>Fast access to essential health services</p>
        </div>
        
        <div className="cards-grid">
          <div className="feature-card">
            <div className="icon-box teal"><Stethoscope size={24} /></div>
            <h3>Symptom Checker</h3>
            <p>Analyze symptoms with AI precision.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box blue"><Calendar size={24} /></div>
            <h3>Book Appointment</h3>
            <p>Find doctors near you instantly.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box purple"><FileText size={24} /></div>
            <h3>Lab Reports</h3>
            <p>Upload & analyze medical records.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box green"><Bot size={24} /></div>
            <h3>AI Assistant</h3>
            <p>24/7 health guidance & tips.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box orange"><Search size={24} /></div>
            <h3>Explore Diseases</h3>
            <p>Comprehensive medical encyclopedia.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box red"><Pill size={24} /></div>
            <h3>Medicine Info</h3>
            <p>Dosage, side effects & uses.</p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Flow) */}
      <section className="section-padding flow-section">
        <div className="section-header">
          <h2>How HealthSphere Works</h2>
          <p>Your journey from symptoms to solutions</p>
        </div>
        
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Enter Symptoms</h3>
            <p>Describe what you're feeling.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>AI Analysis</h3>
            <p>Get instant preliminary insights.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Consult Doctor</h3>
            <p>Connect with a specialist.</p>
          </div>
          <div className="step-connector"></div>
          <div className="step-item">
            <div className="step-number">4</div>
            <h3>Get Better</h3>
            <p>Track recovery & reports.</p>
          </div>
        </div>
      </section>

      {/* 4. AI ADVANTAGE (VIVA POINT) */}
      <section className="section-padding ai-section">
        <div className="ai-container">
          <div className="ai-content">
            <div className="ai-badge">ETHICAL AI</div>
            <h2>AI Powered. Doctor Controlled.</h2>
            <p>
              HealthSphere uses advanced machine learning to assist healthcare professionals, 
              not replace them. Our AI provides insights, but the final diagnosis 
              always rests with a certified doctor.
            </p>
            <ul className="ai-list">
              <li><CheckCircle size={16} /> Symptom Analysis Assistance</li>
              <li><CheckCircle size={16} /> Risk Pattern Detection</li>
              <li><AlertTriangle size={16} /> <strong>Not a replacement for emergency care</strong></li>
            </ul>
          </div>
          <div className="ai-visual">
            <Bot size={120} className="ai-bot-icon" />
          </div>
        </div>
      </section>

      {/* 5. TRUST & SECURITY */}
      <section className="section-padding trust-section">
        <div className="trust-grid">
          <div className="trust-item">
            <ShieldCheck size={32} />
            <h3>Bank-Grade Security</h3>
            <p>256-bit encryption for all medical data.</p>
          </div>
          <div className="trust-item">
            <User size={32} />
            <h3>Privacy First</h3>
            <p>You control who sees your health records.</p>
          </div>
          <div className="trust-item">
            <Activity size={32} />
            <h3>Verified Doctors</h3>
            <p>100% certified medical professionals.</p>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Take control of your health today.</h2>
          <p>Join thousands of users making smarter health decisions.</p>
          <div className="cta-buttons">
            <button className="btn-white">Create Free Account</button>
            <button className="btn-outline">Explore Features</button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;