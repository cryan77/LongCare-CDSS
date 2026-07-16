import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminApi } from '../../api/client';

export default function AdminMonitoringPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-monitoring'],
    queryFn: adminApi.monitoring,
  });

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        System Monitoring
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Latency, GPU, RAG success, and cost signals for platform operations.
      </Typography>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {data?.system_health === 'healthy' && (
        <Alert severity="success" sx={{ mb: 2 }}>
          System health: Healthy
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Requests/sec', value: data?.requests_per_sec },
          { label: 'Avg latency', value: data ? `${data.avg_latency_ms} ms` : '—' },
          { label: 'GPU utilization', value: data ? `${data.gpu_utilization_pct}%` : '—' },
          { label: 'RAG success', value: data ? `${data.rag_retrieval_success_pct}%` : '—' },
          { label: 'Hallucination rate', value: data ? `${data.hallucination_rate_pct}%` : '—' },
          { label: 'Token usage today', value: data?.token_usage_today },
          { label: 'API cost today', value: data ? `$${data.api_cost_usd_today}` : '—' },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" color="text.secondary">
                  {s.label}
                </Typography>
                <Typography variant="h3" color="primary.dark" sx={{ mt: 1 }}>
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
            Most searched diseases
          </Typography>
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_diseases || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1a4f8c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
