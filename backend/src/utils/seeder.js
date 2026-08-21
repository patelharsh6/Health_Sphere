/**
 * Database Seeder — Populates the DB with sample data for development
 * Run: npm run seed
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
const diseases = require('./seedData/diseases');
const medicines = require('./seedData/medicines');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...\n');

    // ── Clear existing data ──
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Admin.deleteMany({});
    await Disease.deleteMany({});
    await Medicine.deleteMany({});
    console.log('🗑️  Cleared existing data.');

    // ══════════════════════════════════════
    // 1. SEED USERS & PROFILES
    // ══════════════════════════════════════

    // Admin
    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@healthsphere.com',
      phone: '9999999999',
      password: 'Admin@1234',
      role: 'admin',
      termsAccepted: true,
      aiDisclaimerAccepted: true,
    });
    await Admin.create({
      user: admin._id,
      hospitalId: 'HOSP-001',
      permissions: ['manage_users', 'verify_doctors', 'manage_content', 'view_reports', 'manage_appointments'],
    });
    console.log('👑 Admin created: admin@healthsphere.com / Admin@1234');

    // Patients
    const patient1 = await User.create({
      fullName: 'Harsh Patel',
      email: 'harsh@example.com',
      phone: '9876543210',
      password: 'Patient@1234',
      role: 'patient',
      termsAccepted: true,
      aiDisclaimerAccepted: true,
    });
    await Patient.create({
      user: patient1._id,
      dateOfBirth: new Date('2002-05-15'),
      gender: 'male',
      bloodGroup: 'B+',
      height: 175,
      weight: 72,
      allergies: ['Dust', 'Pollen'],
      chronicConditions: [],
    });

    const patient2 = await User.create({
      fullName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543211',
      password: 'Patient@1234',
      role: 'patient',
      termsAccepted: true,
      aiDisclaimerAccepted: true,
    });
    await Patient.create({
      user: patient2._id,
      dateOfBirth: new Date('1995-08-22'),
      gender: 'female',
      bloodGroup: 'O+',
      height: 162,
      weight: 58,
    });
    console.log('🧑 2 Patients created');

    // Doctors
    const doctorUsers = [
      { fullName: 'Dr. Rahul Sharma', email: 'rahul.doc@healthsphere.com', phone: '9000000001', license: 'MD-10001', spec: 'Cardiologist', exp: 12, hospital: 'City Heart Center', fee: 800, rating: 4.8 },
      { fullName: 'Dr. Sneha Patel', email: 'sneha.doc@healthsphere.com', phone: '9000000002', license: 'MD-10002', spec: 'Dermatologist', exp: 8, hospital: 'SkinCare Clinic', fee: 600, rating: 4.9 },
      { fullName: 'Dr. Amit Kumar', email: 'amit.doc@healthsphere.com', phone: '9000000003', license: 'MD-10003', spec: 'General Physician', exp: 15, hospital: 'HealthSphere Main', fee: 500, rating: 4.7 },
      { fullName: 'Dr. Priya Singh', email: 'priya.doc@healthsphere.com', phone: '9000000004', license: 'MD-10004', spec: 'Pediatrician', exp: 10, hospital: 'Kids Care Hospital', fee: 700, rating: 4.9 },
      { fullName: 'Dr. Vikram Joshi', email: 'vikram.doc@healthsphere.com', phone: '9000000005', license: 'MD-10005', spec: 'Neurologist', exp: 14, hospital: 'Neuro Spine Center', fee: 1000, rating: 4.6 },
      { fullName: 'Dr. Anjali Desai', email: 'anjali.doc@healthsphere.com', phone: '9000000006', license: 'MD-10006', spec: 'General Physician', exp: 6, hospital: 'HealthSphere Main', fee: 400, rating: 4.5 },
    ];

    const generateSlots = (startH, endH) => {
      const slots = [];
      for (let h = startH; h < endH; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
      }
      return slots;
    };

    const defaultSchedule = [
      { day: 'Monday', enabled: true, slots: generateSlots(9, 17) },
      { day: 'Tuesday', enabled: true, slots: generateSlots(9, 17) },
      { day: 'Wednesday', enabled: true, slots: generateSlots(9, 17) },
      { day: 'Thursday', enabled: true, slots: generateSlots(9, 17) },
      { day: 'Friday', enabled: true, slots: generateSlots(9, 17) },
      { day: 'Saturday', enabled: true, slots: generateSlots(10, 14) },
      { day: 'Sunday', enabled: false, slots: [] },
    ];

    for (const doc of doctorUsers) {
      const user = await User.create({
        fullName: doc.fullName,
        email: doc.email,
        phone: doc.phone,
        password: 'Doctor@1234',
        role: 'doctor',
        termsAccepted: true,
        aiDisclaimerAccepted: true,
      });
      await Doctor.create({
        user: user._id,
        medicalLicense: doc.license,
        specialization: doc.spec,
        experience: doc.exp,
        hospital: doc.hospital,
        consultationFee: doc.fee,
        rating: doc.rating,
        totalRatings: Math.floor(Math.random() * 200) + 50,
        weeklySchedule: defaultSchedule,
        slotDuration: 30,
        isVerified: true,
      });
    }
    console.log('🩺 6 Doctors created');

    // ══════════════════════════════════════
    // 2. SEED DISEASES
    // ══════════════════════════════════════

    await Disease.insertMany(diseases);
    console.log(`🦠 ${diseases.length} Diseases seeded`);

    // ══════════════════════════════════════
    // 3. SEED MEDICINES
    // ══════════════════════════════════════

    await Medicine.insertMany(medicines);
    console.log(`💊 ${medicines.length} Medicines seeded`);

    // ══════════════════════════════════════
    console.log('\n✅ Database seeding completed successfully!');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('   Admin   → admin@healthsphere.com / Admin@1234');
    console.log('   Patient → harsh@example.com / Patient@1234');
    console.log('   Doctor  → rahul.doc@healthsphere.com / Doctor@1234');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
