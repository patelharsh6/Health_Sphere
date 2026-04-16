/**
 * Health Risk Calculator
 * Calculates a patient's overall risk score based on their profile and report data.
 * In production, this could be backed by an ML model.
 */

/**
 * Calculate risk score from patient data
 * @param {Object} patient - Patient profile data
 * @param {Array} reports - Array of recent reports with AI analysis
 * @returns {Object} Risk assessment
 */
const calculateRiskScore = (patient, reports = []) => {
  let score = 0;
  const factors = [];

  // Age factor
  const age = patient.age || 0;
  if (age > 60) {
    score += 20;
    factors.push('Age above 60');
  } else if (age > 45) {
    score += 10;
    factors.push('Age above 45');
  }

  // Chronic conditions factor
  if (patient.chronicConditions && patient.chronicConditions.length > 0) {
    score += patient.chronicConditions.length * 15;
    factors.push(`${patient.chronicConditions.length} chronic condition(s)`);
  }

  // Allergies factor
  if (patient.allergies && patient.allergies.length > 2) {
    score += 5;
    factors.push('Multiple allergies');
  }

  // Report-based risk
  if (reports.length > 0) {
    const highRiskReports = reports.filter(
      (r) => r.aiAnalysis && (r.aiAnalysis.riskLevel === 'high' || r.aiAnalysis.riskLevel === 'critical')
    );
    if (highRiskReports.length > 0) {
      score += highRiskReports.length * 25;
      factors.push(`${highRiskReports.length} high-risk report(s)`);
    }
  }

  // Cap the score at 100
  score = Math.min(score, 100);

  // Determine risk level
  let riskLevel;
  if (score <= 20) riskLevel = 'low';
  else if (score <= 45) riskLevel = 'moderate';
  else if (score <= 70) riskLevel = 'high';
  else riskLevel = 'critical';

  return {
    score,
    riskLevel,
    factors,
    recommendation:
      riskLevel === 'low'
        ? 'Your health looks good. Continue regular check-ups.'
        : riskLevel === 'moderate'
        ? 'Some factors need attention. Schedule a consultation.'
        : 'Immediate medical attention recommended. Please consult a specialist.',
  };
};

module.exports = { calculateRiskScore };
