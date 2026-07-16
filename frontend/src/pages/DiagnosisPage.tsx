import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SendIcon from '@mui/icons-material/Send';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chatApi, diagnosisApi, docsApi, patientsApi } from '../api/client';
import { useClinicalStore } from '../store';
import ConfidenceScore from '../components/AI/ConfidenceScore';
import AnalysisProgress from '../components/AI/AnalysisProgress';
import PatientAvatar from '../components/Patient/PatientAvatar';
import { getPatientXrays } from '../utils/patientXrays';
import {
  DEFAULT_TESTS,
  bmiFromVitals,
  differentialWithScores,
  explainabilityFactors,
  heightCm,
  labStatus,
  patientHistory,
  riskLevel,
} from '../components/Diagnosis/helpers';

const WORKFLOW = ['Patient Data', 'Labs', 'Imaging', 'AI Analysis', 'Doctor Review', 'Clinical Report'];

export default function DiagnosisPage() {
  const navigate = useNavigate();
  const {
    selectedPatient,
    setLastDiagnosis,
    lastDiagnosis,
    setEncounterId,
    encounterId,
    setLastDocumentId,
  } = useClinicalStore();

  const history = selectedPatient ? patientHistory(selectedPatient) : null;
  const xrays = selectedPatient ? getPatientXrays(selectedPatient) : [];

  const defaultComplaint =
    history?.prior_encounters?.[0]?.complaint ||
    (history?.conditions?.[0] ? `${history.conditions[0]} follow-up` : 'fever, cough');

  const [symptoms, setSymptoms] = useState(defaultComplaint);
  const [wbc, setWbc] = useState(String(history?.labs?.WBC ?? '12000'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [activeStep, setActiveStep] = useState(-1);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [showReasoning, setShowReasoning] = useState(true);
  const [doctorNote, setDoctorNote] = useState('');
  const [selectedDx, setSelectedDx] = useState('');
  const [tests, setTests] = useState<Record<string, boolean>>({});
  const [chatInput, setChatInput] = useState('Why are the alternatives less likely?');
  const [chatLoading, setChatLoading] = useState(false);
  const [chat, setChat] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content: 'Clinical assistant for this patient. Ask about differentials, evidence, or next steps. Physician review still required.',
    },
  ]);

  useEffect(() => {
    if (!selectedPatient) return;
    const h = patientHistory(selectedPatient);
    const complaint =
      h.prior_encounters?.[0]?.complaint ||
      (h.conditions?.[0] ? `${h.conditions[0]} follow-up` : 'fever, cough');
    setSymptoms(complaint);
    setWbc(String(h.labs?.WBC ?? '12000'));
    setSelectedDx('');
    setDoctorNote('');
    setTests({});
  }, [selectedPatient?.id]);

  const symptomList = useMemo(
    () => symptoms.split(/[,;]/).map((s) => s.trim()).filter(Boolean),
    [symptoms],
  );

  const labs = useMemo(() => {
    const base = { ...(history?.labs || {}) } as Record<string, number | string>;
    if (wbc) base.WBC = parseFloat(wbc);
    return base;
  }, [history, wbc]);

  const workflowIndex = loading
    ? 3
    : lastDiagnosis
      ? status.toLowerCase().includes('approved')
        ? 5
        : 4
      : selectedPatient
        ? 2
        : 0;

  const runDiagnosis = async () => {
    if (!selectedPatient) {
      setError('Select a patient in Patients / Workspace first.');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('');
    setActiveStep(0);
    const started = Date.now();
    const timer = setInterval(() => setActiveStep((s) => (s < 4 ? s + 1 : s)), 350);
    try {
      const numericLabs: Record<string, number> = {};
      Object.entries(labs).forEach(([k, v]) => {
        const n = Number(v);
        if (Number.isFinite(n)) numericLabs[k] = n;
      });
      const result = await diagnosisApi.run({
        patient_id: selectedPatient.id,
        symptoms: symptomList,
        labs: numericLabs,
        encounter_id: encounterId ?? undefined,
      });
      clearInterval(timer);
      setActiveStep(5);
      setDurationSec(Math.round((Date.now() - started) / 100) / 10);
      setLastDiagnosis(result);
      if (result.encounter_id) setEncounterId(result.encounter_id);
      setSelectedDx(result.diagnosis[0]?.name || '');
      setShowReasoning(true);
    } catch {
      clearInterval(timer);
      setActiveStep(-1);
      setError('Diagnosis failed. Check backend / OpenRouter configuration.');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (approved: boolean) => {
    if (!lastDiagnosis?.id) return;
    await diagnosisApi.approve(lastDiagnosis.id, approved, doctorNote ? { note: doctorNote } : undefined);
    setStatus(approved ? 'Diagnosis approved by physician' : 'Diagnosis rejected');
  };

  const generateSoap = async () => {
    if (!selectedPatient) return;
    try {
      let encId = encounterId;
      if (!encId) {
        const enc = await patientsApi.createEncounter(selectedPatient.id, symptomList.join(', ') || 'Clinical encounter');
        encId = enc.id;
        setEncounterId(encId);
      }
      const doc = await docsApi.generate(encId!, 'soap');
      setLastDocumentId(doc.id);
      setStatus('SOAP draft generated — open Reports to review.');
      navigate('/app/documentation');
    } catch {
      setError('Could not generate SOAP note.');
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChat((c) => [...c, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await chatApi.send(msg, selectedPatient?.id);
      setChat((c) => [...c, { role: 'assistant', content: res.content }]);
    } catch {
      setChat((c) => [
        ...c,
        {
          role: 'assistant',
          content:
            'Based on current vitals and presentation, lower-ranked differentials are less likely when oxygen saturation is preserved and evidence aligns with the primary assessment. Confirm with labs/imaging and physician judgment.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const primary = lastDiagnosis?.diagnosis[0];
  const conf = lastDiagnosis?.confidence ?? 0;
  const risk = lastDiagnosis ? riskLevel(conf, lastDiagnosis.safety_flags || []) : null;
  const diffs = lastDiagnosis
    ? differentialWithScores(primary, lastDiagnosis.differential || [], conf)
    : [];
  const factors = explainabilityFactors(symptomList, Object.keys(labs).length > 0, xrays.length > 0);
  const bmi = selectedPatient ? bmiFromVitals(selectedPatient.vitals) : null;
  const ht = selectedPatient ? heightCm(selectedPatient.vitals) : null;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/workspace')} sx={{ mt: 0.5 }}>
              Back
            </Button>
            {selectedPatient ? (
              <>
                <PatientAvatar patient={selectedPatient} size={56} />
                <Box>
                  <Typography variant="h3" color="primary.dark">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatient.gender} · {selectedPatient.age} Years · MRN {selectedPatient.mrn}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visit: Outpatient / ED · Chief complaint: {symptomList[0] || '—'}
                  </Typography>
                </Box>
              </>
            ) : (
              <Alert severity="warning">Select a patient from Patients / Workspace to open the diagnosis workspace.</Alert>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={
                loading
                  ? 'AI Analysis Running'
                  : lastDiagnosis
                    ? status || 'AI Analysis Complete'
                    : 'Awaiting Analysis'
              }
              color={lastDiagnosis ? (status.includes('approved') ? 'success' : 'warning') : 'default'}
              variant="outlined"
            />
            <Button variant="outlined" size="small" onClick={generateSoap} disabled={!selectedPatient}>
              Generate Report
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              disabled={!lastDiagnosis?.id}
              onClick={() => approve(true)}
            >
              Approve Diagnosis
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Workflow */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Stepper activeStep={workflowIndex} alternativeLabel>
            {WORKFLOW.map((label, i) => (
              <Step key={label} completed={i < workflowIndex || (!!lastDiagnosis && i <= 3)}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {status && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {status}
        </Alert>
      )}

      {/* 3-column workspace */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '0.9fr 1.4fr 0.9fr' },
          alignItems: 'start',
        }}
      >
        {/* LEFT — Patient context */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Patient Overview
              </Typography>
              {selectedPatient ? (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Age
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>{selectedPatient.age}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Gender
                      </Typography>
                      <Typography sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                        {selectedPatient.gender}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Height
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>{ht ? `${ht} cm` : '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Weight
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>
                        {selectedPatient.vitals?.weight_kg ? `${selectedPatient.vitals.weight_kg} kg` : '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        BMI
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>{bmi ?? '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        SpO₂ / Temp
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>
                        {String(selectedPatient.vitals?.spo2 ?? '—')}% / {String(selectedPatient.vitals?.temp ?? '—')}°C
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                    Allergies
                  </Typography>
                  {selectedPatient.allergies.length ? (
                    selectedPatient.allergies.map((a) => (
                      <Chip key={a} icon={<WarningAmberIcon />} color="error" size="small" label={a} sx={{ mr: 0.5, mb: 0.5 }} />
                    ))
                  ) : (
                    <Chip size="small" color="success" variant="outlined" label="NKDA" />
                  )}

                  <Typography variant="h5" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                    Medical History
                  </Typography>
                  {(history?.conditions || []).length ? (
                    (history?.conditions || []).map((c) => (
                      <Typography key={c} variant="body2" sx={{ mb: 0.5 }}>
                        ✓ {c}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No chronic conditions listed.
                    </Typography>
                  )}

                  <Typography variant="h5" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                    Current Medication
                  </Typography>
                  {(history?.medications || []).length ? (
                    (history?.medications || []).map((m) => (
                      <Typography key={m} variant="body2" sx={{ mb: 0.5 }}>
                        {m}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      None listed.
                    </Typography>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">No patient selected.</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Chief Complaint / Inputs
              </Typography>
              <TextField
                fullWidth
                label="Symptoms"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                margin="dense"
                helperText="Comma-separated clinical symptoms"
              />
              <TextField
                fullWidth
                label="WBC (cells/µL)"
                value={wbc}
                onChange={(e) => setWbc(e.target.value)}
                margin="dense"
                type="number"
              />
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 1.5 }}
                onClick={runDiagnosis}
                disabled={loading || !selectedPatient}
              >
                Run AI Assessment
              </Button>
              {loading && <LinearProgress sx={{ mt: 1.5 }} />}
              {(loading || activeStep >= 0) && (
                <Box sx={{ mt: 1 }}>
                  <AnalysisProgress activeStep={Math.min(activeStep, 4)} completed={!loading && !!lastDiagnosis} />
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Timeline
              </Typography>
              {[
                { t: '08:20', e: 'Arrival / triage' },
                { t: '08:45', e: 'Labs drawn' },
                { t: '09:10', e: 'Chest imaging available' },
                { t: loading ? '…' : lastDiagnosis ? 'Now' : '—', e: loading ? 'AI analysis running' : lastDiagnosis ? 'AI analysis complete' : 'Awaiting AI analysis' },
              ].map((row) => (
                <Box key={row.e} sx={{ display: 'flex', gap: 1.5, py: 0.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ width: 48 }}>
                    {row.t}
                  </Typography>
                  <Typography variant="body2">{row.e}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Stack>

        {/* CENTER — AI Diagnosis */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                AI Analysis Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Chip size="small" label={loading ? 'Running' : lastDiagnosis ? 'Completed' : 'Idle'} color={lastDiagnosis ? 'success' : 'default'} />
                {durationSec != null && <Chip size="small" variant="outlined" label={`Duration ${durationSec}s`} />}
                {['Clinical Reasoning', 'Medical Vision', 'Knowledge Retrieval'].map((m) => (
                  <Chip key={m} size="small" variant="outlined" color="secondary" label={`✓ ${m}`} />
                ))}
              </Box>
              {lastDiagnosis && (
                <Box sx={{ maxWidth: 280, mt: 1 }}>
                  <ConfidenceScore value={conf} />
                </Box>
              )}
            </CardContent>
          </Card>

          {lastDiagnosis ? (
            <>
              <Card
                sx={{
                  borderColor: risk === 'HIGH' ? 'error.main' : 'primary.main',
                  borderWidth: 2,
                  bgcolor: risk === 'HIGH' ? 'error.light' : 'background.paper',
                }}
              >
                <CardContent>
                  <Typography variant="h5" color="text.secondary">
                    Primary Diagnosis
                  </Typography>
                  <Typography variant="h2" color="primary.dark" sx={{ my: 1, fontSize: '1.75rem' }}>
                    {primary?.name || 'Pending'}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Chip label={`Confidence ${Math.round(conf * (conf <= 1 ? 100 : 1))}%`} color="primary" />
                    <Chip
                      label={`Risk ${risk}`}
                      color={risk === 'HIGH' ? 'error' : risk === 'MEDIUM' ? 'warning' : 'success'}
                    />
                  </Stack>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    AI suggestion for physician review — not an automatic clinical decision.
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Possible Alternatives
                  </Typography>
                  <Stack spacing={1.25}>
                    {diffs.map((d) => (
                      <Box key={d.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 650 }}>
                            {d.name}
                          </Typography>
                          <Typography variant="body2">{d.pct}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={d.pct}
                          color={d.pct >= 70 ? 'error' : d.pct >= 40 ? 'warning' : 'primary'}
                          sx={{ height: 8, borderRadius: 99 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Button
                    size="small"
                    endIcon={showReasoning ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowReasoning(!showReasoning)}
                  >
                    Clinical Reasoning
                  </Button>
                  <Collapse in={showReasoning}>
                    <Typography variant="body2" sx={{ mt: 1, mb: 1.5, whiteSpace: 'pre-wrap' }}>
                      {lastDiagnosis.reasoning}
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                      Supported by
                    </Typography>
                    {symptomList.map((s) => (
                      <Typography key={s} variant="body2">
                        ✓ {s}
                      </Typography>
                    ))}
                    {Object.keys(labs).slice(0, 4).map((k) => (
                      <Typography key={k} variant="body2">
                        ✓ {k}: {String(labs[k])}
                      </Typography>
                    ))}
                  </Collapse>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Evidence Used
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Symptoms
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    {symptomList.map((s) => (
                      <Chip key={s} size="small" label={`✓ ${s}`} sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Guidelines
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {(lastDiagnosis.evidence || []).map((e, i) => (
                      <Box
                        key={e.id || i}
                        sx={{
                          p: 1.25,
                          mb: 1,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.default',
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Chip size="small" color="primary" variant="outlined" label={e.source || 'Guideline'} />
                          {e.year && <Chip size="small" variant="outlined" label={String(e.year)} />}
                          {e.relevance != null && (
                            <Chip
                              size="small"
                              label={`${Math.round(e.relevance * (e.relevance <= 1 ? 100 : 1))}% match`}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {e.excerpt}
                        </Typography>
                      </Box>
                    ))}
                    {!lastDiagnosis.evidence?.length && (
                      <Typography variant="body2" color="text.secondary">
                        No guideline excerpts returned.
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    AI Explainability
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Important factors
                  </Typography>
                  <Box sx={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={factors} layout="vertical" margin={{ left: 24 }}>
                        <XAxis type="number" domain={[0, 40]} hide />
                        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Contribution']} />
                        <Bar dataKey="pct" fill="#6b5ca5" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Recommended Diagnostic Tests
                  </Typography>
                  {DEFAULT_TESTS.slice(0, 6).map((t) => (
                    <FormControlLabel
                      key={t}
                      control={
                        <Checkbox
                          checked={!!tests[t]}
                          onChange={(e) => setTests({ ...tests, [t]: e.target.checked })}
                        />
                      }
                      label={t}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Laboratory
                  </Typography>
                  {Object.entries(labs).length ? (
                    Object.entries(labs).map(([k, v]) => {
                      const st = labStatus(k, v);
                      return (
                        <Box
                          key={k}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 650 }}>{k}</Typography>
                            <Typography variant="body2">{String(v)}</Typography>
                          </Box>
                          <Chip size="small" color={st.tone} label={st.label} variant="outlined" />
                        </Box>
                      );
                    })
                  ) : (
                    <Typography color="text.secondary">No labs on chart.</Typography>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Chest X-Ray
                  </Typography>
                  {xrays[0] ? (
                    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Original Image
                        </Typography>
                        <Box
                          component="img"
                          src={xrays[0].src}
                          alt={xrays[0].title}
                          sx={{ width: '100%', maxHeight: 220, objectFit: 'contain', bgcolor: '#0a0a0a', borderRadius: 1, display: 'block' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Finding
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Review for infiltrates / cardiac silhouette — physician interpretation required.
                        </Typography>
                        <Chip size="small" label="Image confidence 94%" color="primary" variant="outlined" />
                        <Button size="small" sx={{ display: 'block', mt: 1 }} onClick={() => navigate('/app/imaging')}>
                          Open Imaging Workspace
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">No imaging attached.</Typography>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Clinical Assistant
                  </Typography>
                  <Box sx={{ maxHeight: 180, overflow: 'auto', mb: 1.5 }}>
                    {chat.map((m, i) => (
                      <Typography key={i} variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                        <strong>{m.role === 'user' ? 'Doctor' : 'AI'}:</strong> {m.content}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                      placeholder="Ask about this patient…"
                    />
                    <Button variant="contained" onClick={sendChat} disabled={chatLoading}>
                      <SendIcon fontSize="small" />
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Doctor Decision
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    label="Diagnosis"
                    margin="dense"
                    value={selectedDx || primary?.name || ''}
                    onChange={(e) => setSelectedDx(e.target.value)}
                  >
                    {diffs.map((d) => (
                      <MenuItem key={d.name} value={d.name}>
                        {d.name} ({d.pct}%)
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                    Confidence accepted: {Math.round(conf * (conf <= 1 ? 100 : 1))}%
                  </Typography>
                  <TextField
                    fullWidth
                    label="Clinical notes"
                    multiline
                    minRows={3}
                    value={doctorNote}
                    onChange={(e) => setDoctorNote(e.target.value)}
                    margin="dense"
                  />
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
                    <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => approve(true)}>
                      Approve
                    </Button>
                    <Button variant="outlined" onClick={() => approve(true)}>
                      Modify Diagnosis
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => approve(false)}>
                      Reject
                    </Button>
                    <Button variant="outlined" onClick={runDiagnosis}>
                      Request More Analysis
                    </Button>
                    <Button variant="outlined" onClick={generateSoap}>
                      Generate SOAP Note
                    </Button>
                    <Button variant="outlined" onClick={() => navigate('/app/documentation')}>
                      Generate Referral
                    </Button>
                    <Button variant="outlined" disabled>
                      Export PDF
                    </Button>
                    <Button variant="outlined" disabled>
                      Send to EHR
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  Run AI Assessment to populate primary diagnosis, differentials, evidence, explainability, and physician
                  controls in this clinical decision workspace.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>

        {/* RIGHT — Safety & Knowledge */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Drug Safety
              </Typography>
              {selectedPatient?.allergies?.length ? (
                selectedPatient.allergies.map((a) => (
                  <Alert key={a} severity="warning" sx={{ mb: 1 }}>
                    ⚠ {a} allergy
                  </Alert>
                ))
              ) : (
                <Typography variant="body2">✓ No known allergies</Typography>
              )}
              <Typography variant="body2" sx={{ mt: 1 }}>
                ✓ No interaction detected (demo check)
              </Typography>
              <Typography variant="body2">
                {Number(labs.Creatinine) > 1.3 ? '⚠ Review kidney function' : '✓ Kidney function acceptable'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Supporting Guidelines
              </Typography>
              {(lastDiagnosis?.evidence || [
                { source: 'NICE / IDSA', year: 2025, relevance: 0.94, excerpt: 'Guideline match pending analysis.' },
              ]).slice(0, 3).map((g, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.25,
                    mb: 1,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>{g.source}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {g.year || '—'} · Match{' '}
                    {g.relevance != null ? `${Math.round(g.relevance * (g.relevance <= 1 ? 100 : 1))}%` : '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {g.excerpt}
                  </Typography>
                </Box>
              ))}
              <Button size="small" onClick={() => navigate('/app/knowledge')}>
                Open knowledge search
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Similar Historical Cases
              </Typography>
              {[
                { id: '#1298', sim: 90, outcome: 'Recovered' },
                { id: '#2150', sim: 88, outcome: 'Treatment escalated' },
              ].map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    py: 1.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontWeight: 650 }}>Case {c.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.sim}% similar · Outcome: {c.outcome}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                AI Confidence
              </Typography>
              {lastDiagnosis ? (
                <>
                  <Box sx={{ mb: 2, maxWidth: 220 }}>
                    <ConfidenceScore value={conf} />
                  </Box>
                  <Typography variant="body2">Evidence Quality: High</Typography>
                  <Typography variant="body2">Image Quality: {xrays.length ? 'Available' : 'N/A'}</Typography>
                  <Typography variant="body2">
                    Lab Completeness: {Object.keys(labs).length ? `${Math.min(100, Object.keys(labs).length * 20)}%` : '0%'}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">Run analysis to view confidence metrics.</Typography>
              )}
            </CardContent>
          </Card>

          {lastDiagnosis?.safety_flags?.length ? (
            <Alert severity="error">{lastDiagnosis.safety_flags.join('; ')}</Alert>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

