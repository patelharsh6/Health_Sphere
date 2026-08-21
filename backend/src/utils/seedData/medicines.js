const medicines = [
  {
    name: 'Paracetamol',
    slug: 'paracetamol',
    genericName: 'Acetaminophen',
    summary: 'A widely used medication to treat mild to moderate pain and reduce fever.',
    description: 'Paracetamol is a common pain reliever and fever reducer. It is generally safe when used at recommended doses but can cause severe liver damage if overdosed. Unlike NSAIDs, it has very little anti-inflammatory effect.',
    category: 'Pain Relief',
    type: 'Tablet',
    prescriptionRequired: false,
    uses: ['Fever', 'Headache', 'Muscle Ache', 'Toothache', 'Cold & Flu Symptoms', 'Menstrual Cramps'],
    howItWorks: 'Paracetamol works by blocking the production of certain chemical messengers (prostaglandins) in the brain that cause pain and fever.',
    dosage: {
      adult: '500mg to 1000mg every 4–6 hours as needed.',
      child: 'Dosage is strictly based on body weight (typically 10-15mg/kg every 4-6 hours).',
      maxDaily: 'Maximum: 4,000mg (4 grams) in 24 hours.',
      notes: 'Always follow your doctor\'s recommendations or the instructions on the medicine label.'
    },
    sideEffects: {
      common: ['Mild nausea', 'Stomach upset'],
      serious: ['Dark urine or pale stools', 'Yellowing of skin/eyes (Jaundice)', 'Severe allergic reaction (Rash, swelling)']
    },
    precautions: [
      'Have severe liver or kidney disease.',
      'Consume 3 or more alcoholic drinks every day.',
      'Are severely underweight or malnourished.',
      'Are allergic to acetaminophen.'
    ],
    interactions: [
      { with: 'Alcohol', effect: 'Dramatically increases the risk of liver damage.', severity: 'high' },
      { with: 'Other Cold Medicines', effect: 'Many OTC cold medicines already contain Paracetamol. Taking both causes accidental overdose.', severity: 'high' },
      { with: 'Ketoconazole', effect: 'Can increase the risk of liver toxicity.', severity: 'moderate' },
      { with: 'Blood Thinners (Warfarin)', effect: 'Long-term use of Paracetamol may increase bleeding risk.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'Pain, Fever',
      safeForChildren: 'Yes (Dose specific)',
      pregnancySafe: 'Yes (Consult doctor)'
    },
    relatedDiseases: ['influenza', 'cold', 'dengue'],
    alternatives: ['ibuprofen', 'aspirin'],
    isActive: true
  },
  {
    name: 'Amoxicillin',
    slug: 'amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    summary: 'Penicillin-type antibiotic used to treat bacterial infections.',
    description: 'Amoxicillin is used to treat a wide variety of bacterial infections. It works by stopping the growth of bacteria. This antibiotic treats only bacterial infections. It will not work for viral infections (such as common cold, flu).',
    category: 'Antibiotic',
    type: 'Capsule',
    prescriptionRequired: true,
    uses: ['Bacterial infections', 'Ear infections', 'UTI', 'Pneumonia', 'Skin infections'],
    howItWorks: 'It works by inhibiting the synthesis of bacterial cell walls. It binds to one or more of the penicillin-binding proteins (PBPs) which in turn inhibits the final transpeptidation step of peptidoglycan synthesis in bacterial cell walls.',
    dosage: {
      adult: '250-500mg every 8 hours, or 500-875mg every 12 hours.',
      child: '20-40 mg/kg/day in divided doses every 8 hours.',
      maxDaily: 'Do not exceed 3 grams daily.',
      notes: 'Take with or without food. Complete the full course.'
    },
    sideEffects: {
      common: ['Nausea', 'Vomiting', 'Diarrhea'],
      serious: ['Severe allergic reaction', 'Watery or bloody diarrhea (C. diff)', 'Yellowing of eyes/skin']
    },
    precautions: [
      'Allergic to penicillin or cephalosporins.',
      'Have asthma, liver disease, or kidney disease.',
      'Have mononucleosis (increases risk of rash).'
    ],
    interactions: [
      { with: 'Methotrexate', effect: 'May increase methotrexate toxicity.', severity: 'high' },
      { with: 'Oral contraceptives', effect: 'May decrease effectiveness of birth control pills.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'Bacterial infections',
      safeForChildren: 'Yes (Syrup/Suspension usually)',
      pregnancySafe: 'Generally considered safe (Consult doctor)'
    },
    relatedDiseases: ['pneumonia', 'urinary-tract-infection'],
    alternatives: ['azithromycin'],
    isActive: true
  },
  {
    name: 'Metformin',
    slug: 'metformin',
    genericName: 'Metformin Hydrochloride',
    summary: 'First-line medication for treating type 2 diabetes by controlling blood sugar levels.',
    description: 'Metformin is used with a proper diet and exercise program and possibly with other medications to control high blood sugar. It is used in patients with type 2 diabetes.',
    category: 'Diabetes',
    type: 'Tablet',
    prescriptionRequired: true,
    uses: ['Type 2 Diabetes', 'PCOS', 'Blood sugar control'],
    howItWorks: 'It works by reducing glucose production in the liver, decreasing intestinal absorption of glucose, and improving insulin sensitivity by increasing peripheral glucose uptake and utilization.',
    dosage: {
      adult: 'Start 500 mg once or twice daily with meals.',
      child: 'Not typically recommended for children under 10.',
      maxDaily: '2000-2550 mg per day.',
      notes: 'Always take with meals to reduce stomach/bowel side effects.'
    },
    sideEffects: {
      common: ['Nausea', 'Vomiting', 'Stomach upset', 'Diarrhea'],
      serious: ['Lactic acidosis (rare but very serious)', 'Vitamin B12 deficiency']
    },
    precautions: [
      'Severe kidney disease.',
      'Metabolic acidosis or diabetic ketoacidosis.',
      'Needing surgery or certain X-rays (requires temporary stoppage).'
    ],
    interactions: [
      { with: 'Iodinated contrast', effect: 'Can lead to acute kidney failure and lactic acidosis.', severity: 'high' },
      { with: 'Alcohol', effect: 'Increases the risk of lactic acidosis.', severity: 'high' }
    ],
    quickInfo: {
      usedFor: 'Blood sugar control',
      safeForChildren: 'Limited (Type 2 only)',
      pregnancySafe: 'Used if needed, insulin is preferred'
    },
    relatedDiseases: ['type-2-diabetes'],
    alternatives: [],
    isActive: true
  },
  {
    name: 'Omeprazole',
    slug: 'omeprazole',
    genericName: 'Omeprazole',
    summary: 'Proton pump inhibitor that reduces stomach acid production for acid reflux and ulcers.',
    description: 'Omeprazole is used to treat certain stomach and esophagus problems (such as acid reflux, ulcers). It works by decreasing the amount of acid your stomach makes.',
    category: 'Gastrointestinal',
    type: 'Capsule',
    prescriptionRequired: true,
    uses: ['Acid reflux', 'GERD', 'Stomach ulcers'],
    howItWorks: 'It is a proton pump inhibitor (PPI). It works by blocking the enzyme in the wall of the stomach that produces acid, reducing stomach acid secretion.',
    dosage: {
      adult: '20 mg to 40 mg once daily before a meal.',
      child: 'Based on weight, prescribed by doctor.',
      maxDaily: 'Usually 40 mg.',
      notes: 'Take before a meal, typically in the morning. Swallow whole, do not crush or chew.'
    },
    sideEffects: {
      common: ['Headache', 'Abdominal pain', 'Nausea', 'Diarrhea'],
      serious: ['Low magnesium levels', 'Bone fractures (with long-term use)', 'Vitamin B12 deficiency', 'C. diff diarrhea']
    },
    precautions: [
      'Liver disease.',
      'Lupus.',
      'Osteoporosis (can increase fracture risk if used long-term).'
    ],
    interactions: [
      { with: 'Clopidogrel', effect: 'Omeprazole can reduce the effectiveness of Clopidogrel.', severity: 'high' },
      { with: 'Methotrexate', effect: 'May increase levels of methotrexate in the body.', severity: 'high' }
    ],
    quickInfo: {
      usedFor: 'Acid reflux, Ulcers',
      safeForChildren: 'Yes (Under doctor supervision)',
      pregnancySafe: 'Consult doctor'
    },
    relatedDiseases: ['gerd'],
    alternatives: [],
    isActive: true
  },
  {
    name: 'Cetirizine',
    slug: 'cetirizine',
    genericName: 'Cetirizine Hydrochloride',
    summary: 'Antihistamine used for allergies, hay fever, and hives. Non-drowsy formula.',
    description: 'Cetirizine is an antihistamine used to relieve allergy symptoms such as watery eyes, runny nose, itching eyes/nose, sneezing, hives, and itching. It works by blocking a certain natural substance (histamine) that your body makes during an allergic reaction.',
    category: 'Allergy',
    type: 'Tablet',
    prescriptionRequired: false,
    uses: ['Allergies', 'Hay fever', 'Hives'],
    howItWorks: 'It competes with histamine for H1-receptor sites on effector cells in the gastrointestinal tract, blood vessels, and respiratory tract.',
    dosage: {
      adult: '5 mg to 10 mg once daily depending on symptom severity.',
      child: '2.5 mg to 5 mg once daily (for 6 months to 5 years).',
      maxDaily: '10 mg.',
      notes: 'May cause drowsiness in a small percentage of people despite being a "non-drowsy" antihistamine.'
    },
    sideEffects: {
      common: ['Drowsiness (mild)', 'Dry mouth', 'Fatigue'],
      serious: ['Difficulty breathing', 'Swelling of the face/tongue (allergic reaction)']
    },
    precautions: [
      'Kidney or liver disease.',
      'Enlarged prostate or urination problems.'
    ],
    interactions: [
      { with: 'Alcohol', effect: 'Can increase drowsiness and dizziness.', severity: 'moderate' },
      { with: 'Sedatives', effect: 'May increase drowsiness.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'Allergies, Hives',
      safeForChildren: 'Yes (Appropriate formulation)',
      pregnancySafe: 'Generally considered safe (Consult doctor)'
    },
    relatedDiseases: ['allergic-rhinitis'],
    alternatives: [],
    isActive: true
  },
  {
    name: 'Amlodipine',
    slug: 'amlodipine',
    genericName: 'Amlodipine Besylate',
    summary: 'Calcium channel blocker used for treating high blood pressure and chest pain.',
    description: 'Amlodipine is used with or without other medications to treat high blood pressure. Lowering high blood pressure helps prevent strokes, heart attacks, and kidney problems. Amlodipine is called a calcium channel blocker.',
    category: 'Cardiovascular',
    type: 'Tablet',
    prescriptionRequired: true,
    uses: ['Hypertension', 'Chest pain', 'Angina'],
    howItWorks: 'It relaxes blood vessels so blood can flow more easily. It also relieves angina by improving the blood supply to the heart muscle.',
    dosage: {
      adult: '2.5 mg to 10 mg once daily.',
      child: 'Usually not prescribed for young children.',
      maxDaily: '10 mg.',
      notes: 'Can be taken with or without food. Take at the same time each day.'
    },
    sideEffects: {
      common: ['Swelling in legs/ankles', 'Dizziness', 'Fatigue', 'Flushing'],
      serious: ['Worsening chest pain (rare)', 'Irregular heartbeat', 'Fainting']
    },
    precautions: [
      'Severe heart condition (like aortic stenosis).',
      'Liver disease.'
    ],
    interactions: [
      { with: 'Simvastatin', effect: 'Amlodipine can increase simvastatin levels; simvastatin dose may need limiting.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'High Blood Pressure',
      safeForChildren: 'Not typically used',
      pregnancySafe: 'Consult doctor'
    },
    relatedDiseases: ['hypertension', 'coronary-artery-disease'],
    alternatives: ['atorvastatin'],
    isActive: true
  },
  {
    name: 'Ibuprofen',
    slug: 'ibuprofen',
    genericName: 'Ibuprofen',
    summary: 'Nonsteroidal anti-inflammatory drug (NSAID) for pain relief and inflammation reduction.',
    description: 'Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID). It works by reducing hormones that cause inflammation and pain in the body.',
    category: 'Pain Relief',
    type: 'Tablet',
    prescriptionRequired: false,
    uses: ['Pain relief', 'Inflammation', 'Arthritis', 'Fever'],
    howItWorks: 'Inhibits cyclooxygenase (COX) enzymes, which convert arachidonic acid to prostaglandins, resulting in decreased pain and inflammation.',
    dosage: {
      adult: '200 mg to 400 mg every 4-6 hours as needed.',
      child: 'Weight-based dosing; consult pediatrician.',
      maxDaily: '1200 mg (OTC) or up to 3200 mg (Prescription).',
      notes: 'Take with food or milk to prevent stomach upset.'
    },
    sideEffects: {
      common: ['Stomach upset', 'Heartburn', 'Nausea', 'Dizziness'],
      serious: ['Stomach bleeding/ulcers', 'Kidney problems', 'Increased risk of heart attack or stroke']
    },
    precautions: [
      'History of stomach ulcers or bleeding.',
      'Heart disease or high blood pressure.',
      'Kidney disease.'
    ],
    interactions: [
      { with: 'Blood Thinners', effect: 'Increases bleeding risk.', severity: 'high' },
      { with: 'Aspirin', effect: 'Can interfere with aspirin\'s heart protection benefits.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'Pain, Inflammation, Fever',
      safeForChildren: 'Yes (Dose specific)',
      pregnancySafe: 'Avoid, especially in 3rd trimester'
    },
    relatedDiseases: ['rheumatoid-arthritis', 'osteoarthritis', 'dengue', 'influenza'],
    alternatives: ['paracetamol'],
    isActive: true
  },
  {
    name: 'Azithromycin',
    slug: 'azithromycin',
    genericName: 'Azithromycin',
    summary: 'Macrolide antibiotic used for treating respiratory infections and sexually transmitted infections.',
    description: 'Azithromycin is a macrolide antibiotic that fights bacteria. It is used to treat many different types of infections caused by bacteria, such as respiratory infections, skin infections, ear infections, and sexually transmitted diseases.',
    category: 'Antibiotic',
    type: 'Tablet',
    prescriptionRequired: true,
    uses: ['Pneumonia', 'Bronchitis', 'Skin infections', 'Chlamydia'],
    howItWorks: 'It binds to the 50S ribosomal subunit of susceptible microorganisms and blocks the dissociation of peptidyl tRNA from ribosomes, thereby arresting RNA-dependent protein synthesis.',
    dosage: {
      adult: 'Typically 500 mg on day 1, followed by 250 mg on days 2-5 (Z-Pak).',
      child: 'Weight-based dosing.',
      maxDaily: 'Usually 500 mg.',
      notes: 'May be taken with or without food. Do not take antacids containing aluminum or magnesium within 2 hours of taking azithromycin.'
    },
    sideEffects: {
      common: ['Diarrhea', 'Nausea', 'Abdominal pain', 'Vomiting'],
      serious: ['QT prolongation (heart rhythm problem)', 'Liver damage', 'Severe allergic reaction']
    },
    precautions: [
      'History of QT prolongation or irregular heartbeat.',
      'Liver or kidney disease.',
      'Myasthenia gravis.'
    ],
    interactions: [
      { with: 'Antacids with Aluminum/Magnesium', effect: 'Can make azithromycin less effective if taken at same time.', severity: 'moderate' },
      { with: 'Amiodarone', effect: 'Increases risk of irregular heart rhythm.', severity: 'high' }
    ],
    quickInfo: {
      usedFor: 'Bacterial infections',
      safeForChildren: 'Yes (Suspension)',
      pregnancySafe: 'Generally considered safe (Consult doctor)'
    },
    relatedDiseases: ['pneumonia'],
    alternatives: ['amoxicillin'],
    isActive: true
  },
  {
    name: 'Levothyroxine',
    slug: 'levothyroxine',
    genericName: 'Levothyroxine Sodium',
    summary: 'Synthetic thyroid hormone replacement for hypothyroidism treatment.',
    description: 'Levothyroxine is used to treat an underactive thyroid (hypothyroidism). It replaces or provides more thyroid hormone, which is normally produced by the thyroid gland.',
    category: 'Thyroid',
    type: 'Tablet',
    prescriptionRequired: true,
    uses: ['Hypothyroidism', 'Goiter', 'Thyroid cancer'],
    howItWorks: 'It acts like the endogenous thyroid hormone thyroxine (T4), regulating metabolism, growth, and development.',
    dosage: {
      adult: 'Dose tailored to individual (typically 50-100 mcg daily).',
      child: 'Based on weight and age.',
      maxDaily: 'Varies by individual.',
      notes: 'Take on an empty stomach, 30-60 minutes before breakfast with a full glass of water.'
    },
    sideEffects: {
      common: ['Hair loss (temporary)', 'Weight loss', 'Increased appetite'],
      serious: ['Chest pain', 'Rapid/irregular heartbeat', 'Shortness of breath']
    },
    precautions: [
      'Uncorrected adrenal gland problems.',
      'Recent heart attack or cardiovascular disease.',
      'Thyrotoxicosis.'
    ],
    interactions: [
      { with: 'Calcium and Iron supplements', effect: 'Decreases absorption of levothyroxine. Separate by 4 hours.', severity: 'high' },
      { with: 'Antacids', effect: 'Decreases absorption.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'Hypothyroidism',
      safeForChildren: 'Yes',
      pregnancySafe: 'Yes (Often requires dose increase)'
    },
    relatedDiseases: ['hypothyroidism'],
    alternatives: [],
    isActive: true
  },
  {
    name: 'Vitamin D3',
    slug: 'vitamin-d3',
    genericName: 'Cholecalciferol',
    summary: 'Essential vitamin supplement for bone health and immune function support.',
    description: 'Vitamin D3 is a fat-soluble vitamin that helps your body absorb calcium and phosphorus. Having the right amount of vitamin D, calcium, and phosphorus is important for building and keeping strong bones.',
    category: 'Supplement',
    type: 'Softgel',
    prescriptionRequired: false,
    uses: ['Bone health', 'Vitamin D deficiency', 'Immune support'],
    howItWorks: 'It is converted in the liver and kidneys to calcitriol, which promotes intestinal calcium and phosphorus absorption and helps maintain adequate serum calcium concentrations to enable normal mineralization of bone.',
    dosage: {
      adult: '600-2000 IU daily (or higher for deficiency).',
      child: '400-600 IU daily.',
      maxDaily: 'Upper limit typically 4000 IU daily unless treating deficiency.',
      notes: 'Best absorbed when taken with a meal containing fat.'
    },
    sideEffects: {
      common: ['Generally none at normal doses'],
      serious: ['Too much Vitamin D can cause hypercalcemia (weakness, nausea, kidney stones)']
    },
    precautions: [
      'High calcium levels (hypercalcemia).',
      'Kidney disease.',
      'Malabsorption syndromes.'
    ],
    interactions: [
      { with: 'Orlistat', effect: 'Can decrease the absorption of Vitamin D.', severity: 'moderate' },
      { with: 'Thiazide diuretics', effect: 'Increases risk of hypercalcemia.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'Bone health, Immunity',
      safeForChildren: 'Yes',
      pregnancySafe: 'Yes'
    },
    relatedDiseases: ['osteoporosis'],
    alternatives: [],
    isActive: true
  },
  {
    name: 'Atorvastatin',
    slug: 'atorvastatin',
    genericName: 'Atorvastatin Calcium',
    summary: 'Statin medication for lowering high cholesterol and reducing cardiovascular risk.',
    description: 'Atorvastatin is used along with a proper diet to help lower "bad" cholesterol and fats (such as LDL, triglycerides) and raise "good" cholesterol (HDL) in the blood. It belongs to a group of drugs known as statins.',
    category: 'Cardiovascular',
    type: 'Tablet',
    prescriptionRequired: true,
    uses: ['High cholesterol', 'Heart disease prevention'],
    howItWorks: 'It works by reducing the amount of cholesterol made by the liver. It is a competitive inhibitor of HMG-CoA reductase, the rate-limiting enzyme that converts HMG-CoA to mevalonate, a precursor of sterols, including cholesterol.',
    dosage: {
      adult: '10 mg to 80 mg once daily.',
      child: '10 mg to 20 mg once daily (for certain genetic conditions).',
      maxDaily: '80 mg.',
      notes: 'Can be taken at any time of day, with or without food. Avoid drinking large amounts of grapefruit juice.'
    },
    sideEffects: {
      common: ['Muscle and joint pain', 'Diarrhea', 'Nausea'],
      serious: ['Unexplained muscle pain/weakness (rhabdomyolysis)', 'Liver problems', 'Increased blood sugar']
    },
    precautions: [
      'Active liver disease.',
      'Heavy alcohol use.',
      'Hypothyroidism (increases risk of muscle problems).'
    ],
    interactions: [
      { with: 'Grapefruit Juice', effect: 'Can increase levels of atorvastatin in the blood, raising risk of side effects.', severity: 'moderate' },
      { with: 'Clarithromycin', effect: 'Significantly increases atorvastatin levels.', severity: 'high' }
    ],
    quickInfo: {
      usedFor: 'High cholesterol',
      safeForChildren: 'Specific cases only',
      pregnancySafe: 'No (Contraindicated)'
    },
    relatedDiseases: ['coronary-artery-disease'],
    alternatives: ['amlodipine'],
    isActive: true
  },
  {
    name: 'Montelukast',
    slug: 'montelukast',
    genericName: 'Montelukast Sodium',
    summary: 'Leukotriene receptor antagonist for treating asthma and seasonal allergies.',
    description: 'Montelukast is used to prevent wheezing, difficulty breathing, chest tightness, and coughing caused by asthma. It is also used to prevent bronchospasm during exercise and to treat symptoms of seasonal allergies.',
    category: 'Respiratory',
    type: 'Tablet',
    prescriptionRequired: true,
    uses: ['Asthma prevention', 'Allergic rhinitis'],
    howItWorks: 'It works by blocking substances in the body called leukotrienes, which cause asthma and allergic rhinitis symptoms (inflammation and airway constriction).',
    dosage: {
      adult: '10 mg once daily in the evening.',
      child: '4 mg or 5 mg chewable tablet once daily in the evening.',
      maxDaily: '10 mg.',
      notes: 'Take in the evening. Do not use for sudden asthma attacks.'
    },
    sideEffects: {
      common: ['Upper respiratory infection', 'Fever', 'Headache', 'Sore throat'],
      serious: ['Mental/mood changes (agitation, depression, suicidal thoughts)', 'Severe allergic reaction', 'Tremors']
    },
    precautions: [
      'History of mental illness or depression.',
      'Phenylketonuria (PKU) if using chewable tablets containing aspartame.'
    ],
    interactions: [
      { with: 'Phenobarbital', effect: 'May decrease montelukast levels.', severity: 'moderate' },
      { with: 'Gemfibrozil', effect: 'May increase montelukast levels.', severity: 'moderate' }
    ],
    quickInfo: {
      usedFor: 'Asthma, Allergies',
      safeForChildren: 'Yes',
      pregnancySafe: 'Generally considered safe (Consult doctor)'
    },
    relatedDiseases: ['asthma'],
    alternatives: [],
    isActive: true
  }
];

module.exports = medicines;
