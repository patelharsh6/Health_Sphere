const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { VALID_PASSWORD, createPatient, createDisease, auth } = require('./helpers');

const api = () => request(app);

describe('Security headers', () => {
  it('sets helmet headers', async () => {
    const res = await api().get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    // helmet removes the framework fingerprint.
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('tags every response with a request id', async () => {
    const res = await api().get('/api/health');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('echoes a caller-supplied request id so logs can be correlated', async () => {
    const res = await api().get('/api/health').set('X-Request-Id', 'trace-me-123');
    expect(res.headers['x-request-id']).toBe('trace-me-123');
  });
});

describe('CORS', () => {
  it('allows the configured client origin', async () => {
    const res = await api().get('/api/health').set('Origin', process.env.CLIENT_URL);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(process.env.CLIENT_URL);
  });

  it('does not reflect an arbitrary origin', async () => {
    // Reflecting any Origin while allowing credentials would let any site call
    // the API as the signed-in user.
    const res = await api().get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
  });
});

describe('NoSQL injection', () => {
  it('cannot log in by passing a query operator as the email', async () => {
    await createPatient({ email: 'victim@example.com' });

    const res = await api()
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: VALID_PASSWORD });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.data?.token).toBeFalsy();
  });

  it('strips $-prefixed keys from a request body', async () => {
    const { token } = await createPatient();
    const res = await api()
      .put('/api/patients/profile')
      .set(...auth(token))
      .send({ bloodGroup: 'O+', $set: { role: 'admin' } });

    expect(res.status).toBeLessThan(500);
    // The sanitizer must not have let $set through to Mongo.
    const escalated = await User.findOne({ role: 'admin' });
    expect(escalated).toBeNull();
  });
});

describe('HTTP parameter pollution', () => {
  it('collapses a duplicated query parameter', async () => {
    await createDisease({ name: 'Asthma', slug: 'asthma', category: 'Respiratory' });
    // Without hpp, `category` arrives as an array and the Mongo filter breaks.
    const res = await api().get('/api/ai/diseases?category=Respiratory&category=Cardiovascular');
    expect(res.status).toBe(200);
  });
});

describe('Global error handler', () => {
  it('404s an unknown route in the standard envelope', async () => {
    const res = await api().get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.message).toMatch(/route not found/i);
  });

  it('400s a malformed ObjectId rather than leaking a CastError 500', async () => {
    const res = await api().get('/api/doctors/not-a-valid-id');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns field-level errors for a validation failure', async () => {
    const res = await api().post('/api/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(typeof res.body.errors).toBe('object');
  });

  it('never leaks a stack trace in the response body for a 4xx', async () => {
    const res = await api().get('/api/definitely-not-a-route');
    expect(res.body.stack).toBeUndefined();
  });
});

describe('API docs', () => {
  it('serves the OpenAPI spec', async () => {
    const res = await api().get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('HealthSphere API');
  });

  it('serves the Swagger UI', async () => {
    const res = await api().get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/swagger/i);
  });
});

describe('Health check', () => {
  it('reports ok', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
