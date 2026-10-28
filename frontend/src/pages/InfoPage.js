import React, { useState } from 'react';
import { 
  ShieldCheck, Activity, Stethoscope, Heart, 
  HelpCircle, Mail, Phone, MapPin, AlertTriangle, 
  CheckCircle, FileText, ChevronDown, ChevronUp, Bot,
  Send, Clock, Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import './InfoPage.css';

const InfoPage = () => {
  const location = useLocation();
  const path = location.pathname.replace(/^\//, '');

  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  // Contact form state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Please fill out all required fields.');
      return;
    }
    setContactSubmitted(true);
  };

  const renderContent = () => {
    switch (path) {
      case 'about':
        return (
          <div className="info-section">
            <div className="info-hero-banner">
              <span className="info-badge"><Activity size={16} /> About HealthSphere</span>
              <h1>Empowering Patients, Supporting Doctors</h1>
              <p>HealthSphere is an intelligent digital healthcare ecosystem that bridges the gap between preliminary symptom awareness, medical data management, and licensed clinical consultations.</p>
            </div>

            <div className="info-grid-3">
              <div className="info-card">
                <div className="info-icon-box teal"><ShieldCheck size={28} /></div>
                <h3>Bank-Grade Security</h3>
                <p>Protected Health Information (PHI) is encrypted at rest using AES-256 and transmitted with TLS 1.3 encryption.</p>
              </div>
              <div className="info-card">
                <div className="info-icon-box blue"><Bot size={28} /></div>
                <h3>Ethical AI Assistance</h3>
                <p>Our algorithms provide preliminary symptom classification and automated lab marker extraction — always supervised by human physicians.</p>
              </div>
              <div className="info-card">
                <div className="info-icon-box green"><Stethoscope size={28} /></div>
                <h3>Verified Medical Staff</h3>
                <p>Every medical practitioner undergoes manual credential and medical license verification prior to accepting bookings.</p>
              </div>
            </div>

            <div className="info-text-block">
              <h2>Our Core Pillars</h2>
              <p>Founded to make reliable healthcare information and doctor discovery accessible to everyone, HealthSphere combines modern medical databases with intelligent conversational tools to ensure nobody feels alone during a health concern.</p>
              <div className="cta-banner">
                <div>
                  <h3>Ready to take charge of your health?</h3>
                  <p>Explore our symptom checker or book an appointment with a top specialist today.</p>
                </div>
                <Link to="/appointments" className="info-cta-btn">Find a Doctor</Link>
              </div>
            </div>
          </div>
        );

      case 'how-it-works':
        return (
          <div className="info-section">
            <div className="info-hero-banner">
              <span className="info-badge"><Sparkles size={16} /> The HealthSphere Journey</span>
              <h1>How HealthSphere Works</h1>
              <p>From initial symptom detection to clinical consultations and digital report tracking — here is how your journey unfolds.</p>
            </div>

            <div className="steps-timeline">
              <div className="timeline-item">
                <div className="timeline-badge">1</div>
                <div className="timeline-content">
                  <h3>Check Symptoms or Ask AI</h3>
                  <p>Describe your discomfort in our Symptom Checker or chat directly with our AI Assistant to understand possible risk levels and which medical specialty handles your condition.</p>
                  <Link to="/symptoms" className="timeline-link">Try Symptom Checker →</Link>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-badge">2</div>
                <div className="timeline-content">
                  <h3>Browse Certified Specialists</h3>
                  <p>Explore doctor directories filtered by specialization, clinic location, experience, and patient ratings. Select a doctor whose schedule fits yours.</p>
                  <Link to="/doctors" className="timeline-link">Browse Doctors →</Link>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-badge">3</div>
                <div className="timeline-content">
                  <h3>Upload & Analyze Lab Reports</h3>
                  <p>Upload PDF or image copies of your blood tests, metabolic panels, or X-rays. HealthSphere parses the reference ranges, highlights abnormal parameters, and visualizes trends over time.</p>
                  <Link to="/upload" className="timeline-link">Upload Report →</Link>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-badge">4</div>
                <div className="timeline-content">
                  <h3>Consult & Follow Up</h3>
                  <p>Attend your appointment, receive digital treatment guidance and prescriptions, and review your health journey anytime through your patient dashboard.</p>
                  <Link to="/dashboard" className="timeline-link">View Dashboard →</Link>
                </div>
              </div>
            </div>
          </div>
        );

      case 'faqs':
        const faqs = [
          { q: "Is HealthSphere's AI a replacement for a doctor?", a: "No. HealthSphere AI is strictly an educational and triaging tool designed to help you organize symptoms and understand medical terminology. It does not provide formal diagnoses or write prescriptions; final medical authority always rests with certified clinicians." },
          { q: "Who can see my uploaded medical reports?", a: "Your reports are private to your account. Only doctors with whom you have booked an active appointment or explicitly granted access can review your uploaded medical records." },
          { q: "How are doctors verified on HealthSphere?", a: "Every registering doctor must provide their state medical license number and clinical credentials. Our administrative team verifies these against public medical council registries before the doctor can receive appointments." },
          { q: "What should I do in a medical emergency?", a: "If you or someone near you is experiencing severe symptoms such as chest pain, severe shortness of breath, sudden numbness, or heavy bleeding, call your local emergency services (e.g. 911 / 112 / 108) immediately. HealthSphere is not designed for acute emergencies." },
          { q: "Is HealthSphere free to use?", a: "Creating an account, checking symptoms, using the AI assistant, and storing personal medical reports is completely free. Consultation fees are set directly by individual doctors for scheduled clinical appointments." },
          { q: "Can I delete my account and data?", a: "Yes. In accordance with data privacy regulations, you can update, download, or request full deletion of your medical records and account credentials through your Profile page or by contacting our support team." }
        ];
        return (
          <div className="info-section">
            <div className="info-hero-banner">
              <span className="info-badge"><HelpCircle size={16} /> Frequently Asked Questions</span>
              <h1>Answers to Common Questions</h1>
              <p>Everything you need to know about HealthSphere, our security standards, and AI assistance.</p>
            </div>

            <div className="faq-list">
              {faqs.map((faq, idx) => (
                <div key={idx} className={`faq-card ${openFaq === idx ? 'open' : ''}`} onClick={() => toggleFaq(idx)}>
                  <div className="faq-question">
                    <h3>{faq.q}</h3>
                    <button className="faq-toggle" aria-label="Toggle answer">
                      {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                  {openFaq === idx && <p className="faq-answer">{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="info-section">
            <div className="info-hero-banner">
              <span className="info-badge"><Mail size={16} /> Support & Inquiries</span>
              <h1>Contact the HealthSphere Team</h1>
              <p>Have questions, feedback, or need technical assistance? We are here to help.</p>
            </div>

            <div className="contact-grid">
              <div className="contact-info-panel">
                <h3>Get in Touch</h3>
                <p>Our support team responds within 24 hours during standard business days.</p>
                
                <div className="contact-channel">
                  <Mail className="channel-icon" size={20} />
                  <div>
                    <strong>Email Support</strong>
                    <p>support@healthsphere.com</p>
                  </div>
                </div>

                <div className="contact-channel">
                  <Phone className="channel-icon" size={20} />
                  <div>
                    <strong>Helpline (Toll-Free)</strong>
                    <p>+1 (800) 555-HEALTH / +91 1800 123 4567</p>
                  </div>
                </div>

                <div className="contact-channel">
                  <MapPin className="channel-icon" size={20} />
                  <div>
                    <strong>Headquarters</strong>
                    <p>HealthSphere Medical Tech, Innovation Hub, Tech City</p>
                  </div>
                </div>

                <div className="contact-alert">
                  <AlertTriangle size={20} />
                  <span><strong>Emergency Notice:</strong> For immediate, life-threatening medical emergencies, please dial your local emergency phone number immediately.</span>
                </div>
              </div>

              <div className="contact-form-panel">
                {contactSubmitted ? (
                  <div className="contact-success">
                    <CheckCircle size={48} className="text-green mb-3" />
                    <h3>Message Sent Successfully!</h3>
                    <p>Thank you for reaching out, {contactForm.name}. A representative has received your ticket and will follow up shortly at {contactForm.email}.</p>
                    <button className="btn-primary mt-3" onClick={() => setContactSubmitted(false)}>Send Another Message</button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit}>
                    <h3>Send a Direct Message</h3>
                    <div className="form-group">
                      <label>Your Name *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="John Doe" 
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        placeholder="john@example.com" 
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subject</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Appointment assistance, feedback" 
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Message *</label>
                      <textarea 
                        rows={4} 
                        required 
                        placeholder="How can we assist you today?" 
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="info-cta-btn"><Send size={16} /> Send Message</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="info-section legal-section">
            <div className="info-hero-banner">
              <span className="info-badge"><ShieldCheck size={16} /> Privacy & Data Protection</span>
              <h1>Privacy Policy</h1>
              <p>Last updated: October 2026. Your health data privacy is our highest priority.</p>
            </div>
            <div className="legal-content">
              <h2>1. Information We Collect</h2>
              <p>We collect personal information necessary to deliver clinical scheduling and record services, including name, email, phone number, date of birth, gender, and voluntary medical reports that you upload.</p>

              <h2>2. How Your Health Data is Used</h2>
              <p>Medical documents and symptoms provided are utilized exclusively to calculate health summaries, parse laboratory values, and facilitate consultations with doctors you engage with. We do not sell or monetize personal medical data to advertisers or insurers.</p>

              <h2>3. Encryption & Storage</h2>
              <p>All sensitive information is secured using industry-standard TLS in transit and AES-256 at rest. File attachments are stored in isolated cloud buckets with strict per-user authorization checks.</p>

              <h2>4. User Rights</h2>
              <p>You retain full ownership of your medical history. You may inspect, download, rectify, or request permanent erasure of your personal records at any time through your account settings.</p>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="info-section legal-section">
            <div className="info-hero-banner">
              <span className="info-badge"><FileText size={16} /> Terms of Service</span>
              <h1>Terms & Conditions</h1>
              <p>Effective date: October 2026. Please review our platform usage terms.</p>
            </div>
            <div className="legal-content">
              <h2>1. Agreement to Terms</h2>
              <p>By creating an account or utilizing HealthSphere, you agree to comply with these Terms of Service. If you do not agree, please refrain from using the platform.</p>

              <h2>2. User Accounts</h2>
              <p>Users must provide accurate, current, and truthful information during registration. You are responsible for safeguarding your credentials and notifying us immediately of unauthorized access.</p>

              <h2>3. Appointment Bookings & Payments</h2>
              <p>Patients agree to arrive on time for scheduled consultations. Doctors agree to maintain professional medical standards and provide reasonable notice in the event of rescheduling.</p>

              <h2>4. Limitation of Liability</h2>
              <p>HealthSphere provides a digital connectivity and informational platform. HealthSphere is not liable for clinical diagnoses or treatments rendered by independent medical professionals using the platform.</p>
            </div>
          </div>
        );

      case 'ai-policy':
        return (
          <div className="info-section legal-section">
            <div className="info-hero-banner">
              <span className="info-badge"><Bot size={16} /> AI Transparency & Ethics</span>
              <h1>AI Assistant & Analysis Policy</h1>
              <p>HealthSphere's principles on ethical artificial intelligence in healthcare.</p>
            </div>
            <div className="legal-content">
              <h2>1. Doctor-Guided, Not Doctor-Replacing</h2>
              <p>Our algorithms are engineered to support healthcare decision-making, not supplant it. AI models summarize potential conditions and extract lab values to make your medical consultation more efficient and informed.</p>

              <h2>2. Training & Medical Knowledge</h2>
              <p>Our symptom analysis models draw upon peer-reviewed medical catalogs, standard clinical reference ranges, and verified pharmaceutical compendiums.</p>

              <h2>3. Strict Disclaimers</h2>
              <p>AI predictions should never be used as a substitute for certified medical examination, diagnosis, or treatment. Always verify all findings with your physician.</p>
            </div>
          </div>
        );

      case 'medical-policy':
        return (
          <div className="info-section legal-section">
            <div className="info-hero-banner">
              <span className="info-badge"><AlertTriangle size={16} /> Clinical Notice</span>
              <h1>Medical Disclaimer</h1>
              <p>Important safety guidelines and legal disclosures.</p>
            </div>
            <div className="legal-content">
              <div className="emergency-box">
                <AlertTriangle size={24} color="#ef4444" />
                <div>
                  <strong>NOT FOR EMERGENCIES</strong>
                  <p>If you believe you are experiencing a medical emergency, do not wait for online replies. Immediately contact your local emergency number or proceed to the nearest hospital emergency department.</p>
                </div>
              </div>
              <h2>Informational Nature of Content</h2>
              <p>The information on HealthSphere (including text, graphics, symptom checkers, and medicine guides) is provided for informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.</p>
              <h2>Prescription Requirements</h2>
              <p>Certain medications cataloged on this site require a valid prescription from a registered medical practitioner. HealthSphere does not dispense controlled prescription pharmaceuticals without valid clinical authorization.</p>
            </div>
          </div>
        );

      case 'blog':
      default:
        return (
          <div className="info-section">
            <div className="info-hero-banner">
              <span className="info-badge"><Heart size={16} /> Health & Wellness Blog</span>
              <h1>Articles & Health Insights</h1>
              <p>Evidence-based articles on preventative care, nutrition, and modern health management.</p>
            </div>

            <div className="blog-grid">
              <div className="blog-card">
                <div className="blog-category">Preventative Care</div>
                <h3>Understanding Your Complete Blood Count (CBC)</h3>
                <p>Learn what red blood cells, white blood cells, and platelets indicate about your overall wellness and immune defense.</p>
                <div className="blog-meta">5 min read • By Dr. Sneha Patel</div>
              </div>

              <div className="blog-card">
                <div className="blog-category">Endocrinology</div>
                <h3>Living Well with Type 2 Diabetes</h3>
                <p>Practical strategies for monitoring HbA1c levels, balancing glycemic load, and collaborating effectively with your endocrinologist.</p>
                <div className="blog-meta">7 min read • By Dr. Meera Nair</div>
              </div>

              <div className="blog-card">
                <div className="blog-category">Cardiology</div>
                <h3>Blood Pressure: The Silent Cardiovascular Indicator</h3>
                <p>Why regular blood pressure checks are essential and how lifestyle adjustments support optimal cardiovascular performance.</p>
                <div className="blog-meta">4 min read • By Dr. Rahul Sharma</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="info-page-container">
      <div className="info-page-nav-crumbs">
        <Link to="/">Home</Link> / <span>{path.replace('-', ' ').toUpperCase()}</span>
      </div>
      {renderContent()}
    </div>
  );
};

export default InfoPage;
