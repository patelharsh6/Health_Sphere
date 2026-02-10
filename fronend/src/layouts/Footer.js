import React, { useState } from 'react';
import { 
  Facebook, Twitter, Instagram, Linkedin, 
  ChevronDown, ChevronUp, Mail, Phone, MapPin, 
  ShieldCheck, Activity 
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  // State for Mobile Accordion
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Footer Data Structure
  const footerSections = [
    {
      title: "Health Knowledge",
      links: [
        { name: "Disease Encyclopedia", href: "/diseases" },
        { name: "Medicine Store", href: "/medicines" },
        { name: "Symptom Checker", href: "/symptoms" },
        { name: "Health Blog", href: "/blog" }
      ]
    },
    {
      title: "Services",
      links: [
        { name: "Book Appointment", href: "/appointments" },
        { name: "Lab Reports", href: "/reports" },
        { name: "AI Health Assistant", href: "/ai-assistant" },
        { name: "Doctor Portal", href: "/doctor-login" }
      ]
    },
    {
      title: "Platform & Support",
      links: [
        { name: "About HealthSphere", href: "/about" },
        { name: "How It Works", href: "/how-it-works" },
        { name: "FAQs", href: "/faqs" },
        { name: "Contact Support", href: "/contact" }
      ]
    },
    {
      title: "Legal & Ethics",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms & Conditions", href: "/terms" },
        { name: "AI Disclaimer", href: "/ai-policy" },
        { name: "Medical Disclaimer", href: "/medical-policy" }
      ]
    }
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* TOP SECTION: BRAND & MISSION */}
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo">
              <Activity size={24} />
              <span>HealthSphere</span>
            </div>
            <p className="mission-text">
              An intelligent digital healthcare ecosystem connecting patients, doctors, and hospitals.
            </p>
            <div className="trust-badge">
              <ShieldCheck size={16} />
              <span>AI-Assisted, Doctor-Guided</span>
            </div>
            
            <div className="social-links">
              <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
            </div>
          </div>

          {/* DYNAMIC SECTIONS (Grid on Desktop, Accordion on Mobile) */}
          <div className="footer-links-wrapper">
            {footerSections.map((section, index) => (
              <div key={index} className={`footer-column ${openSection === section.title ? 'open' : ''}`}>
                
                {/* Header: Clickable on Mobile */}
                <div 
                  className="column-header" 
                  onClick={() => toggleSection(section.title)}
                >
                  <h3>{section.title}</h3>
                  <span className="accordion-icon">
                    {openSection === section.title ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {/* Links List */}
                <ul className="link-list">
                  {section.links.map((link, idx) => (
                    <li key={idx}>
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE SECTION: CONTACT & ALERTS */}
        <div className="footer-middle">
          <div className="contact-row">
            <div className="contact-item">
              <Mail size={16} /> support@healthsphere.com
            </div>
            <div className="contact-item">
              <Phone size={16} /> +91 98765 43210
            </div>
            <div className="contact-item">
              <MapPin size={16} /> Ahmedabad, Gujarat, India
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: DISCLAIMER & COPYRIGHT */}
        <div className="footer-bottom">
          <div className="disclaimer-box">
            <strong>Medical Disclaimer:</strong> HealthSphere does not provide medical advice, diagnosis, or treatment. The AI Assistant is for informational purposes only. Always seek the advice of your physician.
          </div>
          
          <div className="copyright-row">
            <p>&copy; 2026 HealthSphere. All rights reserved.</p>
            <div className="bottom-links">
              <span>English (India)</span>
              <span>•</span>
              <span>Sitemap</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;