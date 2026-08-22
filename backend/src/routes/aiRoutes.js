const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  symptomCheck,
  getAllDiseases,
  getDiseaseCategories,
  getDiseaseBySlug,
  getDiseaseDoctors,
  chat,
  getSessions,
  getSession,
  deleteSession,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { NODE_ENV } = require('../config/env');

// Chat is the only metered surface: 30 messages/hour/IP in production,
// relaxed 10x in development so manual testing cannot lock itself out.
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: NODE_ENV === 'production' ? 30 : 300,
  message: {
    success: false,
    message: 'Too many chat requests. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// The symptom checker is public but abusable, so it gets its own looser cap.
const symptomLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 60 : 600,
  message: {
    success: false,
    message: 'Too many symptom checks. Please try again shortly.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ──────────────────────────────────────────────
// PUBLIC — catalog + symptom checker
// These back the Home, SymptomChecker, DiseaseListing and DiseaseDetail pages,
// all of which render for signed-out visitors. Do NOT put `protect` above them.
// ──────────────────────────────────────────────

router.post('/symptom-check', symptomLimiter, symptomCheck);

// `/diseases/categories` must be declared before `/diseases/:slug`,
// or Express matches "categories" as a slug.
router.get('/diseases', getAllDiseases);
router.get('/diseases/categories', getDiseaseCategories);
router.get('/diseases/:slug', getDiseaseBySlug);
router.get('/diseases/:slug/doctors', getDiseaseDoctors);

// ──────────────────────────────────────────────
// PRIVATE — AI assistant chat
// ──────────────────────────────────────────────

router.post('/chat', protect, chatLimiter, chat);
router.get('/chat/sessions', protect, getSessions);
router.get('/chat/:sessionId', protect, getSession);
router.delete('/chat/:sessionId', protect, deleteSession);

module.exports = router;
