const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const { processMessage } = require('../utils/aiEngine');

/**
 * @desc    Send a message to the AI assistant
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const user = await User.findById(req.user._id);

    let session;
    let chatHistory = [];

    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' });
      }
      chatHistory = session.messages;
    } else {
      // Create a new session if none provided
      const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      session = await ChatSession.create({
        user: req.user._id,
        title: title,
        messages: [],
      });
    }

    // Add user message to session
    session.messages.push({
      sender: 'user',
      text: message,
    });
    
    // Process the message via our AI Engine
    const replyText = await processMessage(user, message, chatHistory);

    // Add AI reply to session
    session.messages.push({
      sender: 'ai',
      text: replyText,
    });

    await session.save();

    res.status(200).json({
      success: true,
      sessionId: session._id,
      reply: replyText,
    });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing chat.' });
  }
};

/**
 * @desc    Get all chat sessions for the logged in user
 * @route   GET /api/ai/chat/sessions
 * @access  Private
 */
const getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id })
      .select('-messages')
      .sort({ updatedAt: -1 });
      
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error('GetSessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get a specific chat session with full message history
 * @route   GET /api/ai/chat/:sessionId
 * @access  Private
 */
const getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.error('GetSession Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Delete a specific chat session
 * @route   DELETE /api/ai/chat/:sessionId
 * @access  Private
 */
const deleteSession = async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.sessionId, user: req.user._id });
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    res.status(200).json({ success: true, message: 'Session deleted successfully.' });
  } catch (error) {
    console.error('DeleteSession Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  chat,
  getSessions,
  getSession,
  deleteSession,
};
