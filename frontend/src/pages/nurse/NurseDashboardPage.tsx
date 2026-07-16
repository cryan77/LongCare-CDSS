import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api/client';
import { useClinicalStore } from '../../store';
import PatientAvatar from '../../components/Patient/PatientAvatar';

export default function NurseDashboardPage() {
  const navigate = useNavigate();
  const { setSelectedPatient } = useClinicalStore();
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.list,
  });

  const vitalsPending = patients.filter((p) => Number(p.vitals?.spo2 ?? 100) < 95 || Number(p.vitals?.temp ?? 0) >= 38).length;
  const medDue = Math.min(5, Math.ceil(patients.length / 10));
  const alerts = patients.filter((p) => Number(p.vitals?.spo2 ?? 100) < 93).slice(0, 5);

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Nurse Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Patient care and data collection — nurses do not diagnose or prescribe.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Patients Assigned', value: patients.length },
          { label: 'Medication Due', value: medDue },
          { label: 'Vitals Pending', value: vitalsPending },
          { label: 'AI Care Alerts', value: alerts.length },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" color="text.secondary">
                  {s.label}
                </Typography>
                <Typography variant="h2" color="primary.dark" sx={{ mt: 1 }}>
                  {isLoading ? '—' : s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>AI Care Alert</Typography>
          {alerts[0].first_name} {alerts[0].last_name}: oxygen saturation is {String(alerts[0].vitals?.spo2)}%.
          Notify physician and monitor every 30 minutes.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Care Queue
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {patients.slice(0, 8).map((p) => {
              const spo2 = Number(p.vitals?.spo2 ?? 99);
              const priority = spo2 < 93 ? 'High' : spo2 < 95 ? 'Monitor' : 'Routine';
              return (
                <Box
                  key={p.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <PatientAvatar patient={p} size={48} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 650 }}>
                      {p.first_name} {p.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      BP {String(p.vitals?.bp ?? '—')} · SpO₂ {String(p.vitals?.spo2 ?? '—')}% · Temp{' '}
                      {String(p.vitals?.temp ?? '—')}°C
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={priority}
                    color={priority === 'High' ? 'error' : priority === 'Monitor' ? 'warning' : 'success'}
                    variant="outlined"
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedPatient(p);
                      navigate('/app/nurse/vitals');
                    }}
                  >
                    Record Vitals
                  </Button>
                </Box>
              );
            })}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => navigate('/app/patients')}>
              Patient List
            </Button>
            <Button variant="outlined" onClick={() => navigate('/app/nurse/tasks')}>
              Tasks
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
