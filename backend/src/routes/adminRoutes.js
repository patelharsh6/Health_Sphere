const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  getStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getPendingDoctors,
  verifyDoctor,
  getAppointments,
  getDiseases,
  deleteDisease,
  createDisease,
  getMedicines,
  deleteMedicine,
  createMedicine
} = require('../controllers/adminController');

// All admin routes are protected and restricted to 'admin' role
router.use(protect);
router.use(authorize('admin'));

// Dashboard Stats
router.get('/stats', getStats);

// User Management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Doctor Verification
router.get('/doctors/pending', getPendingDoctors);
router.put('/doctors/:id/verify', verifyDoctor);

// Appointment Oversight
router.get('/appointments', getAppointments);

// Content Management (Diseases)
router.get('/content/diseases', getDiseases);
router.post('/content/diseases', createDisease);
router.delete('/content/diseases/:id', deleteDisease);

// Content Management (Medicines)
router.get('/content/medicines', getMedicines);
router.post('/content/medicines', createMedicine);
router.delete('/content/medicines/:id', deleteMedicine);

module.exports = router;
