const { extractMetrics, applyTrends, valueFromLine } = require('../src/utils/reportParser');
const { calculateRisk } = require('../src/utils/riskCalculator');
const { evaluateParameter } = require('../src/utils/labRanges');

// A realistic Indian-lab layout: result, unit, then the reference range on the
// same line — the shape that used to make the old parser read the range.
const PANEL = `
          COMPLETE BLOOD COUNT
Test Name                Result      Unit         Reference Range
Haemoglobin (Hb)         11.2        g/dL         13.5 - 17.5
Total Leucocyte Count    12800       /uL          4000 - 11000
Platelet Count           210000      /uL          150000 - 410000
PCV                      38.4        %            41 - 50

          BIOCHEMISTRY
Fasting Blood Sugar      142         mg/dL        70 - 100
HbA1c                    7.8         %            4.0 - 5.7
Total Cholesterol        238         mg/dL        < 200
HDL Cholesterol          38          mg/dL        40 - 60
Serum Creatinine         1.1         mg/dL        0.7 - 1.3
SGPT (ALT)               64          U/L          7 - 56
TSH                      5.9         uIU/mL       0.4 - 4.0
Vitamin D                18          ng/mL        30 - 100
`;

describe('valueFromLine', () => {
  it('takes the result, not the reference range that follows it', () => {
    const line = 'Haemoglobin (Hb)   11.2   g/dL   13.5 - 17.5';
    const idx = line.toLowerCase().indexOf('haemoglobin') + 'haemoglobin'.length;
    expect(valueFromLine(line, idx)).toBe(11.2);
  });

  it('handles a comma decimal separator', () => {
    expect(valueFromLine('Hb 11,2 g/dL', 2)).toBe(11.2);
  });

  it('returns null when there is no number', () => {
    expect(valueFromLine('Hemoglobin  not detected', 10)).toBeNull();
  });
});

describe('extractMetrics', () => {
  it('resolves lab-specific aliases to canonical parameters', () => {
    const found = extractMetrics(PANEL, 'male');
    const names = found.map((f) => f.parameter);

    expect(names).toContain('Hemoglobin');       // "Haemoglobin (Hb)"
    expect(names).toContain('WBC Count');        // "Total Leucocyte Count"
    expect(names).toContain('Hematocrit');       // "PCV"
    expect(names).toContain('SGPT');             // "SGPT (ALT)"
    expect(names).toContain('Blood Sugar (Fasting)');
  });

  it('extracts substantially more than the five the old parser managed', () => {
    expect(extractMetrics(PANEL, 'male').length).toBeGreaterThanOrEqual(12);
  });

  it('reads the correct value and flags status against the range', () => {
    const found = extractMetrics(PANEL, 'male');
    const hb = found.find((f) => f.parameter === 'Hemoglobin');

    expect(hb.numericValue).toBe(11.2);
    expect(hb.status).toBe('low');
    expect(hb.unit).toBe('g/dL');
  });

  it('does not match "hb" inside "hba1c"', () => {
    const found = extractMetrics('HbA1c 7.8 %', 'male');
    expect(found.map((f) => f.parameter)).toEqual(['HbA1c']);
  });

  it('captures each parameter only once', () => {
    const twice = `Hemoglobin 11.2 g/dL\nSummary: Hemoglobin 11.2 g/dL`;
    expect(extractMetrics(twice, 'male')).toHaveLength(1);
  });

  it('returns nothing, and does not throw, on unreadable text', () => {
    ['', 'no numbers at all', '!!! ??? ***', null, undefined].forEach((input) => {
      expect(() => extractMetrics(input, 'male')).not.toThrow();
      expect(extractMetrics(input, 'male')).toEqual([]);
    });
  });
});

describe('Sex-specific reference ranges', () => {
  it('judges the same haemoglobin differently by sex', () => {
    expect(evaluateParameter('Hemoglobin', 13.0, 'male').status).toBe('low');
    expect(evaluateParameter('Hemoglobin', 13.0, 'female').status).toBe('normal');
  });

  it('widens to the union when sex is unknown, so nothing healthy is flagged', () => {
    expect(evaluateParameter('Hemoglobin', 13.0, undefined).status).toBe('normal');
  });

  it('does not escalate to critical for a non-critical parameter', () => {
    // Cholesterol is out of range but not clinically urgent.
    expect(evaluateParameter('Cholesterol', 400).status).toBe('high');
  });

  it('escalates a far-out critical parameter', () => {
    expect(evaluateParameter('Blood Sugar (Fasting)', 400).status).toBe('critical');
  });

  it('does not divide by a zero minimum when escalating', () => {
    // Cholesterol's min is 0; min * 0.5 is also 0, so a low value must not
    // be mistaken for critical.
    expect(['normal', 'low', 'high']).toContain(evaluateParameter('Cholesterol', 10).status);
  });
});

describe('applyTrends', () => {
  it('leaves trend empty when there is no history', () => {
    const findings = extractMetrics(PANEL, 'male');
    applyTrends(findings, []);
    expect(findings.every((f) => f.trend === '')).toBe(true);
  });

  it('marks a real move up or down', () => {
    const findings = [
      { parameter: 'Hemoglobin', numericValue: 13.0, trend: '' },
      { parameter: 'HbA1c', numericValue: 6.0, trend: '' },
    ];
    applyTrends(findings, [
      { parameter: 'Hemoglobin', numericValue: 10.0 },
      { parameter: 'HbA1c', numericValue: 8.0 },
    ]);

    expect(findings[0].trend).toBe('up');
    expect(findings[1].trend).toBe('down');
  });

  it('calls a sub-5% wobble stable rather than a trend', () => {
    const findings = [{ parameter: 'TSH', numericValue: 5.9, trend: '' }];
    applyTrends(findings, [{ parameter: 'TSH', numericValue: 5.85 }]);
    expect(findings[0].trend).toBe('stable');
  });

  it('leaves a parameter absent from history empty', () => {
    const findings = [{ parameter: 'Vitamin D', numericValue: 18, trend: '' }];
    applyTrends(findings, [{ parameter: 'Hemoglobin', numericValue: 14 }]);
    expect(findings[0].trend).toBe('');
  });
});

describe('calculateRisk', () => {
  const mk = (n, status) => Array.from({ length: n }, (_, i) => ({ parameter: `P${i}${status}`, status }));

  it('is low for an all-normal panel', () => {
    expect(calculateRisk(mk(17, 'normal'))).toEqual({ riskScore: 0, riskLevel: 'low' });
  });

  it('handles empty and undefined input', () => {
    expect(calculateRisk([])).toEqual({ riskScore: 0, riskLevel: 'low' });
    expect(calculateRisk()).toEqual({ riskScore: 0, riskLevel: 'low' });
  });

  it('does not call a handful of mild deviations critical', () => {
    // The old flat +20 per abnormality scored 5-of-28 as 100/critical.
    const risk = calculateRisk([...mk(5, 'high'), ...mk(23, 'normal')]);
    expect(risk.riskLevel).toBe('moderate');
  });

  it('does not let a single mildly abnormal value on a tiny panel score 100', () => {
    // A scan where only one value was legible must not read as catastrophic.
    const risk = calculateRisk(mk(1, 'high'));
    expect(risk.riskScore).toBeLessThan(50);
    expect(risk.riskLevel).toBe('moderate');
  });

  it('will not dilute a critical value in a large normal panel', () => {
    const risk = calculateRisk([...mk(1, 'critical'), ...mk(27, 'normal')]);
    expect(risk.riskLevel).toBe('high');
  });

  it('reaches critical for multiple critical values', () => {
    expect(calculateRisk([...mk(2, 'critical'), ...mk(26, 'normal')]).riskLevel).toBe('critical');
  });

  it('caps the score at 100', () => {
    expect(calculateRisk(mk(10, 'critical')).riskScore).toBe(100);
  });

  it('ignores findings with an unrecognised status', () => {
    expect(calculateRisk([{ status: 'bogus' }, ...mk(9, 'normal')]).riskLevel).toBe('low');
  });
});
