import { Box, Chip, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Patient } from '../../api/client';

type Props = {
  patient: Patient;
};

export default function PatientHeader({ patient }: Props) {
  return (
    <Box
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 2,
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box>
        <Typography variant="h3" color="primary.dark">
          {patient.first_name} {patient.last_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {patient.age} years · {patient.gender} · MRN {patient.mrn}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {patient.allergies.length > 0 ? (
          patient.allergies.map((a) => (
            <Chip
              key={a}
              icon={<WarningAmberIcon />}
              label={`Allergy: ${a}`}
              color="error"
              size="small"
            />
          ))
        ) : (
          <Chip label="No known allergies" size="small" color="success" variant="outlined" />
        )}
        <Chip
          label={`BP ${String(patient.vitals?.bp ?? '—')}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Temp ${String(patient.vitals?.temp ?? '—')}°C`}
          size="small"
          variant="outlined"
        />
      </Box>
    </Box>
  );
}
