export type ImagingResult = {
  findings: string;
  abnormalities: string[];
  confidence: number;
  image_id: string;
  provider: string;
};

export function confidencePercent(value?: number) {
  if (value == null) return 0;
  return Math.round(value * (value <= 1 ? 100 : 1));
}

export function primaryFinding(result: ImagingResult | null) {
  return result?.abnormalities?.[0] || result?.findings?.split(/[.\n]/)[0] || 'No AI finding yet';
}

export function severityFor(confidence: number) {
  const pct = confidencePercent(confidence);
  if (pct >= 90) return 'High';
  if (pct >= 70) return 'Moderate';
  return 'Low';
}

export function findingScores(result: ImagingResult | null) {
  if (!result) return [];
  const base = confidencePercent(result.confidence);
  const findings = result.abnormalities.length
    ? result.abnormalities
    : [primaryFinding(result)];
  return findings.slice(0, 4).map((name, index) => ({
    name,
    score: Math.max(18, base - index * 8),
  }));
}

export function anatomyStatuses(result: ImagingResult | null) {
  const text = `${result?.findings || ''} ${(result?.abnormalities || []).join(' ')}`.toLowerCase();
  return [
    { region: 'Lungs', abnormal: /lung|opacity|infiltrate|pneumonia|edema/.test(text) },
    { region: 'Heart', abnormal: /cardiac|cardiomegaly|heart/.test(text) },
    { region: 'Pleura', abnormal: /pleura|effusion|pneumothorax/.test(text) },
    { region: 'Bones', abnormal: /fracture|osseous|bone/.test(text) },
    { region: 'Diaphragm', abnormal: /diaphragm|hernia/.test(text) },
  ];
}

export function imagingDifferentials(result: ImagingResult | null) {
  const primary = confidencePercent(result?.confidence);
  const text = `${result?.findings || ''} ${(result?.abnormalities || []).join(' ')}`.toLowerCase();
  if (/opacity|infiltrate|pneumonia|consolidation/.test(text)) {
    return [
      { name: 'Community-acquired pneumonia', score: Math.max(primary, 81) },
      { name: 'Pulmonary edema', score: 28 },
      { name: 'Atelectasis', score: 22 },
      { name: 'Malignancy', score: 11 },
    ];
  }
  return [
    { name: primaryFinding(result), score: primary || 75 },
    { name: 'Clinical correlation required', score: 35 },
    { name: 'No acute cardiopulmonary process', score: Math.max(10, 100 - primary) },
  ];
}

export function explanationFor(result: ImagingResult | null) {
  if (!result) return ['Run AI analysis to generate explainability factors.'];
  const text = `${result.findings} ${result.abnormalities.join(' ')}`.toLowerCase();
  const factors = ['Image density and texture patterns', 'Anatomical location and distribution'];
  if (/opacity|infiltrate|consolidation/.test(text)) factors.push('Loss of normal lung markings');
  if (/effusion/.test(text)) factors.push('Blunting / pleural fluid pattern');
  if (/cardiac|heart|cardiomegaly/.test(text)) factors.push('Cardiac silhouette dimensions');
  return factors;
}

export function recommendationsFor(result: ImagingResult | null) {
  const text = `${result?.findings || ''} ${(result?.abnormalities || []).join(' ')}`.toLowerCase();
  if (/pneumonia|opacity|infiltrate|consolidation/.test(text)) {
    return [
      { action: 'Repeat chest X-ray', timing: '48–72 Hours if not improving' },
      { action: 'CT Chest', timing: 'Consider if finding persists' },
      { action: 'Pulmonology / radiology review', timing: 'Recommended' },
      { action: 'Blood / sputum culture', timing: 'As clinically indicated' },
    ];
  }
  return [
    { action: 'Correlate with symptoms and labs', timing: 'Now' },
    { action: 'Radiologist review', timing: 'Recommended' },
    { action: 'Follow-up imaging', timing: 'Per clinical course' },
  ];
}

export function qualityAssessment() {
  return [
    { label: 'Exposure', value: 'Good' },
    { label: 'Rotation', value: 'Minimal' },
    { label: 'Motion', value: 'None' },
    { label: 'Quality Score', value: '95%' },
  ];
}

export function buildReport(result: ImagingResult | null, studyTitle: string) {
  if (!result) {
    return `STUDY\n${studyTitle}\n\nFINDINGS\nAI analysis has not been performed.\n\nIMPRESSION\nPending review.`;
  }
  return `STUDY\n${studyTitle}\n\nFINDINGS\n${result.findings}\n\nIMPRESSION\n${
    result.abnormalities.length ? result.abnormalities.join('; ') : 'No abnormality flagged by AI.'
  }\n\nRECOMMENDATION\nCorrelate with clinical findings and obtain radiologist review before clinical use.`;
}
