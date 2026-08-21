import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User as UserIcon, AlertCircle, RefreshCw, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import './AIAssistant.css';

const AIAssistant = () => {
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const [messages, setMessages] = useState([
    {
      id: 'default',
      sender: 'ai',
      text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! I am your HealthSphere AI Assistant. You can ask me about common symptoms, health tips, or how to use the platform. Please note that I am a virtual assistant, not a doctor.`
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadSessions = async () => {
    try {
      const res = await aiAPI.getSessions();
      if (res.data.success) {
        setSessions(res.data.data);
        if (res.data.data.length > 0 && !currentSessionId) {
          loadSingleSession(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
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
          text: m.text
        }));
        if (history.length > 0) {
          setMessages(history);
        }
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage
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
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.data.reply
        }]);
        
        if (!currentSessionId) {
          setCurrentSessionId(res.data.sessionId);
          loadSessions(); // refresh the sidebar
        }
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I'm having trouble connecting to my server right now. Please try again later."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([
      {
        id: 'default',
        sender: 'ai',
        text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! I am your HealthSphere AI Assistant. Start a new conversation below!`
      }
    ]);
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
      console.error("Failed to delete session", err);
    }
  };

  return (
    <div className="ai-chat-page">
      <div className="chat-layout">
        
        {/* Sidebar for Sessions */}
        <div className="chat-sidebar">
          <button className="new-chat-btn action-btn btn-primary" onClick={startNewChat}>
            <MessageSquare size={18} /> New Chat
          </button>
          <div className="sessions-list">
            {sessions.map(s => (
              <div 
                key={s._id} 
                className={`session-item ${s._id === currentSessionId ? 'active' : ''}`}
                onClick={() => loadSingleSession(s._id)}
              >
                <span className="session-title">{s.title}</span>
                <button 
                  className="delete-btn" 
                  onClick={(e) => handleDeleteSession(s._id, e)}
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-container">
          
          {/* Chat Header */}
          <div className="chat-header">
            <div className="header-info">
              <div className="ai-avatar-header">
                <Bot size={24} />
              </div>
              <div>
                <h2>HealthSphere AI Assistant</h2>
                <span className="online-status"><span className="dot"></span> Online</span>
              </div>
            </div>
            <button className="clear-chat-btn" onClick={startNewChat}>
              <RefreshCw size={16} /> Reset
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                {msg.sender === 'ai' && (
                  <div className="msg-avatar ai"><Bot size={16} /></div>
                )}
                <div className="message-bubble">
                  {/* Split by newlines for basic formatting */}
                  {msg.text.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {msg.sender === 'user' && (
                  <div className="msg-avatar user"><UserIcon size={16} /></div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="message-wrapper ai">
                <div className="msg-avatar ai"><Bot size={16} /></div>
                <div className="message-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-disclaimer">
            <AlertCircle size={14} /> 
            <span>AI answers are for guidance only. Not medical advice. Always consult a professional.</span>
          </div>

          {/* Chat Input */}
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              placeholder="Ask a health question or how to use the app..." 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className="send-btn" disabled={!inputMessage.trim() || isTyping}>
              <Send size={20} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
