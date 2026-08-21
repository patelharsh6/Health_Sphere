const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chat, getSessions, getSession, deleteSession } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per `window` (here, per hour)
  message: { success: false, message: 'Too many chat requests from this IP, please try again after an hour.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.use(protect);

router.post('/chat', chatLimiter, chat);
router.get('/chat/sessions', getSessions);
router.get('/chat/:sessionId', getSession);
router.delete('/chat/:sessionId', deleteSession);

module.exports = router;
