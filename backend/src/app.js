const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const { CLIENT_URL, NODE_ENV } = require('./config/env');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

// ──────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────

// CORS — Allow frontend origin
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger (dev only)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// NOTE: uploads are deliberately NOT served statically — they contain medical
// reports (PHI). Files are streamed through GET /api/reports/:id/file, which
// enforces ownership.
//
// Avatars are the one exception: they are user-chosen profile pictures, not
// medical data, so they get their own public mount scoped to uploads/avatars
// only. Nothing else under uploads/ is reachable through it.
app.use(
  '/uploads/avatars',
  express.static(path.resolve(__dirname, '../uploads/avatars'), {
    fallthrough: true,
    index: false,
    dotfiles: 'deny',
  })
);

// ──────────────────────────────────────────────
// API ROUTES
// ──────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);

// ──────────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HealthSphere API is running 🚀',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────
// 404 & ERROR HANDLER
// ──────────────────────────────────────────────

// 404 — Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Upload problems are client errors — the limit depends on which endpoint
  // configured multer (10 MB for reports, 2 MB for avatars), so report the
  // limit multer itself was given instead of hardcoding one.
  if (err instanceof multer.MulterError) {
    const limitMb = req.originalUrl.includes('/avatar') ? 2 : 10;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum size is ${limitMb}MB.`
        : `Upload failed: ${err.message}.`;
    return res.status(400).json({ success: false, message });
  }

  // fileFilter rejections arrive as plain Errors carrying a user-facing message
  if (/^Only PDF|^Avatar must be/.test(err.message || '')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error('🔥 Unhandled Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
