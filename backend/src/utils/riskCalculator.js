const calculateRisk = (findings) => {
  let riskScore = 0;
  
  findings.forEach((finding) => {
    if (finding.status === 'low' || finding.status === 'high') riskScore += 20;
    if (finding.status === 'critical') riskScore += 50;
  });

  let riskLevel = 'low';
  if (riskScore >= 20 && riskScore < 50) riskLevel = 'moderate';
  if (riskScore >= 50 && riskScore < 100) riskLevel = 'high';
  if (riskScore >= 100) riskLevel = 'critical';

  return { riskScore, riskLevel };
};

module.exports = { calculateRisk };
