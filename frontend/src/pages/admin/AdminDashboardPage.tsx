import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/client';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  const stats = [
    { label: 'Users', value: data?.users_total },
    { label: 'Doctors', value: data?.doctors },
    { label: 'Nurses', value: data?.nurses },
    { label: 'Patients (registry)', value: data?.patients_registered },
    { label: "Today's AI Requests", value: data?.ai_requests_today },
    { label: 'Avg Response', value: data ? `${data.avg_response_sec}s` : '—' },
    { label: 'System Health', value: data?.system_health === 'healthy' ? '✓ Healthy' : '—' },
    { label: 'GPU Usage', value: data ? `${data.gpu_usage_pct}%` : '—' },
  ];

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        System management — administrators do not access clinical AI diagnoses.
      </Typography>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Unable to load admin stats.</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" color="text.secondary">
                  {s.label}
                </Typography>
                <Typography variant="h2" color="primary.dark" sx={{ mt: 1, fontSize: '1.6rem' }}>
                  {s.value ?? '—'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => navigate('/app/admin/users')}>
              Create / Manage Users
            </Button>
            <Button variant="outlined" onClick={() => navigate('/app/admin/ai')}>
              Configure AI
            </Button>
            <Button variant="outlined" onClick={() => navigate('/app/admin/audit')}>
              View Audit Logs
            </Button>
            <Button variant="outlined" onClick={() => navigate('/app/admin/knowledge')}>
              Import Guidelines
            </Button>
            <Button variant="outlined" onClick={() => navigate('/app/admin/monitoring')}>
              Monitoring
            </Button>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            Provider: {data?.llm_provider || '—'} · Vector: {data?.vector_backend || '—'} · OpenRouter:{' '}
            {data?.openrouter_configured ? 'configured' : 'not configured'}
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
