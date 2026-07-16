import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { patientsApi } from '../api/client';
import { useClinicalStore } from '../store';

export default function PatientsPage() {
  const { selectedPatient, setSelectedPatient } = useClinicalStore();
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.list,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Patient Registry
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Select a patient to begin AI-assisted clinical reasoning.
      </Typography>

      <Grid container spacing={3}>
        {patients?.map((patient) => (
          <Grid key={patient.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              sx={{
                border: selectedPatient?.id === patient.id ? '2px solid' : undefined,
                borderColor: selectedPatient?.id === patient.id ? 'primary.main' : undefined,
              }}
            >
              <CardContent>
                <Typography variant="h6" color="primary.dark">
                  {patient.first_name} {patient.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  MRN: {patient.mrn} · {patient.age}yo {patient.gender}
                </Typography>
                <Box sx={{ my: 1.5 }}>
                  {patient.allergies.length > 0 ? (
                    patient.allergies.map((a) => (
                      <Chip key={a} label={`Allergy: ${a}`} color="error" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))
                  ) : (
                    <Chip label="No known allergies" size="small" variant="outlined" />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  BP: {String(patient.vitals?.bp ?? '—')} · Temp: {String(patient.vitals?.temp ?? '—')}°C
                </Typography>
                <Button
                  variant={selectedPatient?.id === patient.id ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setSelectedPatient(patient)}
                >
                  {selectedPatient?.id === patient.id ? 'Selected' : 'Select Patient'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
