const express = require('express');
const router = express.Router();
const {
  upload,
  uploadReport,
  getMyReports,
  getReportById,
  getReportFile,
  reviewReport,
  deleteReport,
  reanalyzeReport,
  getReportTrends,
  getPendingReviews,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validate');
const {
  uploadReportValidator,
  reviewReportValidator,
  reportIdValidator,
} = require('../validators/reportValidators');

// All routes require authentication
router.use(protect);

// POST /api/reports/upload (patient uploads)
// The validators run after multer so req.body holds the multipart text fields.
/**
 * @openapi
 * /reports/upload:
 *   post:
 *     tags: [Reports]
 *     summary: Upload a medical report
 *     description: Patient role only. multipart/form-data. PDF or image, max 10MB. Responds immediately with status "processing"; extraction runs in the background, so poll GET /reports/{id} until status is "analyzed" or "failed".
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 description: The report file (binary)
 *               title:
 *                 type: string
 *                 description: Report title
 *               type:
 *                 type: string
 *                 description: blood_test | xray | mri | other
 *     responses:
 *       "201":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.post(
  '/upload',
  authorize('patient'),
  upload.single('file'),
  uploadReportValidator,
  validate,
  uploadReport
);

// GET /api/reports (patient gets their reports)
/**
 * @openapi
 * /reports:
 *   get:
 *     tags: [Reports]
 *     summary: List the caller's reports
 *     description: Patient role only.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer }
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer }
 *         description: Items per page (max 100)
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/', authorize('patient'), getMyReports);

// GET /api/reports/pending-review (doctor gets reports to review)
/**
 * @openapi
 * /reports/pending-review:
 *   get:
 *     tags: [Reports]
 *     summary: Reports awaiting a doctor comment
 *     description: Doctor role only.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/pending-review', authorize('doctor'), getPendingReviews);

// GET /api/reports/:id/file (auth-gated download — replaces static /uploads)
/**
 * @openapi
 * /reports/{id}/file:
 *   get:
 *     tags: [Reports]
 *     summary: Stream the report file
 *     description: Owner, a doctor sharing an appointment with the patient, or an admin. Reports are never served statically; this is the only way to read the file, and it has a path-traversal guard.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/:id/file', reportIdValidator, validate, getReportFile);

// GET /api/reports/:id/trends
/**
 * @openapi
 * /reports/{id}/trends:
 *   get:
 *     tags: [Reports]
 *     summary: The same parameters across past reports, as a chart series
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/:id/trends', reportIdValidator, validate, getReportTrends);

// GET /api/reports/:id
/**
 * @openapi
 * /reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: One report with its analysis
 *     description: filePath is never serialised; a fileUrl virtual is returned instead.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/:id', reportIdValidator, validate, getReportById);

// DELETE /api/reports/:id
router.delete('/:id', reportIdValidator, validate, deleteReport);

// POST /api/reports/:id/reanalyze
/**
 * @openapi
 * /reports/{id}/reanalyze:
 *   post:
 *     tags: [Reports]
 *     summary: Re-run the parser
 *     description: Owner only. Sets status back to "processing".
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.post('/:id/reanalyze', reportIdValidator, validate, reanalyzeReport);

// PUT /api/reports/:id/review (doctor reviews)
/**
 * @openapi
 * /reports/{id}/review:
 *   put:
 *     tags: [Reports]
 *     summary: Add a doctor review
 *     description: Doctor role only.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorComment]
 *             properties:
 *               doctorComment:
 *                 type: string
 *                 description: The review comment
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.put('/:id/review', authorize('doctor'), reviewReportValidator, validate, reviewReport);

module.exports = router;
