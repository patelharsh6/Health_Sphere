const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const {
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  getAvailableSlots,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validate');
const { updateDoctorProfileValidator } = require('../validators/profileValidators');

// Protected routes — declared before /:id so "profile" is never parsed as an id
// PUT /api/doctors/profile
router.put(
  '/profile',
  protect,
  authorize('doctor'),
  updateDoctorProfileValidator,
  validate,
  updateDoctorProfile
);

// Public routes
// GET /api/doctors
router.get('/', getAllDoctors);

// GET /api/doctors/:id
router.get('/:id', param('id').isMongoId().withMessage('Invalid doctor id.'), validate, getDoctorById);

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
router.get(
  '/:id/slots',
  param('id').isMongoId().withMessage('Invalid doctor id.'),
  validate,
  getAvailableSlots
);

module.exports = router;
