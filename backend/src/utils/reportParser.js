/**
 * Mock Report Parser
 * In production, this would integrate with OCR / NLP services
 * to extract data from uploaded medical reports (PDFs, images).
 */

/**
 * Parse an uploaded report file and extract key findings
 * @param {string} filePath - Path to the uploaded file
 * @param {string} reportType - Type of report (blood_test, xray, etc.)
 * @returns {Object} Parsed report data
 */
const parseReport = async (filePath, reportType) => {
  // Mock parsing — in production, integrate with Tesseract OCR / Google Vision / custom ML
  console.log(`📄 Parsing report: ${filePath} (type: ${reportType})`);

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock parsed data based on report type
  const mockResults = {
    blood_test: {
      summary: 'Blood test analysis completed. Most parameters within normal range.',
      riskLevel: 'low',
      findings: [
        { parameter: 'Hemoglobin', value: '14.2 g/dL', normalRange: '13.5-17.5 g/dL', status: 'normal' },
        { parameter: 'WBC Count', value: '7,500 /μL', normalRange: '4,500-11,000 /μL', status: 'normal' },
        { parameter: 'Platelet Count', value: '250,000 /μL', normalRange: '150,000-400,000 /μL', status: 'normal' },
        { parameter: 'Blood Sugar (Fasting)', value: '110 mg/dL', normalRange: '70-100 mg/dL', status: 'high' },
      ],
      recommendations: [
        'Blood sugar is slightly elevated — consider monitoring fasting glucose regularly.',
        'Maintain a balanced diet and regular exercise.',
        'Follow up with your physician in 3 months.',
      ],
    },
    xray: {
      summary: 'Chest X-ray reviewed. No significant abnormalities detected.',
      riskLevel: 'low',
      findings: [
        { parameter: 'Lung Fields', value: 'Clear', normalRange: 'Clear', status: 'normal' },
        { parameter: 'Heart Size', value: 'Normal', normalRange: 'Normal', status: 'normal' },
      ],
      recommendations: ['No immediate concerns. Routine follow-up recommended.'],
    },
    other: {
      summary: 'Report uploaded successfully. Awaiting manual review by a physician.',
      riskLevel: '',
      findings: [],
      recommendations: ['Please wait for your doctor to review this report.'],
    },
  };

  return mockResults[reportType] || mockResults.other;
};

module.exports = { parseReport };
