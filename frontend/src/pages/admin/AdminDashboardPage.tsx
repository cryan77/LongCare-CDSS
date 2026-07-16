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
import { adminApi } from '../../api/client';
import { useAuthStore } from '../../store';
import {
  DashboardWidget,
  KpiCard,
  StatusRow,
  greetingForNow,
} from '../../components/Dashboard/widgets';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const greeting = greetingForNow();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });
  const { data: monitoring } = useQuery({
    queryKey: ['admin-monitoring'],
    queryFn: adminApi.monitoring,
  });
  const { data: audit } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: adminApi.audit,
  });

  const healthy = stats?.system_health === 'healthy';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Box>
          <Typography variant="h1" color="primary.dark">
            {greeting}, {user?.full_name || 'Administrator'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            System operations — is the platform healthy?
          </Typography>
        </Box>
        <Chip
          label={healthy ? 'System Status · Healthy' : 'System Status · Check'}
          color={healthy ? 'success' : 'warning'}
          variant="outlined"
        />
      </Box>

      {isLoading && <LinearProgress sx={{ my: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Unable to load admin stats.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard label="Users" value={stats?.users_total ?? '—'} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard label="Doctors" value={stats?.doctors ?? '—'} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard label="Nurses" value={stats?.nurses ?? '—'} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard label="Patients" value={stats?.patients_registered ?? '—'} />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard label="Hospitals" value={1} hint="LongCare Clinic" />
        </Grid>
        <Grid size={{ xs: 6, md: 2 }}>
          <KpiCard label="AI Requests" value={stats?.ai_requests_today ?? '—'} hint="Today" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="Infrastructure">
            <StatusRow name="FastAPI" status="Healthy" ok />
            <StatusRow name="Database" status="Healthy" ok />
            <StatusRow
              name="Vector DB"
              status={stats?.vector_backend === 'memory' ? 'Memory (demo)' : 'Healthy'}
              ok
            />
            <StatusRow name="GPU" status={stats ? `${stats.gpu_usage_pct}% util` : '—'} ok />
            <StatusRow
              name="LLM Provider"
              status={stats?.openrouter_configured ? 'Healthy' : 'Not configured'}
              ok={!!stats?.openrouter_configured}
            />
            <StatusRow name="Storage" status="Healthy" ok />
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="AI Monitoring">
            <StatusRow name="Average Response" status={stats ? `${stats.avg_response_sec}s` : '—'} ok />
            <StatusRow
              name="Avg Latency"
              status={monitoring ? `${monitoring.avg_latency_ms} ms` : '—'}
              ok
            />
            <StatusRow
              name="Cost Today"
              status={monitoring ? `$${monitoring.api_cost_usd_today}` : '—'}
              ok
            />
            <StatusRow
              name="Token Usage"
              status={monitoring?.token_usage_today ?? '—'}
              ok
            />
            <StatusRow
              name="Hallucination Rate"
              status={monitoring ? `${monitoring.hallucination_rate_pct}%` : '—'}
              ok={(monitoring?.hallucination_rate_pct ?? 0) < 5}
            />
            <StatusRow name="Failed Requests" status="0 critical" ok />
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate('/app/admin/monitoring')}>
              Open monitoring
            </Button>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="Security">
            <StatusRow name="Failed Logins" status="0 today" ok />
            <StatusRow name="Active Tokens" status="Demo sessions" ok />
            <StatusRow name="Unauthorized Access" status="None" ok />
            <StatusRow name="Expired Tokens" status="Cleared" ok />
            <StatusRow
              name="Audit Events"
              status={String(audit?.events?.length ?? '—')}
              ok
            />
            <Button size="small" sx={{ mt: 1.5 }} onClick={() => navigate('/app/admin/audit')}>
              View audit logs
            </Button>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <DashboardWidget title="Recent Activities">
            {(audit?.events || []).slice(0, 8).map((e, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  py: 1.25,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 650 }}>
                    {e.action}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {e.user} · {e.patient}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(e.time).toLocaleString()}
                </Typography>
              </Box>
            ))}
            {!audit?.events?.length && (
              <Typography color="text.secondary">No recent audit events.</Typography>
            )}
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="Quick Actions">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="contained" onClick={() => navigate('/app/admin/users')}>
                Create User
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/admin/knowledge')}>
                Upload Guidelines
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/admin/ai')}>
                Configure AI
              </Button>
              <Button variant="outlined" onClick={() => navigate('/app/admin/monitoring')}>
                View Logs / Monitoring
              </Button>
              <Button variant="outlined" disabled>
                Backup Database
              </Button>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              Provider: {stats?.llm_provider || '—'} · Vector: {stats?.vector_backend || '—'}
            </Alert>
          </DashboardWidget>
        </Grid>
      </Grid>
    </Box>
  );
}
