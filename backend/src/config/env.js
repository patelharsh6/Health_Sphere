const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

// Secrets must never fall back to a hardcoded default outside development —
// a silent fallback would sign every token with a publicly known key.
const REQUIRED_IN_PRODUCTION = ['MONGO_URI', 'JWT_SECRET'];

if (NODE_ENV === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`❌ Missing required environment variable(s): ${missing.join(', ')}`);
    process.exit(1);
  }
}

if (NODE_ENV !== 'production' && !process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET is not set — using an insecure development fallback.');
}

// ── AI assistant ───────────────────────────────
// 'rules'  — catalog-grounded intent router only. No key, no quota, always works.
// 'gemini' — Gemini overlays a conversational reply, falling back to the rules
//            engine on any error. Needs GEMINI_API_KEY.
const AI_PROVIDER = (process.env.AI_PROVIDER || 'rules').toLowerCase();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (AI_PROVIDER === 'gemini' && !GEMINI_API_KEY) {
  console.warn(
    '⚠️  AI_PROVIDER=gemini but GEMINI_API_KEY is not set — the assistant will ' +
      'run on the rules engine only. Get a free key at https://aistudio.google.com/apikey'
  );
}

// ── File storage ───────────────────────────────
// 'local' writes to backend/uploads/. 'cloudinary' needs all three keys below;
// falling back to local is safer than booting with a half-configured uploader.
let STORAGE_DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
const CLOUDINARY = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
};

if (STORAGE_DRIVER === 'cloudinary' && !Object.values(CLOUDINARY).every(Boolean)) {
  console.warn('⚠️  STORAGE_DRIVER=cloudinary but CLOUDINARY_* keys are incomplete — using local disk.');
  STORAGE_DRIVER = 'local';
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/healthsphere',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_only_insecure_secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // AI
  AI_PROVIDER,
  GEMINI_API_KEY,
  // Free tier as of 2026: gemini-2.5-flash. Override if Google renames it.
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  // Storage
  STORAGE_DRIVER,
  CLOUDINARY,
};
