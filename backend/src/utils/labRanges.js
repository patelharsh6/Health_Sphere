/**
 * Reference ranges for the lab parameters we can extract from a report.
 *
 * `aliases` are the strings that actually appear on Indian and US lab reports —
 * the extractor matches against these, so adding a new spelling here is all it
 * takes to support another lab's formatting.
 *
 * `bySex` carries the ranges that genuinely differ (haemoglobin, haematocrit,
 * creatinine). Everything else uses a single `min`/`max`. When the patient's sex
 * is unknown we widen to the union of both, so we never flag a healthy value.
 *
 * `critical` marks parameters where an out-of-range value is clinically urgent
 * rather than merely abnormal; `higherIsWorse` tells the trend logic which
 * direction counts as deterioration.
 */
const labRanges = {
  // ── Haematology ──────────────────────────────
  Hemoglobin: {
    aliases: ['hemoglobin', 'haemoglobin', 'hb', 'hgb'],
    bySex: { male: { min: 13.5, max: 17.5 }, female: { min: 12.0, max: 15.5 } },
    unit: 'g/dL',
    higherIsWorse: false,
  },
  'WBC Count': {
    aliases: ['wbc count', 'wbc', 'white blood cell', 'total leucocyte count', 'tlc', 'leucocyte count'],
    min: 4000,
    max: 11000,
    unit: '/µL',
    higherIsWorse: true,
  },
  'RBC Count': {
    aliases: ['rbc count', 'rbc', 'red blood cell'],
    bySex: { male: { min: 4.5, max: 5.9 }, female: { min: 4.1, max: 5.1 } },
    unit: 'million/µL',
    higherIsWorse: false,
  },
  'Platelet Count': {
    aliases: ['platelet count', 'platelets', 'plt'],
    min: 150000,
    max: 410000,
    unit: '/µL',
    higherIsWorse: false,
  },
  Hematocrit: {
    aliases: ['hematocrit', 'haematocrit', 'hct', 'pcv', 'packed cell volume'],
    bySex: { male: { min: 41, max: 50 }, female: { min: 36, max: 44 } },
    unit: '%',
    higherIsWorse: false,
  },
  MCV: { aliases: ['mcv', 'mean corpuscular volume'], min: 80, max: 100, unit: 'fL' },
  ESR: {
    aliases: ['esr', 'erythrocyte sedimentation rate'],
    bySex: { male: { min: 0, max: 15 }, female: { min: 0, max: 20 } },
    unit: 'mm/hr',
    higherIsWorse: true,
  },

  // ── Diabetes ─────────────────────────────────
  'Blood Sugar (Fasting)': {
    aliases: ['blood sugar (fasting)', 'fasting blood sugar', 'fasting glucose', 'fbs', 'glucose fasting', 'fasting plasma glucose'],
    min: 70,
    max: 100,
    unit: 'mg/dL',
    higherIsWorse: true,
    critical: true,
  },
  'Blood Sugar (Postprandial)': {
    aliases: ['blood sugar (postprandial)', 'postprandial blood sugar', 'pp blood sugar', 'ppbs', 'post prandial glucose'],
    min: 70,
    max: 140,
    unit: 'mg/dL',
    higherIsWorse: true,
  },
  HbA1c: {
    aliases: ['hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin', 'a1c'],
    min: 4.0,
    max: 5.7,
    unit: '%',
    higherIsWorse: true,
    critical: true,
  },

  // ── Lipid profile ────────────────────────────
  Cholesterol: {
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol'],
    min: 0,
    max: 200,
    unit: 'mg/dL',
    higherIsWorse: true,
  },
  'LDL Cholesterol': {
    aliases: ['ldl cholesterol', 'ldl-c', 'ldl'],
    min: 0,
    max: 100,
    unit: 'mg/dL',
    higherIsWorse: true,
  },
  'HDL Cholesterol': {
    aliases: ['hdl cholesterol', 'hdl-c', 'hdl'],
    min: 40,
    max: 60,
    unit: 'mg/dL',
    higherIsWorse: false,
  },
  Triglycerides: {
    aliases: ['triglycerides', 'tg', 'triglyceride'],
    min: 0,
    max: 150,
    unit: 'mg/dL',
    higherIsWorse: true,
  },

  // ── Kidney ───────────────────────────────────
  Creatinine: {
    aliases: ['creatinine', 'serum creatinine'],
    bySex: { male: { min: 0.7, max: 1.3 }, female: { min: 0.6, max: 1.1 } },
    unit: 'mg/dL',
    higherIsWorse: true,
    critical: true,
  },
  Urea: { aliases: ['urea', 'blood urea', 'bun'], min: 7, max: 20, unit: 'mg/dL', higherIsWorse: true },
  'Uric Acid': {
    aliases: ['uric acid', 'serum uric acid'],
    bySex: { male: { min: 3.4, max: 7.0 }, female: { min: 2.4, max: 6.0 } },
    unit: 'mg/dL',
    higherIsWorse: true,
  },

  // ── Liver ────────────────────────────────────
  SGPT: { aliases: ['sgpt', 'alt', 'alanine aminotransferase'], min: 7, max: 56, unit: 'U/L', higherIsWorse: true },
  SGOT: { aliases: ['sgot', 'ast', 'aspartate aminotransferase'], min: 10, max: 40, unit: 'U/L', higherIsWorse: true },
  'Total Bilirubin': {
    aliases: ['total bilirubin', 'bilirubin total', 'bilirubin'],
    min: 0.1,
    max: 1.2,
    unit: 'mg/dL',
    higherIsWorse: true,
  },
  'Alkaline Phosphatase': {
    aliases: ['alkaline phosphatase', 'alp'],
    min: 44,
    max: 147,
    unit: 'U/L',
    higherIsWorse: true,
  },

  // ── Thyroid ──────────────────────────────────
  TSH: { aliases: ['tsh', 'thyroid stimulating hormone'], min: 0.4, max: 4.0, unit: 'µIU/mL', higherIsWorse: true },
  T3: { aliases: ['t3', 'triiodothyronine'], min: 80, max: 200, unit: 'ng/dL' },
  T4: { aliases: ['t4', 'thyroxine'], min: 5.0, max: 12.0, unit: 'µg/dL' },

  // ── Vitamins & electrolytes ──────────────────
  'Vitamin D': {
    aliases: ['vitamin d', '25-hydroxy vitamin d', 'vitamin d3', '25-oh vitamin d'],
    min: 30,
    max: 100,
    unit: 'ng/mL',
    higherIsWorse: false,
  },
  'Vitamin B12': {
    aliases: ['vitamin b12', 'b12', 'cobalamin'],
    min: 200,
    max: 900,
    unit: 'pg/mL',
    higherIsWorse: false,
  },
  Sodium: { aliases: ['sodium', 'na+', 'serum sodium'], min: 135, max: 145, unit: 'mEq/L', critical: true },
  Potassium: { aliases: ['potassium', 'k+', 'serum potassium'], min: 3.5, max: 5.1, unit: 'mEq/L', critical: true },
  Calcium: { aliases: ['calcium', 'serum calcium'], min: 8.6, max: 10.3, unit: 'mg/dL' },
  'TSH Reflex': { aliases: ['free t4', 'ft4'], min: 0.8, max: 1.8, unit: 'ng/dL' },
};

/**
 * Resolve the effective min/max for a parameter, narrowing by sex when the
 * parameter has sex-specific ranges and we know the patient's sex.
 */
const rangeFor = (config, sex) => {
  if (!config.bySex) return { min: config.min, max: config.max };

  const key = String(sex || '').toLowerCase();
  if (key === 'male' || key === 'm') return config.bySex.male;
  if (key === 'female' || key === 'f') return config.bySex.female;

  // Unknown sex — widen to the union so a healthy value is never flagged.
  return {
    min: Math.min(config.bySex.male.min, config.bySex.female.min),
    max: Math.max(config.bySex.male.max, config.bySex.female.max),
  };
};

/**
 * Evaluate one measured value against its reference range.
 *
 * @param {string} name   canonical parameter name (a key of labRanges)
 * @param {number|string} value
 * @param {string} [sex]  'male' | 'female' | undefined
 */
const evaluateParameter = (name, value, sex) => {
  const config = labRanges[name];
  if (!config) return { status: 'normal', normalRange: 'N/A', unit: '' };

  const { min, max } = rangeFor(config, sex);
  const normalRange = `${min}-${max}`;
  const numValue = parseFloat(value);

  if (Number.isNaN(numValue)) {
    return { status: 'normal', normalRange, unit: config.unit };
  }

  let status = 'normal';
  if (numValue < min) status = 'low';
  else if (numValue > max) status = 'high';

  // Escalate to critical only for parameters where being out of range is
  // clinically urgent, and only when the deviation is substantial.
  if (status !== 'normal' && config.critical) {
    const farHigh = numValue > max * 1.5;
    // Guard min === 0 (e.g. cholesterol), where min * 0.5 is also 0.
    const farLow = min > 0 && numValue < min * 0.5;
    if (farHigh || farLow) status = 'critical';
  }

  return { status, normalRange, unit: config.unit, numericValue: numValue };
};

/** Flat list of { canonical, alias } pairs, longest alias first so that
 *  "total cholesterol" wins over the bare "cholesterol" substring. */
const aliasIndex = Object.entries(labRanges)
  .flatMap(([canonical, cfg]) => (cfg.aliases || [canonical.toLowerCase()]).map((alias) => ({ canonical, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);

module.exports = { evaluateParameter, labRanges, aliasIndex, rangeFor };
