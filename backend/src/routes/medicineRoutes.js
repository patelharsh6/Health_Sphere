const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineCategories,
  getMedicineBySlug,
} = require('../controllers/medicineController');

// GET /api/medicines/categories
router.get('/categories', getMedicineCategories);

// GET /api/medicines
router.get('/', getMedicines);

// GET /api/medicines/:slug
router.get('/:slug', getMedicineBySlug);

module.exports = router;
