import { Avatar } from '@mui/material';
import { useMemo, useState } from 'react';
import type { Patient } from '../../api/client';

type Props = {
  patient: Patient;
  size?: number;
};

function initials(patient: Patient) {
  return `${patient.first_name[0] || ''}${patient.last_name[0] || ''}`.toUpperCase();
}

export function exactGender(gender: string): 'male' | 'female' {
  const g = (gender || '').trim().toLowerCase();
  if (g.startsWith('f') || g === 'woman' || g === 'w') return 'female';
  return 'male';
}

/** Instant local avatar — pre-downloaded to /public/avatars/{MRN}.jpg */
export function patientPhotoUrl(patient: Patient): string {
  return `/avatars/${patient.mrn}.jpg`;
}

export default function PatientAvatar({ patient, size = 76 }: Props) {
  const src = useMemo(() => patientPhotoUrl(patient), [patient.mrn]);
  const [failedMrn, setFailedMrn] = useState<string | null>(null);
  const failed = failedMrn === patient.mrn;

  return (
    <Avatar
      key={patient.mrn}
      src={failed ? undefined : src}
      alt={`${patient.first_name} ${patient.last_name}, ${patient.age}yo ${exactGender(patient.gender)}`}
      slotProps={{
        img: {
          loading: 'eager',
          decoding: 'async',
          onError: () => setFailedMrn(patient.mrn),
        },
      }}
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
