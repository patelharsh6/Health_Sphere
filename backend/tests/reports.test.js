const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');
const Report = require('../src/models/Report');
const Appointment = require('../src/models/Appointment');
const { createPatient, createDoctor, createAdmin, auth, nextWeekday } = require('./helpers');

const api = () => request(app);
const UPLOADS = path.resolve(__dirname, '../uploads');

/** A report owned by `patient`, with a real file on disk so the stream path works. */
const seedReport = async (patient, overrides = {}) => {
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
  const fileName = `test-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  const filePath = path.join(UPLOADS, fileName);
  fs.writeFileSync(filePath, '%PDF-1.4 test fixture');

  const report = await Report.create({
    patient: patient.user._id,
    title: 'Blood Test',
    type: 'blood_test',
    filePath,
    originalFileName: 'blood.pdf',
    status: 'analyzed',
    aiAnalysis: {
      summary: 'Test summary',
      riskLevel: 'low',
      riskScore: 10,
      findings: [
        { parameter: 'Hemoglobin', value: '14.2', numericValue: 14.2, unit: 'g/dL', normalRange: '13.5-17.5', status: 'normal', trend: '' },
      ],
      recommendations: ['Stay healthy.'],
      parametersFound: 1,
    },
    ...overrides,
  });
  return { report, filePath };
};

afterEach(() => {
  // Remove fixture files so the uploads dir does not accumulate.
  if (!fs.existsSync(UPLOADS)) return;
  fs.readdirSync(UPLOADS)
    .filter((f) => f.startsWith('test-'))
    .forEach((f) => fs.unlinkSync(path.join(UPLOADS, f)));
});

describe('Report access control', () => {
  it('lets the owner read their own report', async () => {
    const owner = await createPatient();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}`).set(...auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Blood Test');
  });

  it('returns 403, not 401, when another patient requests it', async () => {
    // 401 would make the intruder's own client log them out, masking the real
    // answer — and the frontend interceptor treats 401 as "session expired".
    const owner = await createPatient();
    const intruder = await createPatient();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}`).set(...auth(intruder.token));
    expect(res.status).toBe(403);
  });

  it('blocks a doctor with no appointment with that patient', async () => {
    const owner = await createPatient();
    const stranger = await createDoctor();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}`).set(...auth(stranger.token));
    expect(res.status).toBe(403);
  });

  it('allows a doctor who shares an appointment with the patient', async () => {
    const owner = await createPatient();
    const treating = await createDoctor();
    const { report } = await seedReport(owner);

    await Appointment.create({
      patient: owner.user._id,
      doctor: treating.user._id,
      date: nextWeekday('Monday'),
      time: '09:00',
      reason: 'Checkup',
      consultationFee: 500,
      status: 'confirmed',
    });

    const res = await api().get(`/api/reports/${report._id}`).set(...auth(treating.token));
    expect(res.status).toBe(200);
  });

  it('lets an admin read any report', async () => {
    const owner = await createPatient();
    const admin = await createAdmin();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}`).set(...auth(admin.token));
    expect(res.status).toBe(200);
  });

  it('never exposes filePath, only a fileUrl', async () => {
    const owner = await createPatient();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}`).set(...auth(owner.token));
    expect(res.body.data.filePath).toBeUndefined();
    expect(res.body.data.fileUrl).toBeTruthy();
  });
});

describe('GET /api/reports/:id/file', () => {
  it('streams the file to the owner', async () => {
    const owner = await createPatient();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}/file`).set(...auth(owner.token));
    expect(res.status).toBe(200);
  });

  it('refuses another patient', async () => {
    const owner = await createPatient();
    const intruder = await createPatient();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}/file`).set(...auth(intruder.token));
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const owner = await createPatient();
    const { report } = await seedReport(owner);

    const res = await api().get(`/api/reports/${report._id}/file`);
    expect(res.status).toBe(401);
  });
});

describe('Uploads are not served statically', () => {
  it('404s a direct /uploads path for a medical report', async () => {
    const owner = await createPatient();
    const { filePath } = await seedReport(owner);
    const name = path.basename(filePath);

    const res = await api().get(`/uploads/${name}`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/reports/:id', () => {
  it('lets the owner delete, and removes the file from disk', async () => {
    const owner = await createPatient();
    const { report, filePath } = await seedReport(owner);

    const res = await api().delete(`/api/reports/${report._id}`).set(...auth(owner.token));
    expect(res.status).toBe(200);
    expect(await Report.findById(report._id)).toBeNull();
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('refuses a different patient', async () => {
    const owner = await createPatient();
    const intruder = await createPatient();
    const { report } = await seedReport(owner);

    const res = await api().delete(`/api/reports/${report._id}`).set(...auth(intruder.token));
    expect(res.status).toBe(403);
    expect(await Report.findById(report._id)).not.toBeNull();
  });
});

describe('Report validation', () => {
  it('400s a malformed ObjectId instead of throwing a CastError 500', async () => {
    const owner = await createPatient();
    const res = await api().get('/api/reports/not-an-object-id').set(...auth(owner.token));
    expect(res.status).toBe(400);
  });

  it('404s a well-formed id that does not exist', async () => {
    const owner = await createPatient();
    const res = await api()
      .get('/api/reports/012345678901234567890123')
      .set(...auth(owner.token));
    expect(res.status).toBe(404);
  });
});
