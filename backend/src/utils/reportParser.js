const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { evaluateParameter, aliasIndex, labRanges } = require('./labRanges');
const { NODE_ENV } = require('../config/env');
const { calculateRisk } = require('./riskCalculator');

/**
 * Pull the measured value out of a lab-report line.
 *
 * Lab reports put the reference range on the same line as the result:
 *
 *   Hemoglobin        11.2      g/dL      13.5 - 17.5
 *
 * A naive "first number after the label" regex is right here, but a naive
 * "any number on the line" regex would grab 13.5. We therefore take the first
 * number after the label and explicitly reject one that is immediately part of
 * a range (`13.5 - 17.5`), which is what a mis-aligned OCR line looks like.
 */
const valueFromLine = (line, matchEnd) => {
  const rest = line.slice(matchEnd);

  // Walk every number after the label and take the first that is not the
  // left-hand side of a "a - b" range and not a pure unit artefact.
  const numberRx = /(-?\d+(?:[.,]\d+)?)/g;
  let m;
  while ((m = numberRx.exec(rest)) !== null) {
    const raw = m[1].replace(',', '.');
    const after = rest.slice(m.index + m[1].length);

    // "13.5 - 17.5" → this number opens a reference range, so skip it.
    if (/^\s*[-–]\s*\d/.test(after)) continue;

    const num = parseFloat(raw);
    if (Number.isNaN(num)) continue;
    return num;
  }
  return null;
};

/**
 * Extract lab parameters from the report text.
 *
 * Works line by line so a value can never be pulled from a different test's
 * row, and matches against the alias table so different labs' spellings
 * ("Hb", "Haemoglobin", "HGB") all resolve to one canonical parameter.
 *
 * @param {string} text
 * @param {string} [sex] patient sex, for sex-specific reference ranges
 */
const extractMetrics = (text, sex) => {
  const found = new Map();
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    for (const { canonical, alias } of aliasIndex) {
      // First canonical match on a line wins, and each parameter is only
      // captured once (reports often repeat a name in a summary section).
      if (found.has(canonical)) continue;

      // Word-boundary match so "hb" does not fire inside "hba1c".
      const rx = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      const match = rx.exec(lower);
      if (!match) continue;

      const value = valueFromLine(line, match.index + match[0].length);
      if (value === null) continue;

      const result = evaluateParameter(canonical, value, sex);
      found.set(canonical, {
        parameter: canonical,
        value: String(value),
        numericValue: value,
        unit: result.unit,
        normalRange: result.normalRange,
        status: result.status,
        trend: '', // filled in by applyTrends when history exists
      });
      break;
    }
  }

  return [...found.values()];
};

/**
 * Compare each finding against the same parameter in the patient's previous
 * report and set a real trend, replacing the hardcoded 'stable'.
 *
 * `trend` describes movement, not judgement: 'up' means the number rose. The
 * UI pairs it with `status` to decide whether that is good or bad.
 *
 * @param {Array} findings           current findings (mutated)
 * @param {Array} previousFindings   findings from the most recent prior report
 */
const applyTrends = (findings, previousFindings = []) => {
  if (!previousFindings.length) {
    // No history — leave trend empty rather than claiming stability we cannot
    // demonstrate. The schema allows '' precisely for this case.
    findings.forEach((f) => {
      f.trend = '';
    });
    return findings;
  }

  const prior = new Map(
    previousFindings
      .filter((p) => typeof p.numericValue === 'number' && !Number.isNaN(p.numericValue))
      .map((p) => [p.parameter, p.numericValue])
  );

  findings.forEach((f) => {
    const before = prior.get(f.parameter);
    if (before === undefined || typeof f.numericValue !== 'number') {
      f.trend = '';
      return;
    }

    // Only call it a move if it is more than 5% — lab-to-lab noise otherwise
    // shows up as a trend arrow on every single parameter.
    const delta = f.numericValue - before;
    const threshold = Math.abs(before) * 0.05;

    if (Math.abs(delta) <= threshold) f.trend = 'stable';
    else f.trend = delta > 0 ? 'up' : 'down';
  });

  return findings;
};

/** Human-readable summary derived from what was actually found. */
const buildSummary = (findings, riskLevel) => {
  if (!findings.length) {
    return 'We could not read any recognisable lab values from this file. It may be a scan of poor quality, or a document type we do not parse yet.';
  }

  const abnormal = findings.filter((f) => f.status !== 'normal');
  const critical = findings.filter((f) => f.status === 'critical');

  if (!abnormal.length) {
    return `Extracted ${findings.length} lab parameter${findings.length === 1 ? '' : 's'}; all of them fall within their reference ranges.`;
  }

  const names = abnormal.slice(0, 4).map((f) => `${f.parameter} (${f.status})`).join(', ');
  const more = abnormal.length > 4 ? `, and ${abnormal.length - 4} more` : '';

  return (
    `Extracted ${findings.length} lab parameters. ${abnormal.length} fall outside the ` +
    `reference range: ${names}${more}. ` +
    (critical.length
      ? 'Some values are markedly out of range and warrant prompt medical review.'
      : `Overall assessed risk is ${riskLevel}.`)
  );
};

/** Recommendations keyed off the specific parameters that came back abnormal. */
const buildRecommendations = (findings, riskLevel) => {
  const recs = [];
  const status = (name) => findings.find((f) => f.parameter === name)?.status;
  const isHigh = (name) => ['high', 'critical'].includes(status(name));
  const isLow = (name) => ['low', 'critical'].includes(status(name));

  if (riskLevel === 'critical' || findings.some((f) => f.status === 'critical')) {
    recs.push('Some values are far outside the normal range — please consult a doctor promptly.');
  }

  if (isHigh('Blood Sugar (Fasting)') || isHigh('HbA1c')) {
    recs.push('Blood sugar is elevated. Reduce refined carbohydrates and added sugar, and ask a physician about a diabetes screen.');
  }
  if (isHigh('Cholesterol') || isHigh('LDL Cholesterol') || isHigh('Triglycerides')) {
    recs.push('Your lipid profile is raised. Cut down on fried and processed food and aim for 30 minutes of activity most days.');
  }
  if (isLow('Hemoglobin')) {
    recs.push('Haemoglobin is low, which can indicate anaemia. Iron-rich foods help, but ask a doctor to identify the cause.');
  }
  if (isHigh('TSH')) {
    recs.push('TSH is elevated, which can point to an underactive thyroid. A physician can confirm with a full thyroid panel.');
  }
  if (isLow('Vitamin D')) {
    recs.push('Vitamin D is low. Sensible sun exposure and dietary sources help; ask a doctor about supplementation.');
  }
  if (isLow('Vitamin B12')) {
    recs.push('Vitamin B12 is low. This is common on vegetarian diets — discuss supplementation with a doctor.');
  }
  if (isHigh('Creatinine') || isHigh('Urea')) {
    recs.push('Kidney markers are raised. Stay well hydrated and ask a physician about a follow-up renal panel.');
  }
  if (isHigh('SGPT') || isHigh('SGOT')) {
    recs.push('Liver enzymes are raised. Avoid alcohol and ask a doctor about a follow-up liver panel.');
  }

  if (!recs.length) {
    recs.push('All extracted values look normal. Keep up your current diet, activity and sleep routine.');
  }

  recs.push('This automated analysis is not a diagnosis — please review these results with a qualified doctor.');
  return recs;
};

/**
 * Read a report file and produce a structured analysis.
 *
 * @param {string} filePath
 * @param {string} reportType
 * @param {string} [mimetype]
 * @param {object} [context]                   optional extras
 * @param {string} [context.sex]               patient sex, for reference ranges
 * @param {Array}  [context.previousFindings]  findings from the prior report, for trends
 */
const parseReport = async (filePath, reportType, mimetype, context = {}) => {
  const { sex, previousFindings = [] } = context;

  let text = '';
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf' || mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text || '';
    } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) || (mimetype || '').startsWith('image/')) {
      // Tesseract is chatty; only surface its progress in development.
      const logger = NODE_ENV === 'development' ? undefined : () => {};
      const { data } = await Tesseract.recognize(filePath, 'eng', { logger });
      text = data.text || '';
    } else {
      // Unsupported type: report it honestly instead of inventing fixture text.
      throw new Error(`Unsupported file type for analysis: ${ext || mimetype || 'unknown'}`);
    }
  } catch (error) {
    console.error('ParseReport read error:', error.message);
    throw new Error(`Failed to read report: ${error.message}`);
  }

  const findings = applyTrends(extractMetrics(text, sex), previousFindings);
  const { riskScore, riskLevel } = calculateRisk(findings);

  return {
    summary: buildSummary(findings, riskLevel),
    riskLevel,
    riskScore,
    findings,
    recommendations: buildRecommendations(findings, riskLevel),
    // Lets the UI distinguish "nothing was wrong" from "nothing was readable".
    parametersFound: findings.length,
  };
};

module.exports = {
  parseReport,
  // exported for testing
  extractMetrics,
  applyTrends,
  valueFromLine,
  labRanges,
};
