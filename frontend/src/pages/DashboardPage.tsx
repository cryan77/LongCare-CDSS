import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../api/client';
import { patientsApi } from '../api/client';
import { useAuthStore, useClinicalStore } from '../store';
import PatientAvatar from '../components/Patient/PatientAvatar';
import { DashboardWidget, KpiCard, greetingForNow } from '../components/Dashboard/widgets';

function priorityFor(p: Patient): 'HIGH' | 'MEDIUM' | 'ROUTINE' {
  const spo2 = Number(p.vitals?.spo2 ?? 99);
  const temp = Number(p.vitals?.temp ?? 36.5);
  if (spo2 < 93 || temp >= 38.5 || p.allergies.length > 1) return 'HIGH';
  if (spo2 < 95 || temp >= 38 || p.allergies.length > 0 || p.age >= 75) return 'MEDIUM';
  return 'ROUTINE';
}

function complaintFor(p: Patient) {
  const history = p.medical_history as { conditions?: string[]; prior_encounters?: { complaint?: string }[] };
  return history?.prior_encounters?.[0]?.complaint || history?.conditions?.[0] || 'Follow-up';
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { setSelectedPatient, lastDiagnosis, lastTreatment, lastDocumentId } = useClinicalStore();
  const navigate = useNavigate();
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.list,
  });

  const greeting = greetingForNow();
  const queue = useMemo(() => {
    return [...patients]
      .map((p) => ({ p, priority: priorityFor(p), complaint: complaintFor(p) }))
      .sort((a, b) => {
        const rank = { HIGH: 0, MEDIUM: 1, ROUTINE: 2 };
        return rank[a.priority] - rank[b.priority];
      });
  }, [patients]);

  const critical = queue.filter((q) => q.priority === 'HIGH');
  const pendingItems = [
    lastDiagnosis ? { label: 'Diagnosis waiting approval', path: '/app/diagnosis' } : null,
    lastTreatment ? { label: 'Treatment requires review', path: '/app/treatment' } : null,
    lastDocumentId ? { label: 'SOAP note draft', path: '/app/documentation' } : null,
  ].filter(Boolean) as { label: string; path: string }[];

  const schedule = queue.slice(0, 5).map((q, i) => ({
    time: `${9 + i}:00`,
    patient: q.p,
    complaint: q.complaint,
  }));

  const aiAlerts = [
    ...critical.slice(0, 3).map((q) => ({
      title: q.complaint,
      detail: `${q.p.first_name} ${q.p.last_name} · SpO₂ ${String(q.p.vitals?.spo2 ?? '—')}%`,
      severity: 'error' as const,
    })),
    ...patients
      .filter((p) => p.allergies.length)
      .slice(0, 2)
      .map((p) => ({
        title: 'Drug / allergy risk',
        detail: `${p.first_name} ${p.last_name}: ${p.allergies.join(', ')}`,
        severity: 'warning' as const,
      })),
  ].slice(0, 5);

  const openPatient = (p: Patient) => {
    setSelectedPatient(p);
    navigate('/app/workspace');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Box>
          <Typography variant="h1" color="primary.dark">
            {greeting}, {user?.full_name?.startsWith('Dr') ? user.full_name : `Dr. ${user?.full_name || 'Doctor'}`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Clinical command center — patients who need your attention first.
          </Typography>
        </Box>
        <Chip label="Doctor Portal" color="primary" variant="outlined" />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Patient Queue" value={isLoading ? '—' : patients.length} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Critical Alerts" value={isLoading ? '—' : critical.length} color="error.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Pending Reviews" value={pendingItems.length || (lastDiagnosis ? 1 : 0)} color="warning.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Today's Appointments" value={schedule.length} />
        </Grid>
      </Grid>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DashboardWidget
            title="Patient Queue"
            action={
              <Button size="small" onClick={() => navigate('/app/patients')}>
                All patients
              </Button>
            }
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {queue.slice(0, 8).map(({ p, priority, complaint }) => (
                <Box
                  key={p.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: priority === 'HIGH' ? 'error.light' : 'divider',
                    bgcolor: priority === 'HIGH' ? 'error.light' : 'background.default',
                  }}
                >
                  <PatientAvatar patient={p} size={48} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {p.first_name} {p.last_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {complaint} · {p.age}yo · MRN {p.mrn}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={priority === 'ROUTINE' ? 'ROUTINE' : `${priority} PRIORITY`}
                    color={priority === 'HIGH' ? 'error' : priority === 'MEDIUM' ? 'warning' : 'success'}
                    variant="outlined"
                  />
                  <Button size="small" variant="contained" onClick={() => openPatient(p)}>
                    Open
                  </Button>
                </Box>
              ))}
            </Box>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="AI Alerts">
            {aiAlerts.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {aiAlerts.map((a, i) => (
                  <Alert key={i} severity={a.severity} sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {a.title}
                    </Typography>
                    <Typography variant="caption">{a.detail}</Typography>
                  </Alert>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No critical AI alerts.</Typography>
            )}
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="Pending AI Reviews">
            {pendingItems.length ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {pendingItems.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1,
                      alignItems: 'center',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2">{item.label}</Typography>
                    <Button size="small" onClick={() => navigate(item.path)}>
                      Review
                    </Button>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                No drafts waiting. Run CDSS to create reviewable artifacts.
              </Typography>
            )}
            <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => navigate('/app/workflow')}>
              Run CDSS Workflow
            </Button>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="Today's Schedule">
            {schedule.map((s) => (
              <Box
                key={s.patient.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                }}
                onClick={() => openPatient(s.patient)}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {s.time}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 650 }}>
                    {s.patient.first_name} {s.patient.last_name}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {s.complaint}
                </Typography>
              </Box>
            ))}
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="Clinical Knowledge Updates">
            {[
              'New NICE pneumonia guideline summary available',
              'Hospital protocol: sepsis bundle updated',
              'Drug warning: fluoroquinolone tendon risk reminder',
            ].map((n) => (
              <Typography key={n} variant="body2" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                {n}
              </Typography>
            ))}
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate('/app/knowledge')}>
              Search guidelines
            </Button>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <DashboardWidget title="Quick Actions">
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={() => navigate('/app/diagnosis')}>
                New Diagnosis
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/patients')}>
                Search Patient
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/imaging')}>
                Upload Image
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/chat')}>
                Medical Chat
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/knowledge')}>
                Knowledge Search
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/documentation')}>
                Reports
              </Button>
            </Box>
          </DashboardWidget>
        </Grid>
      </Grid>
    </Box>
  );
}
