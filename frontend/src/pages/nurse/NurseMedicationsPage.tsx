import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { patientsApi } from '../../api/client';
import { useClinicalStore } from '../../store';
import PatientHeader from '../../components/Patient/PatientHeader';

export default function NurseMedicationsPage() {
  const { selectedPatient } = useClinicalStore();
  const { data: patients = [] } = useQuery({ queryKey: ['patients'], queryFn: patientsApi.list });
  const patient = selectedPatient || patients[0];
  const meds = ((patient?.medical_history?.medications as string[]) || ['Metformin 500mg', 'Lisinopril 10mg']).slice(0, 4);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const schedule = [
    { time: '08:00', med: meds[0] || 'Morning medication' },
    { time: '12:00', med: meds[1] || 'Midday medication' },
    { time: '18:00', med: meds[2] || 'Evening medication' },
    { time: '21:00', med: meds[3] || 'Night medication' },
  ];

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Medication Schedule
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Administration checklist — prescribing remains physician-only.
      </Typography>

      {!patient && <Alert severity="warning">No patient selected.</Alert>}
      {patient && <PatientHeader patient={patient} />}

      {patient && (
        <Card sx={{ maxWidth: 640 }}>
          <CardContent>
            {schedule.map((s) => (
              <Box
                key={s.time}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {s.time}
                  </Typography>
                  <Typography sx={{ fontWeight: 650 }}>{s.med}</Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!done[s.time]}
                      onChange={(e) => setDone({ ...done, [s.time]: e.target.checked })}
                    />
                  }
                  label={done[s.time] ? <Chip size="small" color="success" label="Completed" /> : 'Pending'}
                />
              </Box>
            ))}
            <Alert severity="info" sx={{ mt: 2 }}>
              Mark doses as given. Dose changes require physician order.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
