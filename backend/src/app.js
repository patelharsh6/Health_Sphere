const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const { CLIENT_URL, NODE_ENV } = require('./config/env');
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');
const { globalLimiter } = require('./middleware/rateLimit');
const { requestId, notFound, errorHandler } = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const aiRoutes = require('./routes/aiRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Rate limiters and req.ip must see the real client address, not the proxy's.
app.set('trust proxy', 1);

// ──────────────────────────────────────────────
// SECURITY
// ──────────────────────────────────────────────

app.use(
  helmet({
    // The API serves JSON and avatar images, never HTML that embeds scripts,
    // so the restrictive default CSP would only get in Swagger UI's way.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS is locked to the configured client. A bare `cors()` would reflect any
// Origin, which combined with credentials lets any site call the API as the
// signed-in user.
app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin and non-browser callers (curl, health checks) send no Origin.
      if (!origin || origin === CLIENT_URL) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Strip `$`/`.` keys so a body like {"email": {"$gt": ""}} cannot become a
// query operator. Runs after the body parsers and before any route.
app.use(mongoSanitize({ replaceWith: '_' }));

// Collapse duplicated query params: `?page=1&page=2` otherwise arrives as an
// array and breaks parseInt-style parsing.
app.use(hpp());

app.use(globalLimiter);

// ──────────────────────────────────────────────
// OBSERVABILITY
// ──────────────────────────────────────────────

app.use(requestId);

// morgan writes through winston so there is a single log destination.
morgan.token('id', (req) => req.id);
app.use(
  morgan(
    NODE_ENV === 'production'
      ? ':id :remote-addr :method :url :status :response-time[0]ms'
      : ':id :method :url :status :response-time[0]ms',
    { stream: logger.stream, skip: () => NODE_ENV === 'test' }
  )
);

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
app.use('/api/medicines', medicineRoutes);
app.use('/api/admin', adminRoutes);

// ──────────────────────────────────────────────
// DOCS
// ──────────────────────────────────────────────

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'HealthSphere API',
    swaggerOptions: { persistAuthorization: true },
  })
);

// Raw spec, for generating clients or importing into Postman.
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

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
// 404 & ERROR HANDLER — must stay last
// ──────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

module.exports = app;
