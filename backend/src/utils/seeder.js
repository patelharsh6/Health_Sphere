/**
 * Database seeder (v2).
 *
 *   npm run seed            idempotent upsert — safe to run against a database
 *                           that already has real accounts in it
 *   npm run seed -- --fresh DESTRUCTIVE: wipes the seeded collections first
 *   npm run seed -- --help  usage
 *
 * v1 always began with deleteMany on users/patients/doctors, so running it on a
 * database with real accounts destroyed them (and orphaned their reports, since
 * `reports` was never cleared). The default path here writes only what is
 * missing and never deletes, so it is safe to re-run.
 */

require('../config/env');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const Disease = require('../models/Disease');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const DoctorPatientLink = require('../models/DoctorPatientLink');
const diseases = require('./seedData/diseases');
const medicines = require('./seedData/medicines');

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const HELP = args.includes('--help') || args.includes('-h');

const log = (...a) => console.log(...a);

// ──────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────

const slotsBetween = (startH, endH) => {
  const slots = [];
  for (let h = startH; h < endH; h += 1) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
};

const WEEKDAY_SCHEDULE = [
  { day: 'Monday', enabled: true, slots: slotsBetween(9, 17) },
  { day: 'Tuesday', enabled: true, slots: slotsBetween(9, 17) },
  { day: 'Wednesday', enabled: true, slots: slotsBetween(9, 17) },
  { day: 'Thursday', enabled: true, slots: slotsBetween(9, 17) },
  { day: 'Friday', enabled: true, slots: slotsBetween(9, 17) },
  { day: 'Saturday', enabled: true, slots: slotsBetween(10, 14) },
  { day: 'Sunday', enabled: false, slots: [] },
];

const ADMINS = [
  { fullName: 'Admin User', email: 'admin@healthsphere.com', phone: '9999999999', hospitalId: 'HOSP-001' },
];

const PATIENTS = [
  { fullName: 'Harsh Patel', email: 'harsh@example.com', phone: '9876543210', dateOfBirth: '2002-05-15', gender: 'male', bloodGroup: 'B+', height: 175, weight: 72, allergies: ['Dust', 'Pollen'] },
  { fullName: 'Priya Sharma', email: 'priya@example.com', phone: '9876543211', dateOfBirth: '1995-08-22', gender: 'female', bloodGroup: 'O+', height: 162, weight: 58 },
  { fullName: 'Rohan Mehta', email: 'rohan@example.com', phone: '9876543212', dateOfBirth: '1988-03-10', gender: 'male', bloodGroup: 'A+', height: 178, weight: 84, chronicConditions: ['Hypertension'] },
  { fullName: 'Aisha Khan', email: 'aisha@example.com', phone: '9876543213', dateOfBirth: '1999-11-02', gender: 'female', bloodGroup: 'AB+', height: 158, weight: 52 },
  { fullName: 'Vikas Reddy', email: 'vikas@example.com', phone: '9876543214', dateOfBirth: '1976-07-19', gender: 'male', bloodGroup: 'O-', height: 170, weight: 90, chronicConditions: ['Type 2 Diabetes'] },
];

// Every specialistType referenced by seedData/diseases.js has a doctor here, so
// the "find a specialist" CTA on a disease page is never a dead end.
const DOCTORS = [
  { fullName: 'Dr. Rahul Sharma', email: 'rahul.doc@healthsphere.com', phone: '9000000001', license: 'MD-10001', spec: 'Cardiologist', exp: 12, hospital: 'City Heart Center', fee: 800, rating: 4.8 },
  { fullName: 'Dr. Sneha Patel', email: 'sneha.doc@healthsphere.com', phone: '9000000002', license: 'MD-10002', spec: 'Dermatologist', exp: 8, hospital: 'SkinCare Clinic', fee: 600, rating: 4.9 },
  { fullName: 'Dr. Amit Kumar', email: 'amit.doc@healthsphere.com', phone: '9000000003', license: 'MD-10003', spec: 'General Physician', exp: 15, hospital: 'HealthSphere Main', fee: 500, rating: 4.7 },
  { fullName: 'Dr. Priya Singh', email: 'priya.doc@healthsphere.com', phone: '9000000004', license: 'MD-10004', spec: 'Pediatrician', exp: 10, hospital: 'Kids Care Hospital', fee: 700, rating: 4.9 },
  { fullName: 'Dr. Vikram Joshi', email: 'vikram.doc@healthsphere.com', phone: '9000000005', license: 'MD-10005', spec: 'Neurologist', exp: 14, hospital: 'Neuro Spine Center', fee: 1000, rating: 4.6 },
  { fullName: 'Dr. Anjali Desai', email: 'anjali.doc@healthsphere.com', phone: '9000000006', license: 'MD-10006', spec: 'General Physician', exp: 6, hospital: 'HealthSphere Main', fee: 400, rating: 4.5 },
  { fullName: 'Dr. Meera Nair', email: 'meera.doc@healthsphere.com', phone: '9000000007', license: 'MD-10007', spec: 'Endocrinologist', exp: 11, hospital: 'Metabolic Care Institute', fee: 900, rating: 4.7 },
  { fullName: 'Dr. Arjun Rao', email: 'arjun.doc@healthsphere.com', phone: '9000000008', license: 'MD-10008', spec: 'Pulmonologist', exp: 9, hospital: 'Chest & Lung Centre', fee: 750, rating: 4.6 },
  { fullName: 'Dr. Kavya Iyer', email: 'kavya.doc@healthsphere.com', phone: '9000000009', license: 'MD-10009', spec: 'Psychiatrist', exp: 13, hospital: 'Mind Wellness Clinic', fee: 850, rating: 4.8 },
  { fullName: 'Dr. Sanjay Gupta', email: 'sanjay.doc@healthsphere.com', phone: '9000000010', license: 'MD-10010', spec: 'Rheumatologist', exp: 16, hospital: 'Joint Care Hospital', fee: 950, rating: 4.5 },
  { fullName: 'Dr. Neha Bansal', email: 'neha.doc@healthsphere.com', phone: '9000000011', license: 'MD-10011', spec: 'Hematologist', exp: 10, hospital: 'Blood Disorders Centre', fee: 900, rating: 4.7 },
  { fullName: 'Dr. Imran Sheikh', email: 'imran.doc@healthsphere.com', phone: '9000000012', license: 'MD-10012', spec: 'Urologist', exp: 12, hospital: 'Kidney & Urology Institute', fee: 800, rating: 4.6 },
  // Deliberately unverified, so the admin verification queue has something in it.
  { fullName: 'Dr. Pending Verify', email: 'pending.doc@healthsphere.com', phone: '9000000013', license: 'MD-10013', spec: 'General Physician', exp: 3, hospital: 'New Clinic', fee: 300, rating: 0, isVerified: false },
];

const PASSWORDS = { admin: 'Admin@1234', patient: 'Patient@1234', doctor: 'Doctor@1234' };

// ──────────────────────────────────────────────
// Idempotent upserts
// ──────────────────────────────────────────────

/**
 * Find a user by email, or create them. Returns { user, created }.
 * Never overwrites an existing user's password — re-running the seeder must not
 * reset a password someone has since changed.
 */
const upsertUser = async (fields, role, password) => {
  const existing = await User.findOne({ email: fields.email });
  if (existing) return { user: existing, created: false };

  const user = await User.create({
    ...fields,
    password,
    role,
    termsAccepted: true,
    aiDisclaimerAccepted: true,
  });
  return { user, created: true };
};

const seedAdmins = async () => {
  let created = 0;
  for (const a of ADMINS) {
    const { user, created: isNew } = await upsertUser(
      { fullName: a.fullName, email: a.email, phone: a.phone },
      'admin',
      PASSWORDS.admin
    );
    if (isNew) created += 1;
    await Admin.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          hospitalId: a.hospitalId,
          permissions: ['manage_users', 'verify_doctors', 'manage_content', 'view_reports', 'manage_appointments'],
        },
      },
      { upsert: true }
    );
  }
  log(`👑 Admins: ${created} created, ${ADMINS.length - created} already present`);
};

const seedPatients = async () => {
  const out = [];
  let created = 0;
  for (const p of PATIENTS) {
    const { user, created: isNew } = await upsertUser(
      { fullName: p.fullName, email: p.email, phone: p.phone },
      'patient',
      PASSWORDS.patient
    );
    if (isNew) created += 1;
    const profile = await Patient.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          dateOfBirth: new Date(p.dateOfBirth),
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          height: p.height,
          weight: p.weight,
          allergies: p.allergies || [],
          chronicConditions: p.chronicConditions || [],
        },
      },
      { upsert: true, new: true }
    );
    out.push({ user, profile });
  }
  log(`🧑 Patients: ${created} created, ${PATIENTS.length - created} already present`);
  return out;
};

const seedDoctors = async () => {
  const out = [];
  let created = 0;
  for (const d of DOCTORS) {
    const { user, created: isNew } = await upsertUser(
      { fullName: d.fullName, email: d.email, phone: d.phone },
      'doctor',
      PASSWORDS.doctor
    );
    if (isNew) created += 1;
    const profile = await Doctor.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          medicalLicense: d.license,
          specialization: d.spec,
          experience: d.exp,
          hospital: d.hospital,
          consultationFee: d.fee,
          rating: d.rating,
          totalRatings: d.rating ? 60 : 0,
          weeklySchedule: WEEKDAY_SCHEDULE,
          slotDuration: 30,
          // Seeded doctors are verified on purpose so a fresh demo has
          // bookable doctors; only self-registration is gated.
          isVerified: d.isVerified !== undefined ? d.isVerified : true,
        },
      },
      { upsert: true, new: true }
    );
    out.push({ user, profile, spec: d.spec });
  }
  log(`🩺 Doctors: ${created} created, ${DOCTORS.length - created} already present`);
  return out;
};

/** Catalog docs are keyed by slug, so an upsert keeps edits from duplicating. */
const seedCatalog = async () => {
  let d = 0;
  for (const disease of diseases) {
    const res = await Disease.updateOne({ slug: disease.slug }, { $setOnInsert: disease }, { upsert: true });
    if (res.upsertedCount) d += 1;
  }
  let m = 0;
  for (const medicine of medicines) {
    const res = await Medicine.updateOne({ slug: medicine.slug }, { $setOnInsert: medicine }, { upsert: true });
    if (res.upsertedCount) m += 1;
  }
  log(`🦠 Diseases: ${d} created, ${diseases.length - d} already present`);
  log(`💊 Medicines: ${m} created, ${medicines.length - m} already present`);
};

/** Next occurrence of a weekday at a given slot, so bookings are in the future. */
const upcoming = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  // Skip Sunday: every seeded doctor has it disabled.
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
};

/**
 * Sample appointments so both dashboards have data on a clean clone.
 * Keyed on { patient, doctor, date, time } so re-running does not duplicate,
 * and so it never trips the partial unique index.
 */
const seedAppointments = async (patients, doctors) => {
  const plan = [
    { p: 0, d: 2, offset: 1, time: '09:00', status: 'confirmed', reason: 'Persistent cough and mild fever' },
    { p: 0, d: 0, offset: 4, time: '10:30', status: 'pending', reason: 'Routine cardiac checkup' },
    { p: 1, d: 1, offset: 2, time: '11:00', status: 'confirmed', reason: 'Recurring skin rash' },
    { p: 2, d: 0, offset: -7, time: '09:30', status: 'completed', reason: 'Blood pressure review' },
    { p: 2, d: 6, offset: 3, time: '14:00', status: 'confirmed', reason: 'Thyroid follow-up' },
    { p: 3, d: 8, offset: 5, time: '15:30', status: 'pending', reason: 'Anxiety and poor sleep' },
    { p: 4, d: 6, offset: -14, time: '10:00', status: 'completed', reason: 'Diabetes management' },
    { p: 4, d: 7, offset: 6, time: '09:00', status: 'confirmed', reason: 'Shortness of breath' },
  ];

  let created = 0;
  for (const a of plan) {
    const patient = patients[a.p];
    const doctor = doctors[a.d];
    if (!patient || !doctor) continue;

    const date = upcoming(a.offset);
    const exists = await Appointment.findOne({
      patient: patient.user._id, doctor: doctor.user._id, date, time: a.time,
    });
    if (exists) continue;

    await Appointment.create({
      patient: patient.user._id,
      doctor: doctor.user._id,
      date,
      time: a.time,
      reason: a.reason,
      consultationFee: doctor.profile.consultationFee,
      status: a.status,
    });
    created += 1;

    await DoctorPatientLink.findOneAndUpdate(
      { doctor: doctor.user._id, patient: patient.user._id },
      { $setOnInsert: { status: 'Active' }, $set: { primaryCondition: a.reason } },
      { upsert: true }
    );
  }
  log(`📅 Appointments: ${created} created, ${plan.length - created} already present`);
};

/**
 * Sample analysed reports, including a pair for one patient so the trends
 * endpoint has a history to compare against.
 *
 * No file is written to disk: filePath points at a placeholder, so downloading
 * one 404s while every list and analysis view still renders. Re-analysing a
 * sample report will fail, which is the honest outcome for a file that is not
 * really there.
 */
const seedReports = async (patients) => {
  const finding = (parameter, value, unit, normalRange, status, trend = '') => ({
    parameter, value: String(value), numericValue: value, unit, normalRange, status, trend,
  });

  const plan = [
    {
      p: 2, title: 'Lipid Profile — March', daysAgo: 120, riskLevel: 'moderate', riskScore: 33,
      findings: [
        finding('Cholesterol', 232, 'mg/dL', '0-200', 'high'),
        finding('LDL Cholesterol', 158, 'mg/dL', '0-100', 'high'),
        finding('HDL Cholesterol', 39, 'mg/dL', '40-60', 'low'),
      ],
    },
    {
      p: 2, title: 'Lipid Profile — August', daysAgo: 5, riskLevel: 'moderate', riskScore: 25,
      findings: [
        finding('Cholesterol', 208, 'mg/dL', '0-200', 'high', 'down'),
        finding('LDL Cholesterol', 132, 'mg/dL', '0-100', 'high', 'down'),
        finding('HDL Cholesterol', 44, 'mg/dL', '40-60', 'normal', 'up'),
      ],
    },
    {
      p: 4, title: 'Diabetes Panel', daysAgo: 10, riskLevel: 'high', riskScore: 55,
      findings: [
        finding('Blood Sugar (Fasting)', 148, 'mg/dL', '70-100', 'high'),
        finding('HbA1c', 8.1, '%', '4-5.7', 'high'),
        finding('Creatinine', 1.2, 'mg/dL', '0.7-1.3', 'normal'),
      ],
    },
    {
      p: 0, title: 'Complete Blood Count', daysAgo: 20, riskLevel: 'low', riskScore: 0,
      findings: [
        finding('Hemoglobin', 14.6, 'g/dL', '13.5-17.5', 'normal'),
        finding('WBC Count', 7200, '/µL', '4000-11000', 'normal'),
        finding('Platelet Count', 245000, '/µL', '150000-410000', 'normal'),
      ],
    },
  ];

  let created = 0;
  for (const r of plan) {
    const patient = patients[r.p];
    if (!patient) continue;
    if (await Report.findOne({ patient: patient.user._id, title: r.title })) continue;

    const uploadDate = new Date();
    uploadDate.setDate(uploadDate.getDate() - r.daysAgo);

    const abnormal = r.findings.filter((f) => f.status !== 'normal').length;

    await Report.create({
      patient: patient.user._id,
      title: r.title,
      type: 'blood_test',
      // Intentionally not a real file — see the note above.
      filePath: `seed-placeholder/${r.title.replace(/\W+/g, '-').toLowerCase()}.pdf`,
      originalFileName: 'sample-report.pdf',
      status: 'analyzed',
      uploadDate,
      createdAt: uploadDate,
      aiAnalysis: {
        summary: abnormal
          ? `Extracted ${r.findings.length} lab parameters. ${abnormal} fall outside the reference range.`
          : `Extracted ${r.findings.length} lab parameters; all of them fall within their reference ranges.`,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        findings: r.findings,
        recommendations: abnormal
          ? ['Review these results with a doctor.', 'This automated analysis is not a diagnosis.']
          : ['All extracted values look normal.', 'This automated analysis is not a diagnosis.'],
        parametersFound: r.findings.length,
        analyzedAt: uploadDate,
      },
    });
    created += 1;
  }
  log(`🧪 Reports: ${created} created, ${plan.length - created} already present`);
};

// ──────────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────────

const wipe = async () => {
  // Only the collections this seeder owns. Reports and appointments are
  // included here (v1 left reports behind, orphaning them from deleted users).
  const models = [Appointment, Report, DoctorPatientLink, Admin, Patient, Doctor, User, Disease, Medicine];
  for (const model of models) {
    const { deletedCount } = await model.deleteMany({});
    log(`   dropped ${deletedCount} from ${model.collection.collectionName}`);
  }
};

const usage = () => {
  log(`
HealthSphere database seeder

  npm run seed              Idempotent. Adds only what is missing; never
                            deletes, never resets an existing password.
  npm run seed -- --fresh   DESTRUCTIVE. Wipes users, patients, doctors,
                            admins, appointments, reports, diseases and
                            medicines first, then seeds from scratch.
  npm run seed -- --help    This message.

Test credentials after seeding:
  Admin   admin@healthsphere.com      / ${PASSWORDS.admin}
  Patient harsh@example.com           / ${PASSWORDS.patient}
  Doctor  rahul.doc@healthsphere.com  / ${PASSWORDS.doctor}
`);
};

const run = async () => {
  if (HELP) {
    usage();
    process.exit(0);
  }

  await connectDB();

  if (FRESH) {
    log('\n⚠️  --fresh: wiping seeded collections...');
    await wipe();
    log('');
  } else {
    log('\n🌱 Idempotent seed (no data will be deleted). Use --fresh to start clean.\n');
  }

  await seedAdmins();
  const patients = await seedPatients();
  const doctors = await seedDoctors();
  await seedCatalog();
  await seedAppointments(patients, doctors);
  await seedReports(patients);

  // Every specialistType a disease points at should resolve to a real doctor,
  // or the "find a specialist" CTA on that disease page is a dead end.
  const needed = await Disease.distinct('specialistType');
  const have = new Set((await Doctor.find({ isVerified: true }).select('specialization')).map((d) => d.specialization));
  const missing = needed.filter((n) => !have.has(n));
  log(
    missing.length
      ? `\n⚠️  No verified doctor for: ${missing.join(', ')}`
      : '\n✅ Every disease specialistType resolves to a verified doctor.'
  );

  usage();
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error('❌ Seeding failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
