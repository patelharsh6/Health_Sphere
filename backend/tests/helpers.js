/**
 * Fixture builders shared by the suites.
 *
 * These go through the real models (not raw inserts) so schema hooks — password
 * hashing, slug generation — run exactly as they do in production.
 */
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Doctor = require('../src/models/Doctor');
const Admin = require('../src/models/Admin');
const Disease = require('../src/models/Disease');
const Medicine = require('../src/models/Medicine');
const { generateToken } = require('../src/utils/jwt');

// Satisfies the server's STRONG_PASSWORD rule.
const VALID_PASSWORD = 'TestPass1!';

let counter = 0;
const uniqueEmail = (prefix = 'user') => `${prefix}${++counter}@example.com`;

const createPatient = async (overrides = {}) => {
  const user = await User.create({
    fullName: overrides.fullName || 'Test Patient',
    email: overrides.email || uniqueEmail('patient'),
    phone: overrides.phone || '9876543210',
    password: overrides.password || VALID_PASSWORD,
    role: 'patient',
    termsAccepted: true,
    ...(overrides.userFields || {}),
  });
  const profile = await Patient.create({
    user: user._id,
    gender: overrides.gender || 'male',
    dateOfBirth: overrides.dateOfBirth || new Date('1995-01-01'),
  });
  return { user, profile, token: generateToken(user) };
};

const createDoctor = async (overrides = {}) => {
  const user = await User.create({
    fullName: overrides.fullName || 'Test Doctor',
    email: overrides.email || uniqueEmail('doctor'),
    phone: overrides.phone || '9876500000',
    password: overrides.password || VALID_PASSWORD,
    role: 'doctor',
    termsAccepted: true,
  });
  const profile = await Doctor.create({
    user: user._id,
    medicalLicense: overrides.medicalLicense || `LIC-${counter}-${Date.now()}`,
    specialization: overrides.specialization || 'Cardiologist',
    hospital: overrides.hospital || 'City General Hospital',
    experience: overrides.experience ?? 5,
    consultationFee: overrides.consultationFee ?? 500,
    // Verified by default: most tests need a bookable doctor. Pass
    // { isVerified: false } to exercise the verification gate.
    isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true,
    rating: overrides.rating ?? 4,
    weeklySchedule: overrides.weeklySchedule || [
      { day: 'Monday', enabled: true, slots: ['09:00', '09:30', '10:00'] },
      { day: 'Tuesday', enabled: true, slots: ['09:00', '09:30'] },
      { day: 'Wednesday', enabled: true, slots: ['09:00', '09:30'] },
      { day: 'Thursday', enabled: true, slots: ['09:00', '09:30'] },
      { day: 'Friday', enabled: true, slots: ['09:00', '09:30'] },
      { day: 'Saturday', enabled: true, slots: ['09:00', '09:30'] },
      { day: 'Sunday', enabled: false, slots: [] },
    ],
  });
  return { user, profile, token: generateToken(user) };
};

const createAdmin = async (overrides = {}) => {
  const user = await User.create({
    fullName: overrides.fullName || 'Test Admin',
    email: overrides.email || uniqueEmail('admin'),
    phone: '9876511111',
    password: VALID_PASSWORD,
    role: 'admin',
    termsAccepted: true,
  });
  const profile = await Admin.create({ user: user._id, hospitalId: 'HOSP-1' });
  return { user, profile, token: generateToken(user) };
};

const createDisease = (overrides = {}) =>
  Disease.create({
    name: overrides.name || 'Test Condition',
    slug: overrides.slug,
    description: overrides.description || 'A condition used in tests.',
    category: overrides.category || 'Respiratory',
    symptoms: overrides.symptoms || ['cough', 'fever', 'fatigue'],
    severity: overrides.severity || 'mild',
    specialistType: overrides.specialistType || 'General Physician',
    ...overrides,
  });

const createMedicine = (overrides = {}) =>
  Medicine.create({
    name: overrides.name || 'Testicillin',
    slug: overrides.slug,
    genericName: overrides.genericName || 'testicillin sodium',
    summary: overrides.summary || 'A medicine used in tests.',
    description: overrides.description || 'Longer description for tests.',
    category: overrides.category || 'Antibiotic',
    type: overrides.type || 'Tablet',
    prescriptionRequired: overrides.prescriptionRequired ?? true,
    uses: overrides.uses || ['test infections'],
    ...overrides,
  });

/** Next occurrence of a weekday, so bookings are always in the future. */
const nextWeekday = (weekday = 'Monday') => {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const target = names.indexOf(weekday);
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== target);
  return d;
};

const auth = (token) => ['Authorization', `Bearer ${token}`];

module.exports = {
  VALID_PASSWORD,
  uniqueEmail,
  createPatient,
  createDoctor,
  createAdmin,
  createDisease,
  createMedicine,
  nextWeekday,
  auth,
};
