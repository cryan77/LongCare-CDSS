import { Box } from '@mui/material';
import type { Patient } from '../../api/client';

type Props = {
  patient: Patient;
  size?: number;
};

const palette = [
  { bg: '#e8f1fb', skin: '#c98f65', hair: '#4b2e25', coat: '#ffffff', accent: '#2563a8' },
  { bg: '#eef7f1', skin: '#8d5b43', hair: '#1f2933', coat: '#ffffff', accent: '#1b7f4e' },
  { bg: '#f4f0fb', skin: '#e0a77c', hair: '#5b3a29', coat: '#ffffff', accent: '#6b5ca5' },
  { bg: '#fff6e5', skin: '#b77955', hair: '#2f241f', coat: '#ffffff', accent: '#c48812' },
  { bg: '#fdecea', skin: '#d49a72', hair: '#3a2a24', coat: '#ffffff', accent: '#c62828' },
];

function hash(value: string) {
  return value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function initials(patient: Patient) {
  return `${patient.first_name[0] || ''}${patient.last_name[0] || ''}`.toUpperCase();
}

export default function PatientAvatar({ patient, size = 76 }: Props) {
  const index = hash(`${patient.mrn}${patient.first_name}${patient.last_name}`) % palette.length;
  const colors = palette[index];
  const isFemale = patient.gender.toLowerCase().startsWith('f');
  const hairPath = isFemale
    ? 'M25 31c1-15 11-23 23-23s22 8 23 23c1 11-5 24-9 32H34c-5-8-10-21-9-32Z'
    : 'M27 30c2-13 10-20 21-20 11 0 19 7 21 20-8-5-29-8-42 0Z';

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flex: '0 0 auto',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '3px solid',
        borderColor: 'background.paper',
        boxShadow: '0 8px 22px rgba(15, 47, 84, 0.14)',
      }}
      aria-label={`${patient.first_name} ${patient.last_name} avatar`}
    >
      <svg viewBox="0 0 96 96" width="100%" height="100%" role="img">
        <rect width="96" height="96" fill={colors.bg} />
        <circle cx="78" cy="18" r="18" fill={colors.accent} opacity="0.12" />
        <circle cx="20" cy="78" r="22" fill={colors.accent} opacity="0.1" />
        <path d={hairPath} fill={colors.hair} />
        <circle cx="48" cy="39" r="20" fill={colors.skin} />
        <path d="M20 90c4-19 15-29 28-29s24 10 28 29H20Z" fill={colors.coat} />
        <path d="M35 66l13 16 13-16" fill="#d7e6f6" />
        <path d="M35 66l-7 24h40l-7-24-13 16-13-16Z" fill={colors.coat} />
        <path d="M43 65h10l-5 11-5-11Z" fill={colors.accent} />
        <circle cx="41" cy="39" r="2" fill="#1a1f27" />
        <circle cx="55" cy="39" r="2" fill="#1a1f27" />
        <path d="M41 49c4 3 10 3 14 0" stroke="#7a4b37" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="76" cy="74" r="13" fill={colors.accent} />
        <text
          x="76"
          y="79"
          textAnchor="middle"
          fontFamily="Segoe UI, Arial, sans-serif"
          fontSize="12"
          fontWeight="700"
          fill="#fff"
        >
          {initials(patient)}
        </text>
      </svg>
    </Box>
  );
}
