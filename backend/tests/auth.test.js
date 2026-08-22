const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Admin = require('../src/models/Admin');
const {
  VALID_PASSWORD, createPatient, createDoctor, auth,
} = require('./helpers');

const api = () => request(app);

describe('POST /api/auth/register', () => {
  const base = {
    fullName: 'New Patient',
    email: 'new.patient@example.com',
    phone: '9876543210',
    password: VALID_PASSWORD,
    role: 'patient',
    termsAccepted: true,
    gender: 'female',
    dob: '1990-05-05',
  };

  it('creates a patient and returns a token', async () => {
    const res = await api().post('/api/auth/register').send(base);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects a weak password with a 400 and a field error, not a 500', async () => {
    const res = await api().post('/api/auth/register').send({ ...base, password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('rejects a duplicate email without creating a second user', async () => {
    await api().post('/api/auth/register').send(base);
    const res = await api().post('/api/auth/register').send(base);

    expect([400, 409]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(await User.countDocuments({ email: base.email })).toBe(1);
  });

  it('creates an Admin document carrying hospitalId', async () => {
    const res = await api().post('/api/auth/register').send({
      ...base, email: 'admin.new@example.com', role: 'admin', hospitalId: 'HOSP-42',
    });

    expect(res.status).toBe(201);
    const admin = await Admin.findOne().populate('user');
    expect(admin.hospitalId).toBe('HOSP-42');
  });

  it('creates a self-registered doctor as unverified', async () => {
    const res = await api().post('/api/auth/register').send({
      ...base,
      email: 'doc.new@example.com',
      role: 'doctor',
      medicalLicense: 'LIC-TEST-1',
      specialization: 'Cardiologist',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/pending verification/i);
    expect((await Doctor.findOne()).isVerified).toBe(false);

    // register() returns publicUser(), which deliberately omits isVerified;
    // login and getMe are the endpoints that surface the flag the UI gates on.
    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'doc.new@example.com', password: VALID_PASSWORD });
    expect(login.body.data.isVerified).toBe(false);
  });

  it('does not strand a User when profile creation fails', async () => {
    // A doctor with no medicalLicense fails Doctor validation after the User
    // has already been written; the rollback must delete that User, or its
    // email could never be registered again.
    const res = await api().post('/api/auth/register').send({
      ...base, email: 'orphan@example.com', role: 'doctor', specialization: 'Cardiologist',
    });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await User.countDocuments({ email: 'orphan@example.com' })).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with correct credentials', async () => {
    const { user } = await createPatient({ email: 'login@example.com' });
    const res = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: VALID_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it('rejects a wrong password', async () => {
    const { user } = await createPatient({ email: 'login2@example.com' });
    const res = await api()
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPass1!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('does not reveal whether an email exists', async () => {
    const res = await api()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: VALID_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.message).not.toMatch(/not found|no account|does not exist/i);
  });
});

describe('Token handling', () => {
  it('rejects a request with no token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const res = await api().get('/api/auth/me').set(...auth('not-a-real-token'));
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { user } = await createPatient();
    const expired = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await api().get('/api/auth/me').set(...auth(expired));
    expect(res.status).toBe(401);
  });

  it('rejects a token issued before a password change', async () => {
    const { user } = await createPatient();

    // A realistically "stolen" token: issued before the change, not in the same
    // second as it. passwordChangedAt is deliberately backdated 1s so the token
    // the change itself hands back stays valid, and JWT `iat` only has
    // second granularity — together that leaves a bounded <=1s window where an
    // older token is still accepted. Signing 5s in the past models the real case.
    const stolen = jwt.sign(
      { id: user._id, email: user.email, role: user.role, iat: Math.floor(Date.now() / 1000) - 5 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // The token works before the change...
    expect((await api().get('/api/auth/me').set(...auth(stolen))).status).toBe(200);

    // ...and must stop the moment the owner changes their password.
    const changed = await api()
      .put('/api/auth/password')
      .set(...auth(stolen))
      .send({ currentPassword: VALID_PASSWORD, newPassword: 'BrandNew1!' });
    expect(changed.status).toBe(200);

    const after = await api().get('/api/auth/me').set(...auth(stolen));
    expect(after.status).toBe(401);
  });
});

describe('PUT /api/auth/password', () => {
  it('returns 403 (not 401) for a wrong current password', async () => {
    // A 401 here would make the client wipe a perfectly valid session.
    const { token } = await createPatient();
    const res = await api()
      .put('/api/auth/password')
      .set(...auth(token))
      .send({ currentPassword: 'NotMyPass1!', newPassword: 'Another1!' });

    expect(res.status).toBe(403);
  });

  it('rotates the token on success', async () => {
    const { token } = await createPatient();
    const res = await api()
      .put('/api/auth/password')
      .set(...auth(token))
      .send({ currentPassword: VALID_PASSWORD, newPassword: 'Another1!' });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.token).not.toBe(token);
  });
});

describe('Password reset flow', () => {
  it('answers identically for known and unknown emails', async () => {
    await createPatient({ email: 'known@example.com' });

    const known = await api().post('/api/auth/forgot-password').send({ email: 'known@example.com' });
    const unknown = await api().post('/api/auth/forgot-password').send({ email: 'ghost@example.com' });

    expect(known.status).toBe(unknown.status);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('stores only a hash of the reset token', async () => {
    await createPatient({ email: 'reset@example.com' });
    const res = await api().post('/api/auth/forgot-password').send({ email: 'reset@example.com' });

    const raw = res.body.data.resetToken;
    const user = await User.findOne({ email: 'reset@example.com' }).select('+resetPasswordToken');
    expect(raw).toBeTruthy();
    expect(user.resetPasswordToken).toBeTruthy();
    expect(user.resetPasswordToken).not.toBe(raw);
  });

  it('resets the password and consumes the token exactly once', async () => {
    await createPatient({ email: 'reset2@example.com' });
    const forgot = await api().post('/api/auth/forgot-password').send({ email: 'reset2@example.com' });
    const raw = forgot.body.data.resetToken;

    const first = await api()
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: 'Rotated1!' });
    expect(first.status).toBe(200);

    // Single use: the same link must not work twice.
    const second = await api()
      .post(`/api/auth/reset-password/${raw}`)
      .send({ password: 'Rotated2!' });
    expect(second.status).toBeGreaterThanOrEqual(400);

    // And the new password is live.
    const login = await api()
      .post('/api/auth/login')
      .send({ email: 'reset2@example.com', password: 'Rotated1!' });
    expect(login.status).toBe(200);
  });
});

describe('Role guards', () => {
  it('keeps a patient out of doctor-only routes with 403', async () => {
    const { token } = await createPatient();
    const res = await api().get('/api/doctors/dashboard').set(...auth(token));
    expect(res.status).toBe(403);
  });

  it('keeps a doctor out of admin-only routes with 403', async () => {
    const { token } = await createDoctor();
    const res = await api().get('/api/admin/stats').set(...auth(token));
    expect(res.status).toBe(403);
  });
});
