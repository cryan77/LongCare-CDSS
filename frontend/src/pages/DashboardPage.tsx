import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { patientsApi } from '../api/client';
import { useClinicalStore } from '../store';

const agentData = [
  { name: 'Diagnosis', status: 100 },
  { name: 'Treatment', status: 100 },
  { name: 'Knowledge', status: 100 },
  { name: 'Documentation', status: 100 },
];

export default function DashboardPage() {
  const { selectedPatient, lastDiagnosis } = useClinicalStore();
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.list,
  });

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Clinical Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        AI-assisted decision support with evidence retrieval and physician approval workflow.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Active Patients
              </Typography>
              <Typography variant="h3" color="primary.main">
                {isLoading ? '—' : patients?.length ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Selected Patient
              </Typography>
              <Typography variant="h6" color="primary.dark">
                {selectedPatient
                  ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                  : 'None'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Last Diagnosis Confidence
              </Typography>
              <Typography variant="h3" color="primary.main">
                {lastDiagnosis ? `${Math.round(lastDiagnosis.confidence * 100)}%` : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Workflow Status
              </Typography>
              <Chip label="Pending Review" color="warning" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Multi-Agent System Status
              </Typography>
              {agentData.map((agent) => (
                <Box key={agent.name} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{agent.name} Agent</Typography>
                    <Typography variant="body2" color="primary.main">
                      Online
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={agent.status} color="primary" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                RAG Evidence Sources
              </Typography>
              {['WHO', 'NICE', 'AHA', 'ADA', 'ESC', 'Health Canada'].map((src) => (
                <Chip key={src} label={src} size="small" sx={{ m: 0.5 }} variant="outlined" />
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clinical Activity Overview
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={patients?.map((p) => ({ name: p.first_name, age: p.age })) ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="age" fill="#2d6a4f" name="Age" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
