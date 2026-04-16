const express = require('express');
const router = express.Router();
const { symptomCheck, getDiseaseBySlug, getAllDiseases } = require('../controllers/aiController');

// POST /api/ai/symptom-check
router.post('/symptom-check', symptomCheck);

// GET /api/ai/diseases
router.get('/diseases', getAllDiseases);

// GET /api/ai/diseases/:slug
router.get('/diseases/:slug', getDiseaseBySlug);

module.exports = router;
