/**
 * Test bootstrap: every suite runs against a throwaway in-memory MongoDB, so
 * the tests can never touch the real Atlas database.
 *
 * Env vars are set before anything requires config/env.js, which reads them at
 * import time.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jest_only';
process.env.JWT_EXPIRE = '1h';
process.env.AI_PROVIDER = 'rules'; // never call the Gemini API from a test
process.env.GEMINI_API_KEY = '';
process.env.STORAGE_DRIVER = 'local';
process.env.CLIENT_URL = 'http://localhost:3000';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120000);

// Wipe between tests so each one starts from a known state and ordering
// cannot leak state from one case into the next.
afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
