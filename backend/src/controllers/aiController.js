const Disease = require('../models/Disease');
const Doctor = require('../models/Doctor');
const ChatSession = require('../models/ChatSession');
const User = require('../models/User');
const { processMessage } = require('../utils/aiEngine');
const asyncHandler = require('../utils/asyncHandler');

// ──────────────────────────────────────────────
// DISEASE CATALOG & SYMPTOM CHECKER (public)
// ──────────────────────────────────────────────

/**
 * @desc    AI Symptom Checker — match symptoms to possible diseases
 * @route   POST /api/ai/symptom-check
 * @access  Public (or Private)
 */
const symptomCheck = async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of symptoms.',
    });
  }

  // Normalize input
  const normalizedSymptoms = symptoms.map((s) => s.toLowerCase().trim());

  // Find diseases that match any of the symptoms
  const diseases = await Disease.find({
    symptoms: {
      $elemMatch: {
        $in: normalizedSymptoms.map((s) => new RegExp(s, 'i')),
      },
    },
  });

  // Calculate match score for each disease
  const results = diseases.map((disease) => {
    const matchedSymptoms = disease.symptoms.filter((ds) =>
      normalizedSymptoms.some((ns) => ds.toLowerCase().includes(ns) || ns.includes(ds.toLowerCase()))
    );

    const matchScore = Math.round((matchedSymptoms.length / disease.symptoms.length) * 100);

    return {
      disease: {
        id: disease._id,
        name: disease.name,
        slug: disease.slug,
        category: disease.category,
        severity: disease.severity,
        specialistType: disease.specialistType,
      },
      matchedSymptoms,
      totalSymptoms: disease.symptoms.length,
      matchScore,
    };
  });

  // Sort by match score (highest first)
  results.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    success: true,
    message: results.length > 0
      ? `Found ${results.length} possible condition(s) based on your symptoms.`
      : 'No matching conditions found. Please consult a doctor.',
    disclaimer: 'This is an AI-assisted prediction and NOT a medical diagnosis. Please consult a qualified healthcare professional.',
    data: results.slice(0, 5), // Top 5 matches
  });
};

/**
 * @desc    Get disease details by slug
 * @route   GET /api/ai/diseases/:slug
 * @access  Public
 */
const getDiseaseBySlug = async (req, res) => {
  const disease = await Disease.findOne({ slug: req.params.slug });

  if (!disease) {
    return res.status(404).json({ success: false, message: 'Disease not found.' });
  }

  res.status(200).json({ success: true, data: disease });
};

/**
 * @desc    Get all diseases (for search/reference)
 * @route   GET /api/ai/diseases
 * @access  Public
 */
const getAllDiseases = async (req, res) => {
  const { category, search } = req.query;
  const filter = {};

  if (category && category !== 'All') filter.category = category;

  // DiseaseListing searches names and descriptions, so match both
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const diseases = await Disease.find(filter)
    .select('name slug description category severity specialistType symptoms')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: diseases.length,
    data: diseases,
  });
};

/**
 * @desc    Get distinct disease categories
 * @route   GET /api/ai/diseases/categories
 * @access  Public
 */
const getDiseaseCategories = async (req, res) => {
  const categories = await Disease.distinct('category');
  res.status(200).json({
    success: true,
    data: categories,
  });
};

/**
 * @desc    Get doctors matching a disease's specialistType
 * @route   GET /api/ai/diseases/:slug/doctors
 * @access  Public
 */
const getDiseaseDoctors = async (req, res) => {
  const disease = await Disease.findOne({ slug: req.params.slug });

  if (!disease) {
    return res.status(404).json({ success: false, message: 'Disease not found.' });
  }


  const doctors = await Doctor.find({ specialization: disease.specialistType, isVerified: true })
    .populate('user', 'fullName avatar _id');

  res.status(200).json({ success: true, data: doctors });
};


// ──────────────────────────────────────────────
// AI ASSISTANT CHAT (private)
// ──────────────────────────────────────────────

/**
 * @desc    Send a message to the AI assistant
 * @route   POST /api/ai/chat
 * @access  Private
 */
const chat = async (req, res) => {
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
  
  // Process the message via our AI Engine. Tier 1 is always consulted, so
  // `suggestions` is populated even when Gemini wrote the reply.
  const { reply, suggestions, isEmergency } = await processMessage(user, message, chatHistory);

  // Add AI reply to session
  session.messages.push({
    sender: 'ai',
    text: reply,
  });

  await session.save();

  res.status(200).json({
    success: true,
    sessionId: session._id,
    reply,
    suggestions,
    isEmergency,
  });
};

/**
 * @desc    Get all chat sessions for the logged in user
 * @route   GET /api/ai/chat/sessions
 * @access  Private
 */
const getSessions = async (req, res) => {
  const sessions = await ChatSession.find({ user: req.user._id })
    .select('-messages')
    .sort({ updatedAt: -1 });
    
  res.status(200).json({ success: true, data: sessions });
};

/**
 * @desc    Get a specific chat session with full message history
 * @route   GET /api/ai/chat/:sessionId
 * @access  Private
 */
const getSession = async (req, res) => {
  const session = await ChatSession.findOne({ _id: req.params.sessionId, user: req.user._id });
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  res.status(200).json({ success: true, data: session });
};

/**
 * @desc    Delete a specific chat session
 * @route   DELETE /api/ai/chat/:sessionId
 * @access  Private
 */
const deleteSession = async (req, res) => {
  const session = await ChatSession.findOneAndDelete({ _id: req.params.sessionId, user: req.user._id });
  
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  res.status(200).json({ success: true, message: 'Session deleted successfully.' });
};


module.exports = {
  // catalog + symptom checker
  symptomCheck: asyncHandler(symptomCheck),
  getAllDiseases: asyncHandler(getAllDiseases),
  getDiseaseCategories: asyncHandler(getDiseaseCategories),
  getDiseaseBySlug: asyncHandler(getDiseaseBySlug),
  getDiseaseDoctors: asyncHandler(getDiseaseDoctors),
  // assistant chat
  chat: asyncHandler(chat),
  getSessions: asyncHandler(getSessions),
  getSession: asyncHandler(getSession),
  deleteSession: asyncHandler(deleteSession),
};
