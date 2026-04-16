import React, { useState } from 'react';
import { Bot, Send, User, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AIAssistant.css';

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello ${user?.fullName ? user.fullName.split(' ')[0] : 'there'}! I am your HealthSphere AI Assistant. You can ask me about common symptoms, health tips, or how to use the platform. Please note that I am a virtual assistant, not a doctor.`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e) => {
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

    // Simulate AI response
    setTimeout(() => {
      const lowerQuery = userMsg.text.toLowerCase();
      let aiResponse = "I'm sorry, I don't have medical expertise to diagnose that. Please try using our Symptom Checker or book an appointment with a doctor.";
      
      if (lowerQuery.includes('headache') || lowerQuery.includes('fever')) {
        aiResponse = "For common symptoms like a headache or fever, make sure to stay hydrated and rest. You can use the Symptom Checker tool for a more detailed AI analysis of your symptoms.";
      } else if (lowerQuery.includes('appointment') || lowerQuery.includes('book')) {
        aiResponse = "You can easily book a doctor by navigating to the 'Appointments' section in your dashboard. You can search by specialization and choose an available time slot.";
      } else if (lowerQuery.includes('report') || lowerQuery.includes('upload')) {
        aiResponse = "To upload a medical report, head over to the 'Reports' section. Our AI can also provide a summary of the uploaded document once you submit it!";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponse
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="ai-chat-page">
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
          <button className="clear-chat-btn" onClick={() => setMessages([messages[0]])}>
            <RefreshCw size={16} /> Clear
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
                <p>{msg.text}</p>
              </div>
              {msg.sender === 'user' && (
                <div className="msg-avatar user"><User size={16} /></div>
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
        </div>

        <div className="chat-disclaimer">
          <AlertCircle size={14} /> 
          <span>AI answers are for guidance only. Not medical advice.</span>
        </div>

        {/* Chat Input */}
        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input 
            type="text" 
            placeholder="Ask a health question or how to use the app..." 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={!inputMessage.trim()}>
            <Send size={20} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AIAssistant;
