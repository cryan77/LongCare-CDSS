import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../../api/client';
import { useAuthStore, useClinicalStore } from '../../store';
import PatientAvatar from '../../components/Patient/PatientAvatar';
import { DashboardWidget, KpiCard, greetingForNow } from '../../components/Dashboard/widgets';
import { useState } from 'react';

export default function NurseDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setSelectedPatient } = useClinicalStore();
  const greeting = greetingForNow();
  const [medDone, setMedDone] = useState<Record<string, boolean>>({ '09:00': true });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.list,
  });

  const assigned = patients.slice(0, 12);
  const vitalsDue = assigned.filter(
    (p) => Number(p.vitals?.spo2 ?? 100) < 95 || Number(p.vitals?.temp ?? 0) >= 38 || !p.vitals?.recorded_at,
  );
  const careAlerts = assigned.filter((p) => Number(p.vitals?.spo2 ?? 100) < 93 || Number(p.vitals?.temp ?? 0) >= 38.3);
  const medDueCount = Math.min(5, Math.max(2, Math.ceil(assigned.length / 4)));

  const medSchedule = useMemo(() => {
    const sample = assigned.slice(0, 4);
    return [
      { time: '08:00', med: 'Metformin', patient: sample[0], pending: true },
      { time: '09:00', med: 'Insulin', patient: sample[1], pending: false },
      { time: '10:00', med: 'Antibiotics', patient: sample[2], pending: true },
      { time: '12:00', med: 'Lisinopril', patient: sample[3], pending: true },
    ].filter((m) => m.patient);
  }, [assigned]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Box>
          <Typography variant="h1" color="primary.dark">
            {greeting}, {user?.full_name || 'Nurse'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Care delivery — what tasks are due now?
          </Typography>
        </Box>
        <Chip label="Nurse Portal" color="info" variant="outlined" />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Assigned Patients" value={isLoading ? '—' : assigned.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Medication Due" value={medDueCount} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Vitals Due" value={isLoading ? '—' : vitalsDue.length} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="AI Care Alerts" value={careAlerts.length} color="error.main" />
        </Grid>
      </Grid>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DashboardWidget
            title="My Patients"
            action={
              <Button size="small" onClick={() => navigate('/app/patients')}>
                Patient list
              </Button>
            }
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {assigned.slice(0, 8).map((p, idx) => {
                const spo2 = Number(p.vitals?.spo2 ?? 99);
                const task =
                  spo2 < 93 ? 'AI Care Alert' : spo2 < 95 || Number(p.vitals?.temp ?? 0) >= 38 ? 'Vitals Due' : idx % 2 === 0 ? 'Medication Due' : 'Stable';
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
                    <Chip size="small" label={`Room ${300 + (p.id % 20)}`} variant="outlined" />
                    <PatientAvatar patient={p} size={44} />
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
                      label={task}
                      color={
                        task === 'AI Care Alert' ? 'error' : task === 'Stable' ? 'success' : 'warning'
                      }
                      variant="outlined"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedPatient(p);
                        navigate(task.includes('Medication') ? '/app/nurse/medications' : '/app/nurse/vitals');
                      }}
                    >
                      Open
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="AI Care Alerts">
            {careAlerts.length ? (
              careAlerts.slice(0, 5).map((p) => (
                <Alert key={p.id} severity="warning" sx={{ mb: 1, py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {p.first_name} {p.last_name}
                  </Typography>
                  <Typography variant="caption">
                    {Number(p.vitals?.spo2 ?? 100) < 93
                      ? `Oxygen decreasing (SpO₂ ${p.vitals?.spo2}%). Notify physician.`
                      : `Temperature increasing (${p.vitals?.temp}°C). Recheck vitals.`}
                  </Typography>
                </Alert>
              ))
            ) : (
              <Typography color="text.secondary">No care alerts right now.</Typography>
            )}
            <Button size="small" sx={{ mt: 1 }} onClick={() => navigate('/app/chat')}>
              Care assistant
            </Button>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget
            title="Medication Schedule"
            action={
              <Button size="small" onClick={() => navigate('/app/nurse/medications')}>
                Full schedule
              </Button>
            }
          >
            {medSchedule.map((m) => (
              <Box
                key={m.time}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {m.time} · {m.patient!.first_name} {m.patient!.last_name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650 }}>
                    {m.med}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={medDone[m.time] ?? !m.pending}
                      onChange={(e) => setMedDone({ ...medDone, [m.time]: e.target.checked })}
                    />
                  }
                  label={
                    <Chip
                      size="small"
                      label={(medDone[m.time] ?? !m.pending) ? 'Completed' : 'Pending'}
                      color={(medDone[m.time] ?? !m.pending) ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  }
                />
              </Box>
            ))}
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget title="Vitals Monitoring">
            {[
              { label: 'Blood Pressure', due: vitalsDue.length },
              { label: 'Temperature', due: assigned.filter((p) => Number(p.vitals?.temp ?? 0) >= 38).length },
              { label: 'Heart Rate', due: Math.ceil(vitalsDue.length / 2) },
              { label: 'Oxygen Saturation', due: careAlerts.length },
            ].map((v) => (
              <Box
                key={v.label}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2">{v.label}</Typography>
                <Chip
                  size="small"
                  label={v.due ? `${v.due} Pending` : 'Completed'}
                  color={v.due ? 'warning' : 'success'}
                  variant="outlined"
                />
              </Box>
            ))}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/app/nurse/vitals')}
            >
              Record Vitals
            </Button>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget title="Messages">
            {[
              'Dr. Chen: Please recheck SpO₂ on Room 304 in 30 min.',
              'Pharmacy: Insulin delivery confirmed for 12:00 round.',
              'Charge nurse: Fall-risk rounding reminder for bay B.',
            ].map((m) => (
              <Typography key={m} variant="body2" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                {m}
              </Typography>
            ))}
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget title="Quick Actions">
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={() => navigate('/app/nurse/vitals')}>
                Record Vitals
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/nurse/medications')}>
                Medication Administration
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  if (assigned[0]) setSelectedPatient(assigned[0]);
                  navigate('/app/workspace');
                }}
              >
                Add Nursing Note
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/chat')}>
                Request Doctor Review
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/nurse/tasks')}>
                Tasks
              </Button>
            </Box>
          </DashboardWidget>
        </Grid>
      </Grid>
    </Box>
  );
}
