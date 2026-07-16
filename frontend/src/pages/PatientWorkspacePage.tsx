import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { timelineApi } from '../api/client';
import { useAuthStore, useClinicalStore } from '../store';
import PatientHeader from '../components/Patient/PatientHeader';

export default function PatientWorkspacePage() {
  const { user } = useAuthStore();
  const isNurse = user?.role === 'nurse';
  const { selectedPatient, setSelectedPatient } = useClinicalStore();
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const { data: timeline, isLoading } = useQuery({
    queryKey: ['timeline', selectedPatient?.id],
    queryFn: () => timelineApi.get(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  if (!selectedPatient) {
    return (
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={() => navigate('/app/patients')}>
            Patient List
          </Button>
        }
      >
        Select a patient from the Patient List to open the clinical workspace.
      </Alert>
    );
  }

  const history = (selectedPatient.medical_history || {}) as {
    conditions?: string[];
    medications?: string[];
    labs?: Record<string, number | string>;
    prior_encounters?: { date?: string; complaint?: string; provider?: string }[];
    social_history?: { smoking?: string; alcohol?: string; occupation?: string };
    family_history?: string[];
    nursing_notes?: { time?: string; note?: string }[];
  };

  const tabs = isNurse
    ? ['Overview', 'History', 'Labs', 'Vitals / Notes', 'Care Alerts', 'Meds']
    : ['Overview', 'History', 'Labs', 'Imaging', 'AI Analysis', 'Reports'];

  return (
    <Box>
      <PatientHeader patient={selectedPatient} />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'white', borderRadius: 2, px: 1 }}
      >
        {tabs.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Medical History
              </Typography>
              {(history.conditions || []).length ? (
                (history.conditions || []).map((c) => (
                  <Typography key={c} variant="body2" sx={{ mb: 1 }}>
                    • {c}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No chronic conditions recorded.
                </Typography>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Current Medication
              </Typography>
              {(history.medications || []).length ? (
                (history.medications || []).map((m) => (
                  <Typography key={m} variant="body2" sx={{ mb: 1 }}>
                    • {m}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No current medications listed.
                </Typography>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Allergies
              </Typography>
              {selectedPatient.allergies.length ? (
                selectedPatient.allergies.map((a) => (
                  <Chip key={a} label={a} color="error" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))
              ) : (
                <Chip label="NKDA" size="small" color="success" variant="outlined" />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Recent Visits
              </Typography>
              {(history.prior_encounters || []).length ? (
                (history.prior_encounters || []).map((v, i) => (
                  <Box key={i} sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 650 }}>
                      {v.date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {v.complaint}
                      {v.provider ? ` · ${v.provider}` : ''}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No prior visits listed.
                </Typography>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Social History
              </Typography>
              {history.social_history ? (
                <>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Smoking: {history.social_history.smoking || '—'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Alcohol: {history.social_history.alcohol || '—'}
                  </Typography>
                  <Typography variant="body2">
                    Occupation: {history.social_history.occupation || '—'}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not recorded.
                </Typography>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Family History
              </Typography>
              {(history.family_history || []).length ? (
                (history.family_history || []).map((f) => (
                  <Typography key={f} variant="body2" sx={{ mb: 0.5 }}>
                    • {f}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not recorded.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Clinical Timeline
            </Typography>
            {isLoading && <CircularProgress size={24} />}
            {(timeline?.events || []).map((ev: { id: string; type: string; title: string; detail: string; date: string }) => (
              <Box
                key={ev.id}
                sx={{
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Chip label={ev.type} size="small" color="primary" variant="outlined" />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(ev.date).toLocaleString()}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 650 }}>{ev.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {ev.detail}
                </Typography>
              </Box>
            ))}
            {!isLoading && !(timeline?.events || []).length && (
              <Typography color="text.secondary">No timeline events yet. Run CDSS to create encounters.</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Laboratory Results
            </Typography>
            {Object.entries(history.labs || {}).length ? (
              Object.entries(history.labs || {}).map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography>{k}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{String(v)}</Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No lab values on chart. Enter labs in Diagnosis workspace.</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Card>
          <CardContent>
            {isNurse ? (
              <>
                <Typography variant="h4" gutterBottom>
                  Vitals & Nursing Notes
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  BP {String(selectedPatient.vitals?.bp ?? '—')} · HR {String(selectedPatient.vitals?.hr ?? '—')} ·
                  Temp {String(selectedPatient.vitals?.temp ?? '—')}°C · SpO₂ {String(selectedPatient.vitals?.spo2 ?? '—')}%
                </Typography>
                {(history.nursing_notes || []).length ? (
                  (history.nursing_notes || []).map((n, i) => (
                    <Box key={i} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        {n.time ? new Date(n.time).toLocaleString() : ''}
                      </Typography>
                      <Typography variant="body2">{n.note}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    No nursing notes yet.
                  </Typography>
                )}
                <Button variant="contained" onClick={() => navigate('/app/nurse/vitals')}>
                  Record Vitals
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  Imaging
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Upload and analyze chest imaging for this patient.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/app/imaging')}>
                  Open X-Ray Analysis
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 4 && (
        <Card>
          <CardContent>
            {isNurse ? (
              <>
                <Typography variant="h4" gutterBottom>
                  Care Alerts
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Limited AI support only — notify physician for clinical decisions. Nurses cannot approve diagnoses
                  or prescribe.
                </Alert>
                <Button variant="contained" onClick={() => navigate('/app/chat')}>
                  Open Care Assistant
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  AI Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Run diagnosis and treatment agents with physician approval gates.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={() => navigate('/app/workflow')}>
                    Run Full CDSS
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/app/diagnosis')}>
                    Diagnosis Workspace
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/app/treatment')}>
                    Treatment
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 5 && (
        <Card>
          <CardContent>
            {isNurse ? (
              <>
                <Typography variant="h4" gutterBottom>
                  Medications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Administration schedule — prescribing remains physician-only.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/app/nurse/medications')}>
                  Open Medication Schedule
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h4" gutterBottom>
                  Reports
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Generate SOAP notes and discharge summaries for review and PDF export.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/app/documentation')}>
                  Open Documentation
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Button sx={{ mt: 3 }} variant="text" onClick={() => setSelectedPatient(null)}>
        Clear active patient
      </Button>
    </Box>
  );
}
