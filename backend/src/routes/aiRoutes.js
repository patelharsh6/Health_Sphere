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

/**
 * @openapi
 * /ai/symptom-check:
 *   post:
 *     tags: [Catalog]
 *     summary: Score symptoms against the disease catalog
 *     description: Public. Returns the top 5 matches with a percentage overlap and a disclaimer. Not a diagnosis.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symptoms]
 *             properties:
 *               symptoms:
 *                 type: array
 *                 description: Array of symptom strings
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/symptom-check', symptomLimiter, symptomCheck);

// `/diseases/categories` must be declared before `/diseases/:slug`,
// or Express matches "categories" as a slug.
/**
 * @openapi
 * /ai/diseases:
 *   get:
 *     tags: [Catalog]
 *     summary: List diseases
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema: { type: string }
 *         description: Matches name and description
 *       - in: query
 *         name: category
 *         required: false
 *         schema: { type: string }
 *         description: Exact category; "All" means no filter
 *     responses:
 *       "200":
 *         description: Success
 */
router.get('/diseases', getAllDiseases);
/**
 * @openapi
 * /ai/diseases/categories:
 *   get:
 *     tags: [Catalog]
 *     summary: Distinct disease categories
 *     description: Declared before /diseases/{slug} so "categories" is not matched as a slug.
 *     responses:
 *       "200":
 *         description: Success
 */
router.get('/diseases/categories', getDiseaseCategories);
/**
 * @openapi
 * /ai/diseases/{slug}:
 *   get:
 *     tags: [Catalog]
 *     summary: Disease detail by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         description: URL slug, e.g. diabetes
 *     responses:
 *       "200":
 *         description: Success
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/diseases/:slug', getDiseaseBySlug);
/**
 * @openapi
 * /ai/diseases/{slug}/doctors:
 *   get:
 *     tags: [Catalog]
 *     summary: Verified doctors matching the disease specialistType
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         description: Disease slug
 *     responses:
 *       "200":
 *         description: Success
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/diseases/:slug/doctors', getDiseaseDoctors);

// ──────────────────────────────────────────────
// PRIVATE — AI assistant chat
// ──────────────────────────────────────────────

/**
 * @openapi
 * /ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: Send a message to the assistant
 *     description: Grounded in the disease and medicine catalog. Emergency keywords short-circuit to an urgent-care reply before any model runs. Rate limited to 30 messages/hour.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user message
 *               sessionId:
 *                 type: string
 *                 description: Continue an existing session; omit to start one
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.post('/chat', protect, chatLimiter, chat);
/**
 * @openapi
 * /ai/chat/sessions:
 *   get:
 *     tags: [AI]
 *     summary: List the caller's chat sessions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.get('/chat/sessions', protect, getSessions);
/**
 * @openapi
 * /ai/chat/{sessionId}:
 *   get:
 *     tags: [AI]
 *     summary: One session with full history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *         description: Session id
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/chat/:sessionId', protect, getSession);
router.delete('/chat/:sessionId', protect, deleteSession);

module.exports = router;
