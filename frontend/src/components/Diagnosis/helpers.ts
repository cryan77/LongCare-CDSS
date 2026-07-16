import type { Patient } from '../../api/client';

export function bmiFromVitals(vitals: Record<string, unknown> | undefined) {
  const w = Number(vitals?.weight_kg);
  const h = Number(vitals?.height_m);
  if (!w || !h) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

export function heightCm(vitals: Record<string, unknown> | undefined) {
  const h = Number(vitals?.height_m);
  return h ? Math.round(h * 100) : null;
}

export function patientHistory(patient: Patient) {
  return (patient.medical_history || {}) as {
    conditions?: string[];
    medications?: string[];
    labs?: Record<string, number | string>;
    prior_encounters?: { date?: string; complaint?: string; provider?: string }[];
    nursing_notes?: { time?: string; note?: string }[];
  };
}

export function riskLevel(confidence: number, safetyFlags: string[]) {
  if (safetyFlags.length || confidence >= 0.85) return 'HIGH' as const;
  if (confidence >= 0.55) return 'MEDIUM' as const;
  return 'LOW' as const;
}

export function differentialWithScores(
  primary: { name: string; probability: number } | undefined,
  differential: string[],
  confidence: number,
) {
  const items: { name: string; pct: number }[] = [];
  if (primary?.name) {
    items.push({
      name: primary.name,
      pct: Math.round((primary.probability || confidence) * (primary.probability > 1 ? 1 : 100)),
    });
  }
  differential.forEach((name, i) => {
    if (items.some((x) => x.name === name)) return;
    items.push({ name, pct: Math.max(6, Math.round((items[0]?.pct || 60) * (0.55 - i * 0.12))) });
  });
  return items;
}

export function explainabilityFactors(symptoms: string[], hasLabs: boolean, hasImaging: boolean) {
  const factors = [
    { label: 'Symptoms', weight: symptoms.length ? 28 : 12 },
    { label: 'Laboratory', weight: hasLabs ? 32 : 10 },
    { label: 'Imaging / ECG', weight: hasImaging ? 24 : 8 },
    { label: 'Medical History', weight: 18 },
    { label: 'Age / Demographics', weight: 8 },
  ];
  const total = factors.reduce((s, f) => s + f.weight, 0);
  return factors.map((f) => ({ ...f, pct: Math.round((f.weight / total) * 100) }));
}

export function labStatus(name: string, value: number | string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return { tone: 'default' as const, label: 'Recorded' };
  const key = name.toLowerCase();
  if (key.includes('troponin') && n > 0.04) return { tone: 'error' as const, label: 'High' };
  if (key.includes('wbc') && (n > 11000 || n < 4000)) return { tone: 'warning' as const, label: n > 11000 ? 'High' : 'Low' };
  if ((key.includes('glucose') || key.includes('hba1c')) && n > 126) return { tone: 'warning' as const, label: 'High' };
  if (key.includes('creatinine') && n > 1.3) return { tone: 'warning' as const, label: 'High' };
  return { tone: 'success' as const, label: 'Normal' };
}

export const DEFAULT_TESTS = [
  'Coronary Angiography',
  'Echocardiogram',
  'Repeat Troponin',
  'Lipid Profile',
  'CT Angiography',
  'Blood Culture',
  'CRP',
  'Sputum culture',
];
