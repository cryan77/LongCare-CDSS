import { Avatar } from '@mui/material';
import { useMemo, useState } from 'react';
import type { Patient } from '../../api/client';

type Props = {
  patient: Patient;
  size?: number;
};

function hash(value: string) {
  return value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function initials(patient: Patient) {
  return `${patient.first_name[0] || ''}${patient.last_name[0] || ''}`.toUpperCase();
}

/** Stable mock portrait from RandomUser CDN (gender-aware, seeded by MRN). */
export function patientPhotoUrl(patient: Patient, size = 150): string {
  const seed = hash(`${patient.mrn}|${patient.first_name}|${patient.last_name}`);
  const isFemale = patient.gender.toLowerCase().startsWith('f');
  const folder = isFemale ? 'women' : 'men';
  const id = seed % 100; // randomuser portraits are 0–99
  // Request via images.weserv.nl for consistent sizing/caching when needed;
  // direct CDN is fine for demo:
  void size;
  return `https://randomuser.me/api/portraits/${folder}/${id}.jpg`;
}

export default function PatientAvatar({ patient, size = 76 }: Props) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => patientPhotoUrl(patient, size * 2), [patient, size]);

  return (
    <Avatar
      src={failed ? undefined : src}
      alt={`${patient.first_name} ${patient.last_name}`}
      onError={() => setFailed(true)}
      sx={{
        width: size,
        height: size,
        flex: '0 0 auto',
        fontSize: Math.max(14, size * 0.32),
        fontWeight: 700,
        bgcolor: 'primary.main',
        border: '3px solid',
        borderColor: 'background.paper',
        boxShadow: '0 8px 22px rgba(15, 47, 84, 0.14)',
      }}
    >
      {initials(patient)}
    </Avatar>
  );
}
