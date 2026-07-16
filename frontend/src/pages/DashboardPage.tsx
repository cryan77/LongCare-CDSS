import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../api/client';
import { useAuthStore, useClinicalStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { setSelectedPatient, lastDiagnosis } = useClinicalStore();
  const navigate = useNavigate();
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.list,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const pendingReviews = lastDiagnosis ? 1 : 0;
  const aiAlerts = patients.filter((p) => p.allergies.length > 0).length;

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        {greeting}, {user?.full_name?.replace(/^Dr\.\s*/, 'Dr. ') || 'Doctor'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Clinical overview — AI suggestions require your review before action.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Today's Patients", value: patients.length, color: 'primary.main' },
          { label: 'AI Alerts', value: aiAlerts, color: 'warning.main' },
          { label: 'Pending Reviews', value: pendingReviews, color: 'error.main' },
        ].map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h2" sx={{ color: stat.color, mt: 1 }}>
                  {isLoading ? '—' : stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Recent Patients
              </Typography>
              {isLoading && <LinearProgress sx={{ mb: 2 }} />}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {patients.slice(0, 5).map((p) => {
                  const history = p.medical_history as { conditions?: string[]; prior_encounters?: { complaint?: string }[] };
                  const complaint =
                    history?.prior_encounters?.[0]?.complaint ||
                    history?.conditions?.[0] ||
                    'Follow-up';
                  const risk = p.allergies.length ? 'High' : 'Routine';
                  return (
                    <Box
                      key={p.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.75,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>
                          {p.first_name} {p.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {p.age} {p.gender?.[0]?.toUpperCase()} · {complaint}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          size="small"
                          label={`AI Risk: ${risk}`}
                          color={risk === 'High' ? 'warning' : 'success'}
                          variant="outlined"
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setSelectedPatient(p);
                            navigate('/app/workspace');
                          }}
                        >
                          Open
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                System Status
              </Typography>
              {[
                { name: 'AI Model', status: 'Online', ok: true },
                { name: 'RAG', status: 'Online', ok: true },
                { name: 'FHIR', status: 'Demo mode', ok: false },
              ].map((s) => (
                <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <Typography variant="body2">{s.name}</Typography>
                  <Chip
                    size="small"
                    label={s.status}
                    color={s.ok ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Patient Age Mix
              </Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={patients.map((p) => ({ name: p.first_name, age: p.age }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="age" fill="#1a4f8c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {pendingReviews > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/app/diagnosis')}>
            Review
          </Button>
        }>
          You have AI assessments awaiting physician approval.
        </Alert>
      )}
    </Box>
  );
}
