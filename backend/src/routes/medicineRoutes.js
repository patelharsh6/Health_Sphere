const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineCategories,
  getMedicineBySlug,
} = require('../controllers/medicineController');

// GET /api/medicines/categories
/**
 * @openapi
 * /medicines/categories:
 *   get:
 *     tags: [Catalog]
 *     summary: Distinct medicine categories with counts
 *     description: Declared before /{slug} so "categories" is not matched as a slug.
 *     responses:
 *       "200":
 *         description: Success
 */
router.get('/categories', getMedicineCategories);

// GET /api/medicines
/**
 * @openapi
 * /medicines:
 *   get:
 *     tags: [Catalog]
 *     summary: List medicines
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema: { type: string }
 *         description: Matches name, generic name and description
 *       - in: query
 *         name: category
 *         required: false
 *         schema: { type: string }
 *         description: Exact category
 *       - in: query
 *         name: type
 *         required: false
 *         schema: { type: string }
 *         description: Tablet, Capsule, Syrup, ...
 *       - in: query
 *         name: prescriptionRequired
 *         required: false
 *         schema: { type: boolean }
 *         description: Rx-only filter
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
 */
router.get('/', getMedicines);

// GET /api/medicines/:slug
/**
 * @openapi
 * /medicines/{slug}:
 *   get:
 *     tags: [Catalog]
 *     summary: Medicine detail by slug
 *     description: relatedDiseases and alternatives are resolved to { name, slug }.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         description: URL slug, e.g. paracetamol
 *     responses:
 *       "200":
 *         description: Success
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/:slug', getMedicineBySlug);

module.exports = router;
