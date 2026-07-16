import type { Patient } from '../api/client';

/** Mock chest X-ray files in /public/xrays (1.jpg … 15.jpg) */
export const MOCK_XRAY_COUNT = 15;

export type PatientXrayStudy = {
  id: string;
  title: string;
  modality: string;
  bodyPart: string;
  date: string;
  src: string;
  filename: string;
};

function xrayPath(index: number) {
  const n = ((index - 1) % MOCK_XRAY_COUNT) + 1;
  return {
    n,
    src: `/xrays/${n}.jpg`,
    filename: `${n}.jpg`,
  };
}

/** Deterministic mock imaging studies for a patient (unique pairing where possible). */
export function getPatientXrays(patient: Patient): PatientXrayStudy[] {
  const primary = xrayPath(patient.id);
  const secondary = xrayPath(patient.id + 7);
  const tertiary = xrayPath(patient.id + 11);

  const studies: PatientXrayStudy[] = [
    {
      id: `${patient.mrn}-xr-1`,
      title: 'Chest X-Ray — PA',
      modality: 'XR',
      bodyPart: 'Chest',
      date: '2026-06-12',
      src: primary.src,
      filename: primary.filename,
    },
    {
      id: `${patient.mrn}-xr-2`,
      title: 'Chest X-Ray — Lateral',
      modality: 'XR',
      bodyPart: 'Chest',
      date: '2026-06-12',
      src: secondary.src,
      filename: secondary.filename,
    },
  ];

  // Older / higher-acuity demos get a prior comparison study
  if (patient.age >= 55 || (patient.allergies?.length ?? 0) > 0) {
    studies.push({
      id: `${patient.mrn}-xr-3`,
      title: 'Prior Chest X-Ray',
      modality: 'XR',
      bodyPart: 'Chest',
      date: '2025-11-03',
      src: tertiary.src,
      filename: tertiary.filename,
    });
  }

  return studies;
}

/** Load a public mock X-ray as a File for Vision API upload. */
export async function loadMockXrayFile(filename: string): Promise<File> {
  const res = await fetch(`/xrays/${filename}`);
  if (!res.ok) throw new Error(`Failed to load mock X-ray ${filename}`);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
