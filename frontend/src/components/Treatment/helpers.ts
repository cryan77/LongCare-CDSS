import type { Patient, TreatmentResult } from '../../api/client';
import { labStatus, patientHistory } from '../Diagnosis/helpers';

export type EditableMed = {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  route: string;
  evidence: number;
  included: boolean;
};

export function toEditableMeds(treatment: TreatmentResult | null): EditableMed[] {
  if (!treatment?.medications?.length) return [];
  return treatment.medications.map((m, i) => ({
    name: m.name,
    dose: m.dose || '—',
    frequency: m.frequency || 'Daily',
    duration: m.duration || '30 Days',
    route: /iv|intravenous/i.test(m.dose + m.frequency) ? 'IV' : 'PO',
    evidence: Math.max(3, 5 - i),
    included: true,
  }));
}

export function stars(n: number) {
  return '★'.repeat(Math.min(5, Math.max(0, n))) + '☆'.repeat(Math.max(0, 5 - n));
}

export function evidenceStrength(guidelines: { source: string }[], warningCount: number) {
  if (guidelines.length >= 2 && warningCount === 0) return 'HIGH' as const;
  if (guidelines.length >= 1) return 'MODERATE' as const;
  return 'LIMITED' as const;
}

export function primaryGuideline(guidelines: { source: string }[]) {
  return guidelines[0]?.source || 'Clinical protocol';
}

export function lifestyleFor(diagnosis: string): string[] {
  const d = diagnosis.toLowerCase();
  if (d.includes('coronary') || d.includes('acs') || d.includes('mi') || d.includes('cardiac')) {
    return [
      'Smoking cessation',
      'Cardiac diet (low sodium / low saturated fat)',
      'Gradual activity after clearance',
      'Weight reduction if overweight',
      'Stress management',
    ];
  }
  if (d.includes('pneumonia') || d.includes('copd') || d.includes('asthma')) {
    return ['Smoking cessation', 'Incentive spirometry / deep breathing', 'Hydration', 'Rest with progressive mobilization'];
  }
  if (d.includes('diabetes')) {
    return ['Carbohydrate-aware diet', 'Daily glucose checks', 'Foot care', 'Regular physical activity'];
  }
  return ['Medication adherence', 'Hydration', 'Rest as needed', 'Follow-up as scheduled', 'Seek care if symptoms worsen'];
}

export function proceduresFor(diagnosis: string): string[] {
  const d = diagnosis.toLowerCase();
  if (d.includes('coronary') || d.includes('acs') || d.includes('mi') || d.includes('cardiac')) {
    return ['Coronary Angiography', 'PCI evaluation', 'Echocardiogram', 'Cardiology consultation'];
  }
  if (d.includes('pneumonia')) {
    return ['Chest X-ray follow-up', 'Sputum culture', 'Blood culture', 'Pulmonary consultation if not improving'];
  }
  if (d.includes('uti') || d.includes('urinary')) {
    return ['Urine culture', 'Renal ultrasound if recurrent', 'Urology referral if complicated'];
  }
  return ['Specialist referral as indicated', 'Repeat imaging if clinically needed', 'Care coordination follow-up'];
}

export function monitoringFor(diagnosis: string): { item: string; schedule: string }[] {
  const d = diagnosis.toLowerCase();
  if (d.includes('coronary') || d.includes('acs') || d.includes('mi')) {
    return [
      { item: 'Blood Pressure', schedule: 'Daily' },
      { item: 'Creatinine', schedule: '48 Hours' },
      { item: 'ECG', schedule: 'Repeat / as needed' },
      { item: 'Troponin', schedule: '6 Hours' },
    ];
  }
  if (d.includes('pneumonia')) {
    return [
      { item: 'Oxygen saturation', schedule: 'q4–6h' },
      { item: 'Temperature', schedule: 'q6h' },
      { item: 'WBC / CRP', schedule: '48–72 Hours' },
      { item: 'Clinical reassessment', schedule: 'Daily' },
    ];
  }
  return [
    { item: 'Vitals', schedule: 'Per protocol' },
    { item: 'Symptom review', schedule: 'Daily' },
    { item: 'Labs as indicated', schedule: '48 Hours' },
    { item: 'Clinic review', schedule: '1–2 Weeks' },
  ];
}

export function followUpFor(diagnosis: string): { label: string; when: string }[] {
  const d = diagnosis.toLowerCase();
  if (d.includes('coronary') || d.includes('acs') || d.includes('mi')) {
    return [
      { label: 'Cardiology', when: 'Within 24 Hours' },
      { label: 'Repeat Troponin', when: '6 Hours' },
      { label: 'Clinic Review', when: '2 Weeks' },
    ];
  }
  return [
    { label: 'Primary / specialty follow-up', when: '48–72 Hours if unstable, else 1–2 Weeks' },
    { label: 'Lab reassessment', when: 'As clinically indicated' },
    { label: 'Patient education review', when: 'At discharge / visit' },
  ];
}

export function drugTimeline(meds: EditableMed[]) {
  const slots: { when: string; label: string; done?: boolean }[] = [];
  meds
    .filter((m) => m.included)
    .forEach((m, i) => {
      if (i === 0) slots.push({ when: 'Today 08:00', label: m.name, done: true });
      else if (i === 1) slots.push({ when: 'Today 09:00', label: m.name, done: true });
      else slots.push({ when: 'Today Evening', label: m.name });
    });
  if (!slots.length) slots.push({ when: 'Pending', label: 'Generate a treatment plan first' });
  return slots;
}

export function patientInstructions(diagnosis: string, meds: EditableMed[]): string[] {
  const names = meds.filter((m) => m.included).map((m) => m.name);
  return [
    names.length ? `Take ${names.join(', ')} exactly as prescribed.` : 'Take medications as prescribed.',
    `Seek emergency care if ${diagnosis.toLowerCase().includes('chest') || diagnosis.toLowerCase().includes('coronary') ? 'chest pain returns' : 'symptoms worsen suddenly'}.`,
    'Avoid smoking and limit alcohol unless your clinician advises otherwise.',
    'Follow the lifestyle and diet recommendations in your care plan.',
    'Return for scheduled follow-up; bring this medication list.',
  ];
}

export function recentLabChips(patient: Patient | null) {
  if (!patient) return [] as { name: string; label: string; tone: 'default' | 'error' | 'warning' | 'success' }[];
  const labs = patientHistory(patient).labs || {};
  return Object.entries(labs).map(([name, value]) => {
    const st = labStatus(name, value);
    return { name, label: `${name} ${st.label}`, tone: st.tone };
  });
}

export function allergySafety(allergies: string[], meds: EditableMed[]) {
  const alerts = allergies.map((a) => {
    const hit = meds.some((m) => m.included && m.name.toLowerCase().includes(a.toLowerCase().slice(0, 4)));
    return { allergy: a, safe: !hit, note: hit ? `Possible conflict with prescribed therapy` : `No ${a} prescribed` };
  });
  return alerts;
}

export function availabilityFor(meds: EditableMed[]) {
  return meds
    .filter((m) => m.included)
    .map((m, i) => ({
      name: m.name,
      status: i === 2 ? ('Low Stock' as const) : ('Available' as const),
      alternative: i === 2 ? 'Discuss formulary alternative with pharmacy' : undefined,
    }));
}
