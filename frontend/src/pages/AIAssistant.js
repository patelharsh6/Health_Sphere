import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Trash2,
  Sparkles,
  Search,
  Copy,
  Check,
  Plus,
  ShieldAlert,
  ChevronRight,
  Activity,
  Pill,
  FileText,
  Stethoscope,
  X,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import './AIAssistant.css';

// Markdown and Rich Text Formatter Component
const FormattedMessage = ({ text, isEmergency }) => {
  if (!text) return null;

  // Split lines
  const lines = text.split('\n');
  const renderedElements = [];
  let inList = false;
  let listItems = [];
  let inNumberedList = false;
  let numberedItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`} className="chat-markdown-ul">
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
    if (numberedItems.length > 0) {
      renderedElements.push(
        <ol key={`ol-${renderedElements.length}`} className="chat-markdown-ol">
          {numberedItems.map((item, idx) => (
            <li key={idx}>{parseInlineFormatting(item)}</li>
          ))}
        </ol>
      );
      numberedItems = [];
      inNumberedList = false;
    }
  };

  const parseInlineFormatting = (str) => {
    if (!str) return '';
    
    // Regular expression for bold (**text**), italics (*text* or _text_), inline code (`code`), and markdown links [text](url)
    const tokens = [];
    let remaining = str;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Bold match: **text**
      const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)$/);
      // Italic match: *text* or _text_
      const italicMatch = remaining.match(/^(.*?)(?:\*|_)(.*?)(?:\*|_)(.*)$/);
      // Link match: [text](url)
      const linkMatch = remaining.match(/^(.*?)\[(.*?)\]\((.*?)\)(.*)$/);

      if (boldMatch && (!italicMatch || boldMatch[1].length <= italicMatch[1].length)) {
        if (boldMatch[1]) tokens.push(<span key={keyIdx++}>{boldMatch[1]}</span>);
        tokens.push(<strong key={keyIdx++} className="chat-bold">{boldMatch[2]}</strong>);
        remaining = boldMatch[3];
      } else if (italicMatch) {
        if (italicMatch[1]) tokens.push(<span key={keyIdx++}>{italicMatch[1]}</span>);
        tokens.push(<em key={keyIdx++} className="chat-italic">{italicMatch[2]}</em>);
        remaining = italicMatch[3];
      } else if (linkMatch) {
        if (linkMatch[1]) tokens.push(<span key={keyIdx++}>{linkMatch[1]}</span>);
        tokens.push(
          <a key={keyIdx++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" className="chat-link">
            {linkMatch[2]}
          </a>
        );
        remaining = linkMatch[4];
      } else {
        tokens.push(<span key={keyIdx++}>{remaining}</span>);
        break;
      }
    }

    return tokens;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      renderedElements.push(<div key={`spacer-${index}`} className="chat-spacer" />);
      return;
    }

    // Bullet point list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      if (inNumberedList) flushList();
      inList = true;
      listItems.push(content);
      return;
    }

    // Numbered list item: "1. ", "2. "
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (inList) flushList();
      inNumberedList = true;
      numberedItems.push(numMatch[2]);
      return;
    }

    // Heading: "### Heading" or "## Heading"
    if (trimmed.startsWith('### ')) {
      flushList();
      renderedElements.push(
        <h4 key={`h4-${index}`} className="chat-heading-h4">
          {parseInlineFormatting(trimmed.substring(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      renderedElements.push(
        <h3 key={`h3-${index}`} className="chat-heading-h3">
          {parseInlineFormatting(trimmed.substring(3))}
        </h3>
      );
      return;
    }

    // Disclaimer block detection
    if (trimmed.startsWith('_Disclaimer:') || trimmed.startsWith('Disclaimer:')) {
      flushList();
      renderedElements.push(
        <div key={`disclaimer-${index}`} className="chat-inline-disclaimer">
          <AlertCircle size={13} />
          <span>{parseInlineFormatting(trimmed.replace(/^_|_$/g, ''))}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    flushList();
    renderedElements.push(
      <p key={`p-${index}`} className="chat-paragraph">
        {parseInlineFormatting(line)}
      </p>
    );
  });

  flushList();

  return (
    <div className={`formatted-message-body ${isEmergency ? 'emergency-content' : ''}`}>
      {renderedElements}
    </div>
  );
};

const STARTER_PROMPTS = [
  {
    icon: <Activity size={18} />,
    title: 'Analyze Symptoms',
    text: 'I have a mild fever with a headache and body ache since yesterday',
    category: 'Symptom Check'
  },
  {
    icon: <Pill size={18} />,
    title: 'Medicine Information',
    text: 'What are the uses, dosage, and side effects of Paracetamol?',
    category: 'Medication'
  },
  {
    icon: <FileText size={18} />,
    title: 'Report Guidance',
    text: 'How do I interpret high triglycerides in a blood lipid report?',
    category: 'Lab Reports'
  },
  {
    icon: <Stethoscope size={18} />,
    title: 'Doctor Specialist',
    text: 'Which specialist doctor should I consult for sharp lower back pain?',
    category: 'Consultation'
  }
];

const AIAssistant = () => {
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionSearch, setSessionSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      id: 'default',
      sender: 'ai',
      text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! I am your HealthSphere AI Assistant.\n\nI can help you understand symptoms, look up medicines, guide your appointment bookings, and explain medical reports.\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Check symptoms for seasonal flu',
        'Information on Amoxicillin dosage',
        'How to upload my lab report',
        'Book an appointment with a Cardiologist'
      ]
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping]);

  const loadSessions = async () => {
    try {
      const res = await aiAPI.getSessions();
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const loadSingleSession = async (id) => {
    try {
      const res = await aiAPI.getSession(id);
      if (res.data.success) {
        setCurrentSessionId(id);
        const history = res.data.data.messages.map((m, i) => ({
          id: i,
          sender: m.sender,
          text: m.text,
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
        }));
        if (history.length > 0) {
          setMessages(history);
        }
        setSidebarOpen(false); // Auto close sidebar on mobile selection
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line
  }, []);

  const handleSendMessage = async (textToSend = null) => {
    const text = typeof textToSend === 'string' ? textToSend : inputMessage;
    if (!text.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await aiAPI.chat({
        message: userMsg.text,
        sessionId: currentSessionId
      });

      if (res.data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: res.data.reply,
            suggestions: res.data.suggestions || [],
            isEmergency: res.data.isEmergency || false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        
        if (!currentSessionId && res.data.sessionId) {
          setCurrentSessionId(res.data.sessionId);
          loadSessions();
        }
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      {
        id: 'default',
        sender: 'ai',
        text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! I am your HealthSphere AI Assistant.\n\nStart a new conversation or choose one of the recommended topics below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Check symptoms for seasonal flu',
          'Information on Amoxicillin dosage',
          'How to upload my lab report',
          'Book an appointment with a Cardiologist'
        ]
      }
    ]);
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await aiAPI.deleteSession(id);
      if (id === currentSessionId) {
        startNewChat();
      }
      loadSessions();
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSessions = sessions.filter(s =>
    (s.title || 'Conversation').toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const isConversationEmpty = messages.length <= 1;

  return (
    <div className="ai-chat-page">
      <div className="chat-layout">
        
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div className="chat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar for Sessions */}
        <aside className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-top">
            <div className="sidebar-header">
              <div className="sidebar-title-row">
                <div className="sidebar-title-badge">
                  <MessageSquare size={16} />
                  <span>Conversations</span>
                </div>
                {sessions.length > 0 && (
                  <span className="session-count-badge">{sessions.length}</span>
                )}
              </div>
              <button 
                className="close-sidebar-btn" 
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>

            <button className="chat-new-btn" onClick={startNewChat}>
              <Plus size={18} />
              <span>New Conversation</span>
            </button>

            {sessions.length > 3 && (
              <div className="sidebar-search-box">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Filter chats..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="sessions-list">
            {filteredSessions.length > 0 ? (
              filteredSessions.map(s => (
                <div 
                  key={s._id} 
                  className={`session-item ${s._id === currentSessionId ? 'active' : ''}`}
                  onClick={() => loadSingleSession(s._id)}
                >
                  <div className="session-icon">
                    <MessageSquare size={15} />
                  </div>
                  <div className="session-details">
                    <span className="session-title">{s.title || 'Conversation'}</span>
                    {s.updatedAt && (
                      <span className="session-date">
                        {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <button 
                    className="session-delete-btn" 
                    onClick={(e) => handleDeleteSession(s._id, e)}
                    title="Delete Conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-sessions">
                <Sparkles size={24} className="empty-icon" />
                <p>{sessionSearch ? 'No matching chats' : 'No previous conversations'}</p>
                <span>{sessionSearch ? 'Try a different keyword' : 'Your saved chat history will appear here'}</span>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <div className="quick-help-card">
              <div className="quick-help-icon">
                <Bot size={16} />
              </div>
              <div className="quick-help-text">
                <strong>Medical AI Assistant</strong>
                <p>24/7 Clinical Insights</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-container">
          
          {/* Chat Header */}
          <header className="chat-header">
            <div className="header-info">
              <button 
                className="mobile-sidebar-toggle" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle chat history"
              >
                <Menu size={20} />
              </button>

              <div className="ai-avatar-header">
                <Bot size={24} />
                <span className="avatar-pulse-dot" />
              </div>

              <div className="header-titles">
                <div className="header-title-row">
                  <h2>HealthSphere AI</h2>
                  <span className="ai-status-pill">
                    <span className="status-dot"></span> Online
                  </span>
                </div>
                <p className="header-subtitle">Clinical Guidance & Symptom Assistant</p>
              </div>
            </div>

            <div className="header-actions">
              <button 
                className="header-action-btn" 
                onClick={startNewChat}
                title="Start a fresh chat"
              >
                <RefreshCw size={15} />
                <span className="action-btn-text">Reset Chat</span>
              </button>
            </div>
          </header>

          {/* Chat Messages */}
          <div className="chat-messages" ref={chatMessagesRef}>
            
            {/* Starter Prompt Cards if it's a fresh chat */}
            {isConversationEmpty && (
              <div className="starter-section">
                <div className="starter-header">
                  <Sparkles size={18} className="starter-sparkle-icon" />
                  <h3>Popular Topics to Explore</h3>
                </div>
                <div className="starter-grid">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      className="starter-card"
                      onClick={() => handleSendMessage(prompt.text)}
                    >
                      <div className="starter-card-top">
                        <span className="starter-icon">{prompt.icon}</span>
                        <span className="starter-badge">{prompt.category}</span>
                      </div>
                      <h4>{prompt.title}</h4>
                      <p>"{prompt.text}"</p>
                      <span className="starter-arrow">
                        Ask this <ChevronRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.sender} ${msg.isEmergency ? 'is-emergency' : ''}`}>
                {msg.sender === 'ai' && (
                  <div className="msg-avatar ai">
                    <Bot size={18} />
                  </div>
                )}
                
                <div className="message-content-group">
                  {/* Emergency Warning Banner if detected */}
                  {msg.isEmergency && (
                    <div className="emergency-banner">
                      <div className="emergency-banner-header">
                        <ShieldAlert size={18} />
                        <strong>URGENT MEDICAL NOTICE</strong>
                      </div>
                      <p>If you or someone around you is in critical condition, call emergency services immediately.</p>
                      <div className="emergency-actions">
                        <a href="tel:112" className="emergency-btn">
                          📞 Call 112 (Emergency)
                        </a>
                        <a href="tel:911" className="emergency-btn secondary">
                          📞 Call 911
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="message-bubble">
                    <FormattedMessage text={msg.text} isEmergency={msg.isEmergency} />
                    
                    <div className="message-meta">
                      {msg.timestamp && <span className="msg-time">{msg.timestamp}</span>}
                      <button 
                        className="copy-btn" 
                        onClick={() => handleCopy(msg.text, msg.id)}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={12} className="check-icon" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Suggestion Chips from AI */}
                  {msg.sender === 'ai' && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="suggestion-chips-container">
                      <span className="suggestion-chips-label">
                        <Sparkles size={12} /> Suggested follow-ups:
                      </span>
                      <div className="suggestion-chips-list">
                        {msg.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            className="suggestion-chip"
                            onClick={() => handleSendMessage(suggestion)}
                          >
                            <span>{suggestion}</span>
                            <ChevronRight size={13} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="msg-avatar user">
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="message-wrapper ai">
                <div className="msg-avatar ai">
                  <Bot size={18} />
                </div>
                <div className="message-content-group">
                  <div className="message-bubble typing-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">HealthSphere AI is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <footer className="chat-input-wrapper">
            <form className="chat-input-area" onSubmit={handleFormSubmit}>
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Ask about symptoms, medicines, lab reports, or doctor specialties..." 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isTyping}
                autoFocus
              />
              <button 
                type="submit" 
                className="send-btn" 
                disabled={!inputMessage.trim() || isTyping}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>

            <div className="chat-disclaimer">
              <AlertCircle size={13} /> 
              <span>HealthSphere AI provides general educational guidance and is not a substitute for professional medical diagnosis.</span>
            </div>
          </footer>

        </main>
      </div>
    </div>
  );
};

export default AIAssistant;
