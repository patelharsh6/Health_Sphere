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

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/healthsphere',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_only_insecure_secret',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
