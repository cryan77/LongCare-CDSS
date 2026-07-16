import { useMemo, useState } from 'react';
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
  Stack,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import { useNavigate } from 'react-router-dom';
import { patientsApi } from '../api/client';
import { useClinicalStore } from '../store';
import PatientAvatar from '../components/Patient/PatientAvatar';

function getAcuity(patient: { age: number; allergies: string[]; vitals: Record<string, unknown> }) {
  const temp = Number(patient.vitals?.temp ?? 0);
  const spo2 = Number(patient.vitals?.spo2 ?? 100);
  if (spo2 < 93 || temp >= 38.3 || patient.allergies.length > 1) {
    return { label: 'Review', color: 'warning' as const };
  }
  if (patient.age >= 75 || patient.allergies.length > 0) {
    return { label: 'Monitor', color: 'info' as const };
  }
  return { label: 'Stable', color: 'success' as const };
}

export default function PatientsPage() {
  const { selectedPatient, setSelectedPatient } = useClinicalStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.list,
  });

  const filtered = useMemo(() => {
    const list = patients || [];
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p) => {
      const conditions = ((p.medical_history?.conditions as string[]) || []).join(' ');
      const hay = `${p.first_name} ${p.last_name} ${p.mrn} ${conditions} ${p.allergies.join(' ')}`.toLowerCase();
      return hay.includes(term);
    });
  }, [patients, q]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Patient Registry
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {patients?.length || 0} patients — select one, then open the clinical workspace.
      </Typography>

      <TextField
        size="small"
        placeholder="Search name, MRN, condition, allergy…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ mb: 3, maxWidth: 420, width: '100%' }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Grid container spacing={2}>
        {filtered.map((patient) => {
          const conditions = (patient.medical_history?.conditions as string[]) || [];
          const meds = (patient.medical_history?.medications as string[]) || [];
          const acuity = getAcuity(patient);
          return (
            <Grid key={patient.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  border: selectedPatient?.id === patient.id ? '2px solid' : undefined,
                  borderColor: selectedPatient?.id === patient.id ? 'primary.main' : undefined,
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 28px rgba(15, 47, 84, 0.12)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 5,
                    bgcolor: selectedPatient?.id === patient.id ? 'primary.main' : 'divider',
                  },
                }}
              >
                <CardContent sx={{ p: 2.25 }}>
                  <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start', mb: 1.75 }}>
                    <PatientAvatar patient={patient} />
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h4" color="primary.dark" noWrap>
                            {patient.first_name} {patient.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {patient.age}yo {patient.gender} · {patient.mrn}
                          </Typography>
                        </Box>
                        <Chip label={acuity.label} color={acuity.color} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                        Last chart update: active demo record
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1,
                      p: 1.25,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 1.5,
                    }}
                  >
                    {[
                      { icon: <FavoriteBorderIcon fontSize="small" />, label: 'BP', value: String(patient.vitals?.bp ?? '—') },
                      { icon: <ThermostatIcon fontSize="small" />, label: 'Temp', value: `${String(patient.vitals?.temp ?? '—')}°C` },
                      { icon: <AirIcon fontSize="small" />, label: 'SpO₂', value: `${String(patient.vitals?.spo2 ?? '—')}%` },
                    ].map((item) => (
                      <Box key={item.label}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          {item.icon}
                          <Typography variant="caption">{item.label}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {conditions.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {conditions.slice(0, 3).map((c) => (
                        <Chip key={c} label={c} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                      {conditions.length > 3 && (
                        <Chip label={`+${conditions.length - 3}`} size="small" sx={{ mb: 0.5 }} />
                      )}
                    </Box>
                  )}

                  <Box sx={{ mb: 1.25 }}>
                    {patient.allergies.length > 0 ? (
                      patient.allergies.map((a) => (
                        <Chip key={a} label={`Allergy: ${a}`} color="error" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))
                    ) : (
                      <Chip label="NKDA" size="small" variant="outlined" color="success" sx={{ mb: 0.5 }} />
                    )}
                  </Box>

                  {meds.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Meds: {meds.slice(0, 2).join(', ')}
                      {meds.length > 2 ? ` +${meds.length - 2}` : ''}
                    </Typography>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <Button
                      variant={selectedPatient?.id === patient.id ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      {selectedPatient?.id === patient.id ? 'Selected' : 'Select'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedPatient(patient);
                        navigate('/app/workspace');
                      }}
                    >
                      Open Workspace
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
