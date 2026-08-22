const request = require('supertest');
const app = require('../src/app');
const Appointment = require('../src/models/Appointment');
const { createPatient, createDoctor, auth, nextWeekday } = require('./helpers');

const api = () => request(app);
const ymd = (d) => d.toISOString().split('T')[0];

// `doctorId` in the request body is the Doctor PROFILE id (the controller does
// Doctor.findById), while Appointment.doctor stores the linked User id.
const book = (token, doctor, date, time, extra = {}) =>
  api()
    .post('/api/appointments')
    .set(...auth(token))
    .send({ doctorId: doctor.profile._id, date: ymd(date), time, reason: 'Checkup', ...extra });

describe('POST /api/appointments — booking rules', () => {
  it('books an available slot', async () => {
    const patient = await createPatient();
    const doctor = await createDoctor();

    const res = await book(patient.token, doctor, nextWeekday('Monday'), '09:00');
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects a date in the past', async () => {
    const patient = await createPatient();
    const doctor = await createDoctor();
    const past = new Date();
    past.setDate(past.getDate() - 3);

    const res = await book(patient.token, doctor, past, '09:00');
    expect(res.status).toBe(400);
  });

  it('rejects a day the doctor has disabled', async () => {
    // The fixture doctor has Sunday enabled: false.
    const patient = await createPatient();
    const doctor = await createDoctor();

    const res = await book(patient.token, doctor, nextWeekday('Sunday'), '09:00');
    expect(res.status).toBe(400);
  });

  it('rejects a time that is not one of that day\'s slots', async () => {
    const patient = await createPatient();
    const doctor = await createDoctor();

    const res = await book(patient.token, doctor, nextWeekday('Monday'), '23:30');
    expect(res.status).toBe(400);
  });

  it('rejects an unverified doctor', async () => {
    const patient = await createPatient();
    const doctor = await createDoctor({ isVerified: false });

    const res = await book(patient.token, doctor, nextWeekday('Monday'), '09:00');
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('does not let a doctor book an appointment', async () => {
    const doctorA = await createDoctor();
    const doctorB = await createDoctor();

    const res = await book(doctorA.token, doctorB, nextWeekday('Monday'), '09:00');
    expect(res.status).toBe(403);
  });

  it('requires authentication', async () => {
    const doctor = await createDoctor();
    const res = await api()
      .post('/api/appointments')
      .send({ doctorId: doctor.profile._id, date: ymd(nextWeekday('Monday')), time: '09:00', reason: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('Double-booking', () => {
  it('gives one 201 and one 409 for the same slot', async () => {
    const p1 = await createPatient();
    const p2 = await createPatient();
    const doctor = await createDoctor();
    const date = nextWeekday('Monday');

    const first = await book(p1.token, doctor, date, '09:30');
    const second = await book(p2.token, doctor, date, '09:30');

    const codes = [first.status, second.status].sort();
    expect(codes).toEqual([201, 409]);
    expect(await Appointment.countDocuments({ doctor: doctor.user._id, time: '09:30' })).toBe(1);
  });

  it('holds under concurrent requests, not just sequential ones', async () => {
    // The findOne pre-check races; the partial unique index is what actually
    // enforces this, so fire both at once to exercise it.
    const p1 = await createPatient();
    const p2 = await createPatient();
    const doctor = await createDoctor();
    const date = nextWeekday('Tuesday');

    const [a, b] = await Promise.all([
      book(p1.token, doctor, date, '09:00'),
      book(p2.token, doctor, date, '09:00'),
    ]);

    const created = [a, b].filter((r) => r.status === 201).length;
    expect(created).toBe(1);
    expect(await Appointment.countDocuments({ doctor: doctor.user._id, date, time: '09:00' })).toBe(1);
  });

  it('frees the slot again once an appointment is cancelled', async () => {
    // The unique index is partial on status in {pending, confirmed}, so a
    // cancelled booking must not keep blocking the slot.
    const p1 = await createPatient();
    const p2 = await createPatient();
    const doctor = await createDoctor();
    const date = nextWeekday('Wednesday');

    const first = await book(p1.token, doctor, date, '09:00');
    expect(first.status).toBe(201);

    const cancel = await api()
      .put(`/api/appointments/${first.body.data._id}/cancel`)
      .set(...auth(p1.token))
      .send({ cancellationReason: 'Changed my mind' });
    expect(cancel.status).toBe(200);

    const second = await book(p2.token, doctor, date, '09:00');
    expect(second.status).toBe(201);
  });
});

describe('Appointment authorization', () => {
  const setup = async () => {
    const patient = await createPatient();
    const doctor = await createDoctor();
    const res = await book(patient.token, doctor, nextWeekday('Thursday'), '09:00');
    return { patient, doctor, id: res.body.data._id };
  };

  it('lets the owning patient read it', async () => {
    const { patient, id } = await setup();
    const res = await api().get(`/api/appointments/${id}`).set(...auth(patient.token));
    expect(res.status).toBe(200);
  });

  it('refuses an unrelated patient with 403', async () => {
    const { id } = await setup();
    const outsider = await createPatient();
    const res = await api().get(`/api/appointments/${id}`).set(...auth(outsider.token));
    expect(res.status).toBe(403);
  });

  it('refuses a non-treating doctor updating it', async () => {
    const { id } = await setup();
    const other = await createDoctor();
    const res = await api()
      .put(`/api/appointments/${id}`)
      .set(...auth(other.token))
      .send({ status: 'confirmed' });
    expect(res.status).toBe(403);
  });

  it('lets the treating doctor confirm it', async () => {
    const { doctor, id } = await setup();
    const res = await api().put(`/api/appointments/${id}/confirm`).set(...auth(doctor.token));
    expect(res.status).toBe(200);
  });

  it('only lists the caller\'s own appointments', async () => {
    const { patient } = await setup();
    const other = await createPatient();
    const otherDoctor = await createDoctor();
    await book(other.token, otherDoctor, nextWeekday('Friday'), '09:00');

    const res = await api().get('/api/appointments').set(...auth(patient.token));
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((a) => String(a.patient?._id || a.patient));
    ids.forEach((id) => expect(id).toBe(String(patient.user._id)));
  });
});

describe('GET /api/doctors/:id/slots', () => {
  it('marks a booked slot unavailable', async () => {
    const patient = await createPatient();
    const doctor = await createDoctor();
    const date = nextWeekday('Monday');

    await book(patient.token, doctor, date, '10:00');

    const res = await api().get(`/api/doctors/${doctor.profile._id}/slots`).query({ date: ymd(date) });
    expect(res.status).toBe(200);
    const slot = res.body.data.find((s) => s.time === '10:00');
    expect(slot.available).toBe(false);
  });

  it('returns nothing for a disabled day', async () => {
    const doctor = await createDoctor();
    const res = await api()
      .get(`/api/doctors/${doctor.profile._id}/slots`)
      .query({ date: ymd(nextWeekday('Sunday')) });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
