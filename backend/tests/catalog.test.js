const request = require('supertest');
const app = require('../src/app');
const { createDisease, createMedicine, createDoctor, createPatient, auth } = require('./helpers');

const api = () => request(app);

describe('GET /api/ai/diseases', () => {
  beforeEach(async () => {
    await createDisease({ name: 'Asthma', slug: 'asthma', category: 'Respiratory', description: 'Airways narrow and swell.', specialistType: 'Pulmonologist' });
    await createDisease({ name: 'Hypertension', slug: 'hypertension', category: 'Cardiovascular', description: 'Persistently raised blood pressure.', specialistType: 'Cardiologist' });
    await createDisease({ name: 'Migraine', slug: 'migraine', category: 'Neurological', description: 'Severe recurring headaches.', specialistType: 'Neurologist' });
  });

  it('is public — no token needed', async () => {
    // The listing renders for signed-out visitors; a blanket `protect` on the
    // /api/ai router once broke exactly this.
    const res = await api().get('/api/ai/diseases');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  it('includes description, which the cards render', async () => {
    const res = await api().get('/api/ai/diseases');
    res.body.data.forEach((d) => expect(d.description).toBeTruthy());
  });

  it('filters by category', async () => {
    const res = await api().get('/api/ai/diseases').query({ category: 'Respiratory' });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Asthma');
  });

  it('treats category=All as no filter', async () => {
    const res = await api().get('/api/ai/diseases').query({ category: 'All' });
    expect(res.body.data).toHaveLength(3);
  });

  it('searches name and description', async () => {
    const byName = await api().get('/api/ai/diseases').query({ search: 'migraine' });
    expect(byName.body.data).toHaveLength(1);

    const byDescription = await api().get('/api/ai/diseases').query({ search: 'blood pressure' });
    expect(byDescription.body.data).toHaveLength(1);
    expect(byDescription.body.data[0].name).toBe('Hypertension');
  });
});

describe('GET /api/ai/diseases/categories', () => {
  it('is matched as a literal path, not as a :slug', async () => {
    // Declaring /diseases/:slug first would swallow "categories".
    await createDisease({ name: 'Asthma', slug: 'asthma', category: 'Respiratory' });
    const res = await api().get('/api/ai/diseases/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toContain('Respiratory');
  });
});

describe('GET /api/ai/diseases/:slug', () => {
  it('returns the condition', async () => {
    await createDisease({ name: 'Asthma', slug: 'asthma' });
    const res = await api().get('/api/ai/diseases/asthma');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Asthma');
  });

  it('404s an unknown slug rather than substituting fixture data', async () => {
    const res = await api().get('/api/ai/diseases/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/ai/diseases/:slug/doctors', () => {
  it('returns verified doctors matching specialistType', async () => {
    await createDisease({ name: 'Hypertension', slug: 'hypertension', specialistType: 'Cardiologist' });
    await createDoctor({ specialization: 'Cardiologist' });
    await createDoctor({ specialization: 'Dermatologist' });

    const res = await api().get('/api/ai/diseases/hypertension/doctors');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].specialization).toBe('Cardiologist');
  });

  it('excludes unverified doctors', async () => {
    await createDisease({ name: 'Hypertension', slug: 'hypertension', specialistType: 'Cardiologist' });
    await createDoctor({ specialization: 'Cardiologist', isVerified: false });

    const res = await api().get('/api/ai/diseases/hypertension/doctors');
    expect(res.body.data).toHaveLength(0);
  });
});

describe('POST /api/ai/symptom-check', () => {
  beforeEach(async () => {
    await createDisease({
      name: 'Common Cold', slug: 'common-cold',
      symptoms: ['runny nose', 'sore throat', 'mild fever', 'cough'],
      specialistType: 'General Physician',
    });
    await createDisease({
      name: 'Influenza', slug: 'influenza',
      symptoms: ['fever', 'body ache', 'cough', 'fatigue'],
      specialistType: 'General Physician',
    });
  });

  it('is public and returns scored matches with a disclaimer', async () => {
    const res = await api().post('/api/ai/symptom-check').send({ symptoms: ['fever', 'cough'] });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.disclaimer).toMatch(/not a medical diagnosis/i);
    expect(res.body.data[0]).toHaveProperty('matchScore');
  });

  it('sorts by descending match score', async () => {
    const res = await api().post('/api/ai/symptom-check').send({ symptoms: ['fever', 'cough', 'body ache'] });
    const scores = res.body.data.map((r) => r.matchScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('400s a missing or non-array symptoms field', async () => {
    expect((await api().post('/api/ai/symptom-check').send({})).status).toBe(400);
    expect((await api().post('/api/ai/symptom-check').send({ symptoms: 'fever' })).status).toBe(400);
    expect((await api().post('/api/ai/symptom-check').send({ symptoms: [] })).status).toBe(400);
  });
});

describe('Medicines', () => {
  beforeEach(async () => {
    await createMedicine({ name: 'Paracetamol', slug: 'paracetamol', genericName: 'acetaminophen', category: 'Pain Relief', type: 'Tablet', prescriptionRequired: false, uses: ['fever', 'mild pain'] });
    await createMedicine({ name: 'Amoxicillin', slug: 'amoxicillin', genericName: 'amoxicillin', category: 'Antibiotic', type: 'Capsule', prescriptionRequired: true });
  });

  it('lists medicines publicly', async () => {
    const res = await api().get('/api/medicines');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it('serves /categories as a literal path before /:slug', async () => {
    const res = await api().get('/api/medicines/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns a medicine by slug', async () => {
    const res = await api().get('/api/medicines/paracetamol');
    expect(res.status).toBe(200);
    expect(res.body.data.genericName).toBe('acetaminophen');
  });

  it('404s an unknown slug', async () => {
    const res = await api().get('/api/medicines/nonexistent');
    expect(res.status).toBe(404);
  });

  it('filters by category', async () => {
    const res = await api().get('/api/medicines').query({ category: 'Antibiotic' });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Amoxicillin');
  });
});

describe('GET /api/doctors — pagination contract', () => {
  beforeEach(async () => {
    for (let i = 0; i < 12; i += 1) {
      await createDoctor({
        fullName: `Doctor Number ${i}`,
        specialization: i % 2 ? 'Cardiologist' : 'Dermatologist',
        hospital: i < 6 ? 'Alpha Hospital' : 'Beta Clinic',
      });
    }
  });

  it('returns count, page and pages', async () => {
    const res = await api().get('/api/doctors').query({ page: 1, limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ count: 12, page: 1, pages: 3 });
    expect(res.body.data).toHaveLength(5);
  });

  it('returns page/pages on the SEARCH branch too', async () => {
    // The old in-memory search branch returned `count` alone, which broke the
    // client pager whenever a search term was present.
    const res = await api().get('/api/doctors').query({ search: 'Alpha', page: 1, limit: 2 });

    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('pages');
    expect(res.body.count).toBe(6);
    expect(res.body.pages).toBe(3);
    expect(res.body.data).toHaveLength(2);
  });

  it('searches by doctor name via the linked User', async () => {
    const res = await api().get('/api/doctors').query({ search: 'Doctor Number 3' });
    expect(res.body.count).toBe(1);
  });

  it('does not treat a regex metacharacter as a wildcard', async () => {
    const res = await api().get('/api/doctors').query({ search: '.*' });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('clamps a nonsense page/limit instead of erroring', async () => {
    const res = await api().get('/api/doctors').query({ page: -5, limit: 'abc' });
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });

  it('excludes unverified doctors from the directory', async () => {
    await createDoctor({ fullName: 'Unverified Doc', isVerified: false });
    const res = await api().get('/api/doctors').query({ limit: 100 });
    expect(res.body.count).toBe(12);
  });
});

describe('AI chat auth', () => {
  it('requires a token', async () => {
    const res = await api().post('/api/ai/chat').send({ message: 'hello' });
    expect(res.status).toBe(401);
  });

  it('answers a greeting from the rules engine with suggestions', async () => {
    const { token } = await createPatient();
    const res = await api().post('/api/ai/chat').set(...auth(token)).send({ message: 'hello' });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeTruthy();
    expect(res.body.suggestions.length).toBeGreaterThan(0);
    expect(res.body.sessionId).toBeTruthy();
  });

  it('short-circuits an emergency before any model runs', async () => {
    const { token } = await createPatient();
    const res = await api().post('/api/ai/chat').set(...auth(token)).send({ message: 'I have chest pain' });

    expect(res.body.isEmergency).toBe(true);
    expect(res.body.reply).toMatch(/emergency/i);
  });

  it('keeps sessions private to their owner', async () => {
    const a = await createPatient();
    const b = await createPatient();
    const created = await api().post('/api/ai/chat').set(...auth(a.token)).send({ message: 'hello' });

    const res = await api().get(`/api/ai/chat/${created.body.sessionId}`).set(...auth(b.token));
    expect(res.status).toBe(404);
  });
});
