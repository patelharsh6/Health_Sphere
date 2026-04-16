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
const Disease = require('../models/Disease');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seeding...\n');

    // ── Clear existing data ──
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await Disease.deleteMany({});
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

    const defaultSlots = [
      { day: 'Monday', startTime: '09:00', endTime: '17:00' },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'Friday', startTime: '09:00', endTime: '17:00' },
      { day: 'Saturday', startTime: '10:00', endTime: '14:00' },
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
        availableSlots: defaultSlots,
        isVerified: true,
      });
    }
    console.log('🩺 6 Doctors created');

    // ══════════════════════════════════════
    // 2. SEED DISEASES
    // ══════════════════════════════════════

    const diseases = [
      {
        name: 'Influenza',
        description: 'A contagious respiratory illness caused by influenza viruses. It can cause mild to severe illness and sometimes lead to death.',
        category: 'Respiratory',
        symptoms: ['fever', 'cough', 'sore throat', 'runny nose', 'body aches', 'headache', 'fatigue', 'chills'],
        causes: ['Influenza virus (Type A, B, C)', 'Airborne droplets from infected person'],
        riskFactors: ['Weak immune system', 'Age (children & elderly)', 'Chronic illness', 'Pregnancy'],
        treatments: [
          { name: 'Oseltamivir (Tamiflu)', description: 'Antiviral medication', type: 'medication' },
          { name: 'Rest & Hydration', description: 'Bed rest and plenty of fluids', type: 'lifestyle' },
        ],
        preventions: ['Annual flu vaccination', 'Frequent handwashing', 'Avoid close contact with sick people'],
        relatedMedicines: ['Paracetamol', 'Oseltamivir', 'Ibuprofen'],
        severity: 'moderate',
        specialistType: 'General Physician',
      },
      {
        name: 'Hypertension',
        description: 'A chronic medical condition in which blood pressure in the arteries is persistently elevated, increasing the risk of heart disease and stroke.',
        category: 'Cardiovascular',
        symptoms: ['headache', 'shortness of breath', 'nosebleed', 'dizziness', 'chest pain', 'blurred vision'],
        causes: ['Genetics', 'High salt diet', 'Obesity', 'Lack of exercise', 'Stress'],
        riskFactors: ['Family history', 'Age above 40', 'Obesity', 'Smoking', 'Excessive alcohol'],
        treatments: [
          { name: 'ACE Inhibitors', description: 'Medication to relax blood vessels', type: 'medication' },
          { name: 'Lifestyle Changes', description: 'Diet, exercise, stress management', type: 'lifestyle' },
        ],
        preventions: ['Reduce salt intake', 'Regular exercise', 'Maintain healthy weight', 'Limit alcohol'],
        relatedMedicines: ['Amlodipine', 'Losartan', 'Metoprolol'],
        severity: 'severe',
        specialistType: 'Cardiologist',
      },
      {
        name: 'Type 2 Diabetes',
        description: 'A chronic condition that affects the way the body processes blood sugar (glucose). With type 2 diabetes, the body either resists the effects of insulin or does not produce enough.',
        category: 'Chronic',
        symptoms: ['increased thirst', 'frequent urination', 'unexplained weight loss', 'fatigue', 'blurred vision', 'slow healing wounds', 'tingling in hands or feet'],
        causes: ['Insulin resistance', 'Genetics', 'Obesity', 'Sedentary lifestyle'],
        riskFactors: ['Obesity', 'Family history', 'Age above 45', 'Physical inactivity', 'PCOS'],
        treatments: [
          { name: 'Metformin', description: 'Oral medication to control blood sugar', type: 'medication' },
          { name: 'Insulin Therapy', description: 'For advanced cases', type: 'medication' },
          { name: 'Diet Control', description: 'Low-carb, balanced meals', type: 'lifestyle' },
        ],
        preventions: ['Healthy diet', 'Regular exercise', 'Maintain healthy weight', 'Regular blood sugar checks'],
        relatedMedicines: ['Metformin', 'Glimepiride', 'Insulin'],
        severity: 'severe',
        specialistType: 'General Physician',
      },
      {
        name: 'Migraine',
        description: 'A neurological condition characterized by intense, debilitating headaches often accompanied by nausea, vomiting, and sensitivity to light and sound.',
        category: 'Neurological',
        symptoms: ['severe headache', 'nausea', 'vomiting', 'sensitivity to light', 'sensitivity to sound', 'aura', 'dizziness', 'blurred vision'],
        causes: ['Neurological changes', 'Hormonal changes', 'Stress', 'Certain foods', 'Weather changes'],
        riskFactors: ['Family history', 'Female gender', 'Hormonal changes', 'Stress', 'Sleep disturbances'],
        treatments: [
          { name: 'Sumatriptan', description: 'Triptan medication for acute attacks', type: 'medication' },
          { name: 'Preventive medication', description: 'Beta blockers or anti-seizure drugs', type: 'medication' },
        ],
        preventions: ['Identify and avoid triggers', 'Regular sleep schedule', 'Stress management', 'Stay hydrated'],
        relatedMedicines: ['Sumatriptan', 'Ibuprofen', 'Propranolol'],
        severity: 'moderate',
        specialistType: 'Neurologist',
      },
      {
        name: 'Common Cold',
        description: 'A viral infectious disease of the upper respiratory tract. It is the most frequent infectious disease in humans.',
        category: 'Respiratory',
        symptoms: ['runny nose', 'sneezing', 'sore throat', 'cough', 'mild fever', 'headache', 'body aches'],
        causes: ['Rhinovirus', 'Coronavirus', 'Contact with infected person'],
        riskFactors: ['Weak immunity', 'Cold weather exposure', 'Children in daycare', 'Smoking'],
        treatments: [
          { name: 'Rest & Fluids', description: 'Rest with warm fluids', type: 'lifestyle' },
          { name: 'OTC Decongestants', description: 'Nasal decongestant sprays or tablets', type: 'medication' },
        ],
        preventions: ['Wash hands frequently', 'Avoid close contact with sick people', 'Boost immunity with vitamin C'],
        relatedMedicines: ['Paracetamol', 'Cetirizine', 'Vitamin C'],
        severity: 'mild',
        specialistType: 'General Physician',
      },
      {
        name: 'Eczema',
        description: 'A chronic skin condition characterized by itchy, inflamed, and red patches on the skin. Also known as atopic dermatitis.',
        category: 'Skin',
        symptoms: ['itchy skin', 'red patches', 'dry skin', 'cracked skin', 'swelling', 'skin rash'],
        causes: ['Immune system dysfunction', 'Genetics', 'Environmental triggers', 'Allergens'],
        riskFactors: ['Family history of eczema or allergies', 'Asthma', 'Hay fever', 'Dry climate'],
        treatments: [
          { name: 'Topical Corticosteroids', description: 'Anti-inflammatory creams', type: 'medication' },
          { name: 'Moisturizers', description: 'Regular use of emollients', type: 'lifestyle' },
        ],
        preventions: ['Regular moisturizing', 'Avoid known triggers', 'Use mild soaps', 'Wear soft fabrics'],
        relatedMedicines: ['Hydrocortisone cream', 'Cetirizine', 'Moisturizing lotion'],
        severity: 'moderate',
        specialistType: 'Dermatologist',
      },
    ];

    await Disease.insertMany(diseases);
    console.log('🦠 6 Diseases seeded');

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
