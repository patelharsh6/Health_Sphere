const labRanges = {
  Hemoglobin: { min: 13.5, max: 17.5, unit: 'g/dL' },
  'WBC Count': { min: 4500, max: 11000, unit: '/μL' },
  'Platelet Count': { min: 150000, max: 400000, unit: '/μL' },
  'Blood Sugar (Fasting)': { min: 70, max: 100, unit: 'mg/dL' },
  Cholesterol: { min: 0, max: 200, unit: 'mg/dL' },
};

const evaluateParameter = (name, value) => {
  const range = labRanges[name];
  if (!range) return { status: 'normal', normalRange: 'N/A', unit: '' };
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return { status: 'normal', normalRange: `${range.min}-${range.max}`, unit: range.unit };

  let status = 'normal';
  if (numValue < range.min) status = 'low';
  if (numValue > range.max) status = 'high';
  if (numValue > range.max * 1.5 || numValue < range.min * 0.5) status = 'critical';

  return { status, normalRange: `${range.min}-${range.max}`, unit: range.unit, numericValue: numValue };
};

module.exports = { evaluateParameter, labRanges };
