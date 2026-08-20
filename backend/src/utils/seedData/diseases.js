/**
 * Disease seed data.
 *
 * Slugs are pinned explicitly because frontend/src/pages/DiseaseListing.js and
 * DiseaseDetail.js link to them by name (e.g. /diseases/alzheimers, not
 * /diseases/alzheimers-disease). Categories must stay inside the Disease
 * schema enum, which mirrors the filter chips on the listing page.
 *
 * Symptoms are lowercase — aiController.symptomCheck normalises user input to
 * lowercase before matching.
 */

module.exports = [
  {
    name: 'Diabetes',
    slug: 'diabetes',
    description:
      'A metabolic disease that causes high blood sugar levels over a prolonged period. It occurs when the pancreas does not produce enough insulin or the body cannot effectively use the insulin it produces.',
    category: 'Endocrine',
    symptoms: [
      'increased thirst', 'frequent urination', 'extreme hunger', 'fatigue',
      'blurred vision', 'slow healing wounds', 'tingling in hands or feet', 'unexplained weight loss',
    ],
    causes: ['Insulin resistance', 'Genetics', 'Obesity', 'Sedentary lifestyle', 'Pancreatic dysfunction'],
    riskFactors: ['Obesity', 'Family history', 'Age above 45', 'Physical inactivity', 'High blood pressure', 'PCOS'],
    treatments: [
      { name: 'Metformin', description: 'Oral medication to control blood sugar levels', type: 'medication' },
      { name: 'Insulin Therapy', description: 'Injected insulin for advanced cases', type: 'medication' },
      { name: 'Diet Control', description: 'Low-carb, balanced meals with regular monitoring', type: 'lifestyle' },
      { name: 'Exercise', description: 'Regular physical activity to improve insulin sensitivity', type: 'lifestyle' },
    ],
    preventions: ['Healthy diet', 'Regular exercise', 'Maintain healthy weight', 'Regular blood sugar checks', 'Limit sugar intake'],
    relatedMedicines: ['Metformin', 'Glimepiride', 'Insulin', 'Sitagliptin'],
    severity: 'severe',
    specialistType: 'Endocrinologist',
  },
  {
    name: 'Hypertension',
    slug: 'hypertension',
    description:
      'A chronic medical condition in which blood pressure in the arteries is persistently elevated, increasing the risk of heart disease, stroke, and other complications.',
    category: 'Cardiovascular',
    symptoms: ['headache', 'shortness of breath', 'nosebleed', 'dizziness', 'chest pain', 'blurred vision'],
    causes: ['Genetics', 'High salt diet', 'Obesity', 'Lack of exercise', 'Chronic stress', 'Excessive alcohol'],
    riskFactors: ['Family history', 'Age above 40', 'Obesity', 'Smoking', 'Excessive alcohol', 'High sodium diet'],
    treatments: [
      { name: 'ACE Inhibitors', description: 'Medication to relax blood vessels', type: 'medication' },
      { name: 'Beta Blockers', description: 'Medication to reduce heart rate and blood pressure', type: 'medication' },
      { name: 'Lifestyle Changes', description: 'Diet, exercise, stress management', type: 'lifestyle' },
    ],
    preventions: ['Reduce salt intake', 'Regular exercise', 'Maintain healthy weight', 'Limit alcohol', 'Manage stress'],
    relatedMedicines: ['Amlodipine', 'Losartan', 'Metoprolol', 'Enalapril'],
    severity: 'severe',
    specialistType: 'Cardiologist',
  },
  {
    name: 'Asthma',
    slug: 'asthma',
    description:
      'A chronic condition where airways narrow and swell, producing extra mucus, making breathing difficult and triggering coughing, wheezing, and shortness of breath.',
    category: 'Respiratory',
    symptoms: ['shortness of breath', 'chest tightness', 'wheezing', 'coughing', 'difficulty sleeping'],
    causes: ['Airborne allergens', 'Respiratory infections', 'Physical activity', 'Cold air', 'Air pollutants', 'Genetics'],
    riskFactors: ['Family history of asthma', 'Having allergies', 'Being overweight', 'Smoking exposure', 'Air pollution'],
    treatments: [
      { name: 'Inhaled Corticosteroids', description: 'Anti-inflammatory medication to reduce airway swelling', type: 'medication' },
      { name: 'Bronchodilators', description: 'Quick-relief medication to open airways', type: 'medication' },
      { name: 'Allergy Management', description: 'Identifying and avoiding triggers', type: 'lifestyle' },
    ],
    preventions: ['Identify and avoid triggers', 'Get vaccinated for flu and pneumonia', 'Monitor breathing', 'Take medications as prescribed'],
    relatedMedicines: ['Salbutamol (Albuterol)', 'Budesonide', 'Montelukast', 'Fluticasone'],
    severity: 'moderate',
    specialistType: 'Pulmonologist',
  },
  {
    name: 'Migraine',
    slug: 'migraine',
    description:
      'A neurological condition characterized by intense, debilitating headaches often accompanied by nausea, vomiting, and sensitivity to light and sound.',
    category: 'Neurological',
    symptoms: [
      'severe headache', 'nausea', 'vomiting', 'sensitivity to light',
      'sensitivity to sound', 'aura', 'dizziness', 'blurred vision',
    ],
    causes: ['Neurological changes', 'Hormonal changes', 'Stress', 'Certain foods', 'Weather changes', 'Sleep disturbances'],
    riskFactors: ['Family history', 'Female gender', 'Hormonal changes', 'Stress', 'Sleep disturbances'],
    treatments: [
      { name: 'Sumatriptan', description: 'Triptan medication for acute attacks', type: 'medication' },
      { name: 'Preventive Medication', description: 'Beta blockers or anti-seizure drugs', type: 'medication' },
      { name: 'Trigger Management', description: 'Regular sleep, hydration, and stress control', type: 'lifestyle' },
    ],
    preventions: ['Identify and avoid triggers', 'Regular sleep schedule', 'Stress management', 'Stay hydrated'],
    relatedMedicines: ['Sumatriptan', 'Ibuprofen', 'Propranolol'],
    severity: 'moderate',
    specialistType: 'Neurologist',
  },
  {
    name: 'Arthritis',
    slug: 'arthritis',
    description:
      'Swelling and tenderness of one or more joints, causing pain and stiffness that typically worsen with age. Common forms include osteoarthritis and rheumatoid arthritis.',
    category: 'Musculoskeletal',
    symptoms: ['joint pain', 'stiffness', 'swelling', 'decreased range of motion', 'redness around joints'],
    causes: ['Cartilage wear and tear', 'Autoimmune response', 'Joint injury', 'Infection'],
    riskFactors: ['Age above 50', 'Family history', 'Previous joint injury', 'Obesity', 'Female gender'],
    treatments: [
      { name: 'NSAIDs', description: 'Anti-inflammatory pain relief', type: 'medication' },
      { name: 'Physical Therapy', description: 'Exercises to improve joint mobility and strength', type: 'therapy' },
      { name: 'Joint Replacement', description: 'Surgery for severely damaged joints', type: 'surgery' },
    ],
    preventions: ['Maintain healthy weight', 'Regular low-impact exercise', 'Protect joints from injury', 'Balanced diet'],
    relatedMedicines: ['Ibuprofen', 'Naproxen', 'Methotrexate', 'Prednisone'],
    severity: 'moderate',
    specialistType: 'Rheumatologist',
  },
  {
    name: 'COVID-19',
    slug: 'covid-19',
    description:
      'An infectious disease caused by the SARS-CoV-2 virus, primarily affecting the respiratory system, with severity ranging from mild symptoms to life-threatening illness.',
    category: 'Infectious',
    symptoms: ['fever', 'dry cough', 'fatigue', 'loss of taste or smell', 'sore throat', 'shortness of breath', 'body aches'],
    causes: ['SARS-CoV-2 virus', 'Airborne droplets from an infected person', 'Contact with contaminated surfaces'],
    riskFactors: ['Age above 60', 'Chronic illness', 'Weak immune system', 'Unvaccinated status', 'Crowded environments'],
    treatments: [
      { name: 'Antiviral Therapy', description: 'Prescribed antivirals for high-risk patients', type: 'medication' },
      { name: 'Rest & Isolation', description: 'Rest, fluids, and isolation to prevent spread', type: 'lifestyle' },
      { name: 'Oxygen Support', description: 'Supplemental oxygen for severe respiratory distress', type: 'other' },
    ],
    preventions: ['Vaccination', 'Frequent handwashing', 'Masking in crowded spaces', 'Ventilate indoor spaces'],
    relatedMedicines: ['Paracetamol', 'Vitamin D3', 'Azithromycin'],
    severity: 'severe',
    specialistType: 'Pulmonologist',
  },
  {
    name: 'Depression',
    slug: 'depression',
    description:
      'A mood disorder causing a persistent feeling of sadness and loss of interest, affecting how a person feels, thinks, and handles daily activities.',
    category: 'Mental Health',
    symptoms: [
      'persistent sadness', 'loss of interest', 'fatigue', 'difficulty concentrating',
      'changes in appetite', 'sleep disturbances', 'feelings of worthlessness',
    ],
    causes: ['Brain chemistry imbalance', 'Genetics', 'Traumatic life events', 'Chronic illness', 'Prolonged stress'],
    riskFactors: ['Family history', 'Trauma or abuse', 'Chronic illness', 'Substance abuse', 'Social isolation'],
    treatments: [
      { name: 'Cognitive Behavioural Therapy', description: 'Structured talk therapy to reframe thought patterns', type: 'therapy' },
      { name: 'Antidepressants', description: 'SSRIs or SNRIs prescribed by a psychiatrist', type: 'medication' },
      { name: 'Lifestyle Support', description: 'Exercise, sleep hygiene, and social connection', type: 'lifestyle' },
    ],
    preventions: ['Maintain social connections', 'Regular exercise', 'Stress management', 'Seek help early'],
    relatedMedicines: ['Sertraline', 'Fluoxetine', 'Escitalopram'],
    severity: 'moderate',
    specialistType: 'Psychiatrist',
  },
  {
    name: 'Anemia',
    slug: 'anemia',
    description:
      'A condition in which the blood lacks enough healthy red blood cells or hemoglobin to carry adequate oxygen to the body tissues.',
    category: 'Hematological',
    symptoms: ['fatigue', 'weakness', 'pale skin', 'shortness of breath', 'dizziness', 'cold hands and feet'],
    causes: ['Iron deficiency', 'Vitamin B12 deficiency', 'Chronic blood loss', 'Bone marrow disorders'],
    riskFactors: ['Poor diet', 'Heavy menstrual periods', 'Pregnancy', 'Chronic kidney disease', 'Family history'],
    treatments: [
      { name: 'Iron Supplements', description: 'Oral or intravenous iron replacement', type: 'medication' },
      { name: 'Vitamin B12 Therapy', description: 'Injections or supplements for deficiency anemia', type: 'medication' },
      { name: 'Dietary Changes', description: 'Iron-rich foods with vitamin C for absorption', type: 'lifestyle' },
    ],
    preventions: ['Iron-rich diet', 'Adequate vitamin B12 and folate', 'Treat underlying blood loss', 'Regular blood counts'],
    relatedMedicines: ['Ferrous Sulfate', 'Folic Acid', 'Vitamin B12'],
    severity: 'mild',
    specialistType: 'Hematologist',
  },
  {
    name: 'Pneumonia',
    slug: 'pneumonia',
    description:
      'An infection that inflames the air sacs in one or both lungs, which may fill with fluid or pus, causing cough, fever, and difficulty breathing.',
    category: 'Respiratory',
    symptoms: ['chest pain', 'cough', 'fever', 'difficulty breathing', 'chills', 'fatigue', 'confusion'],
    causes: ['Bacterial infection', 'Viral infection', 'Fungal infection', 'Aspiration of food or fluids'],
    riskFactors: ['Age above 65', 'Smoking', 'Chronic lung disease', 'Weak immune system', 'Recent hospitalisation'],
    treatments: [
      { name: 'Antibiotics', description: 'For bacterial pneumonia, course completed as prescribed', type: 'medication' },
      { name: 'Rest & Fluids', description: 'Supportive care during recovery', type: 'lifestyle' },
      { name: 'Hospital Oxygen Therapy', description: 'For severe cases with low oxygen saturation', type: 'other' },
    ],
    preventions: ['Pneumococcal vaccination', 'Annual flu shot', 'Quit smoking', 'Good hand hygiene'],
    relatedMedicines: ['Azithromycin', 'Amoxicillin', 'Paracetamol'],
    severity: 'severe',
    specialistType: 'Pulmonologist',
  },
  {
    name: "Alzheimer's Disease",
    slug: 'alzheimers',
    description:
      'A progressive neurological disorder that causes brain cells to degenerate and die, leading to a continuous decline in memory, thinking, and social skills.',
    category: 'Neurological',
    symptoms: ['memory loss', 'confusion', 'difficulty with routine tasks', 'mood changes', 'disorientation', 'poor judgement'],
    causes: ['Abnormal protein deposits in the brain', 'Genetics', 'Age-related brain changes'],
    riskFactors: ['Age above 65', 'Family history', 'Head injury', 'Cardiovascular disease', 'Down syndrome'],
    treatments: [
      { name: 'Cholinesterase Inhibitors', description: 'Medication to support memory and cognition', type: 'medication' },
      { name: 'Cognitive Stimulation', description: 'Structured activities to maintain mental function', type: 'therapy' },
      { name: 'Caregiver Support', description: 'Routine, safety measures, and caregiver planning', type: 'other' },
    ],
    preventions: ['Regular mental activity', 'Physical exercise', 'Heart-healthy diet', 'Manage blood pressure and diabetes'],
    relatedMedicines: ['Donepezil', 'Memantine', 'Rivastigmine'],
    severity: 'critical',
    specialistType: 'Neurologist',
  },
  {
    name: 'Kidney Stones',
    slug: 'kidney-stones',
    description:
      'Hard deposits of minerals and salts that form inside the kidneys and can cause severe pain as they pass through the urinary tract.',
    category: 'Urological',
    symptoms: ['severe pain', 'blood in urine', 'nausea', 'frequent urination', 'painful urination', 'vomiting'],
    causes: ['Dehydration', 'High-sodium or high-oxalate diet', 'Obesity', 'Certain metabolic disorders'],
    riskFactors: ['Low fluid intake', 'Family history', 'Obesity', 'High-salt diet', 'Certain medications'],
    treatments: [
      { name: 'Increased Fluid Intake', description: 'Water therapy to help small stones pass', type: 'lifestyle' },
      { name: 'Pain Management', description: 'Analgesics while the stone passes', type: 'medication' },
      { name: 'Lithotripsy', description: 'Shock-wave therapy to break up larger stones', type: 'surgery' },
    ],
    preventions: ['Drink plenty of water', 'Limit salt and oxalate-rich foods', 'Maintain healthy weight', 'Moderate animal protein'],
    relatedMedicines: ['Tamsulosin', 'Ibuprofen', 'Potassium Citrate'],
    severity: 'moderate',
    specialistType: 'Urologist',
  },
  {
    name: 'Thyroid Disorder',
    slug: 'thyroid-disorder',
    description:
      'Conditions affecting the thyroid gland, which regulates metabolism. Includes hypothyroidism (underactive) and hyperthyroidism (overactive).',
    category: 'Endocrine',
    symptoms: ['weight changes', 'fatigue', 'temperature sensitivity', 'mood changes', 'hair loss', 'irregular heartbeat'],
    causes: ['Autoimmune disease', 'Iodine deficiency', 'Thyroid inflammation', 'Genetics'],
    riskFactors: ['Female gender', 'Family history', 'Autoimmune conditions', 'Age above 60', 'Previous thyroid surgery'],
    treatments: [
      { name: 'Levothyroxine', description: 'Hormone replacement for hypothyroidism', type: 'medication' },
      { name: 'Antithyroid Medication', description: 'Reduces hormone production in hyperthyroidism', type: 'medication' },
      { name: 'Regular Monitoring', description: 'Periodic TSH blood tests to adjust dosage', type: 'other' },
    ],
    preventions: ['Adequate dietary iodine', 'Regular thyroid screening if at risk', 'Avoid smoking'],
    relatedMedicines: ['Levothyroxine', 'Methimazole', 'Carbimazole'],
    severity: 'moderate',
    specialistType: 'Endocrinologist',
  },

  // ── Extra conditions (not on the listing page, but useful for the symptom checker) ──
  {
    name: 'Influenza',
    slug: 'influenza',
    description:
      'A contagious respiratory illness caused by influenza viruses. It can cause mild to severe illness and, in high-risk groups, serious complications.',
    category: 'Infectious',
    symptoms: ['fever', 'cough', 'sore throat', 'runny nose', 'body aches', 'headache', 'fatigue', 'chills'],
    causes: ['Influenza virus (Type A, B, C)', 'Airborne droplets from an infected person'],
    riskFactors: ['Weak immune system', 'Age (children and elderly)', 'Chronic illness', 'Pregnancy'],
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
    name: 'Common Cold',
    slug: 'common-cold',
    description:
      'A viral infectious disease of the upper respiratory tract, and the most frequent infectious illness in humans.',
    category: 'Respiratory',
    symptoms: ['runny nose', 'sneezing', 'sore throat', 'cough', 'mild fever', 'headache', 'body aches'],
    causes: ['Rhinovirus', 'Coronavirus', 'Contact with an infected person'],
    riskFactors: ['Weak immunity', 'Cold weather exposure', 'Children in daycare', 'Smoking'],
    treatments: [
      { name: 'Rest & Fluids', description: 'Rest with warm fluids', type: 'lifestyle' },
      { name: 'OTC Decongestants', description: 'Nasal decongestant sprays or tablets', type: 'medication' },
    ],
    preventions: ['Wash hands frequently', 'Avoid close contact with sick people', 'Support immunity with a balanced diet'],
    relatedMedicines: ['Paracetamol', 'Cetirizine', 'Vitamin C'],
    severity: 'mild',
    specialistType: 'General Physician',
  },
  {
    name: 'Eczema',
    slug: 'eczema',
    description:
      'A chronic skin condition characterized by itchy, inflamed, and red patches on the skin. Also known as atopic dermatitis.',
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
