/**
 * Turn a set of findings into a 0-100 risk score and a coarse risk level.
 *
 * The score is deliberately *proportional* to how many parameters were read,
 * not a flat sum. A flat sum breaks as soon as the extractor gets good: a panel
 * where 5 of 28 values are mildly off is a moderate result, but a flat +20 each
 * would score 100 and report "critical".
 *
 * Weights are per-abnormal-parameter severity, averaged over everything read,
 * then scaled. A single critical value alone is enough to reach 'high', because
 * one badly out-of-range electrolyte matters more than ten borderline ones.
 */
const WEIGHTS = { normal: 0, low: 1, high: 1, critical: 4 };

// Smallest panel size the proportional score is allowed to divide by.
const MIN_PANEL = 6;

const calculateRisk = (findings = []) => {
  const scored = findings.filter((f) => f && f.status in WEIGHTS);

  if (!scored.length) return { riskScore: 0, riskLevel: 'low' };

  const total = scored.reduce((sum, f) => sum + WEIGHTS[f.status], 0);
  const criticalCount = scored.filter((f) => f.status === 'critical').length;
  const abnormalCount = scored.filter((f) => f.status !== 'normal').length;

  // Weighted share of the panel that is abnormal: one abnormal value in four
  // scores 25, one critical value counts as four abnormal ones.
  //
  // The denominator is floored at MIN_PANEL because a ratio is meaningless on a
  // tiny sample: a scan where only haemoglobin was legible and came back mildly
  // low is one abnormal value out of one, and without this floor that would
  // score 100 and report 'critical'.
  const proportional = (total / Math.max(scored.length, MIN_PANEL)) * 100;

  // A single critical value must not be diluted by a large normal panel, so it
  // carries a floor of its own. Everything else is left to the ratio.
  let riskScore = Math.round(proportional);
  if (criticalCount >= 2) riskScore = Math.max(riskScore, 80);
  else if (criticalCount === 1) riskScore = Math.max(riskScore, 55);
  else if (abnormalCount >= 1) riskScore = Math.max(riskScore, 20);

  riskScore = Math.min(100, riskScore);

  let riskLevel = 'low';
  if (riskScore >= 75) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'moderate';

  return { riskScore, riskLevel };
};

module.exports = { calculateRisk };
