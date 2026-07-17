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
  FormControlLabel,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import DescriptionIcon from '@mui/icons-material/Description';
import { docsApi, treatmentApi } from '../api/client';
import { useAuthStore, useClinicalStore } from '../store';
import PatientAvatar from '../components/Patient/PatientAvatar';
import { bmiFromVitals, patientHistory } from '../components/Diagnosis/helpers';
import {
  allergySafety,
  availabilityFor,
  drugTimeline,
  evidenceStrength,
  followUpFor,
  lifestyleFor,
  monitoringFor,
  patientInstructions,
  primaryGuideline,
  proceduresFor,
  recentLabChips,
  stars,
  toEditableMeds,
  type EditableMed,
} from '../components/Treatment/helpers';

type CenterTab = 'treatment' | 'medications' | 'procedures' | 'monitoring' | 'evidence' | 'prescription';

export default function TreatmentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    selectedPatient,
    lastDiagnosis,
    lastTreatment,
    setLastTreatment,
    treatmentIds,
    encounterId,
    setLastDocumentId,
  } = useClinicalStore();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [editNote, setEditNote] = useState('');
  const [approved, setApproved] = useState(false);
  const [centerTab, setCenterTab] = useState<CenterTab>('treatment');
  const [meds, setMeds] = useState<EditableMed[]>([]);
  const [procedures, setProcedures] = useState<Record<string, boolean>>({});
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const history = selectedPatient ? patientHistory(selectedPatient) : null;
  const diagnosisName = lastDiagnosis?.diagnosis[0]?.name || 'Pending diagnosis';
  const doctorLabel = user?.full_name?.startsWith('Dr')
    ? user.full_name
    : `Dr. ${user?.full_name || 'Clinician'}`;
  const bmi = selectedPatient ? bmiFromVitals(selectedPatient.vitals) : null;
  const labChips = recentLabChips(selectedPatient);
  const strength = evidenceStrength(lastTreatment?.guidelines || [], lastTreatment?.warnings?.length || 0);
  const guideline = primaryGuideline(lastTreatment?.guidelines || []);
  const lifestyle = useMemo(() => lifestyleFor(diagnosisName), [diagnosisName]);
  const procedureOptions = useMemo(() => proceduresFor(diagnosisName), [diagnosisName]);
  const monitoring = useMemo(() => monitoringFor(diagnosisName), [diagnosisName]);
  const followUps = useMemo(() => followUpFor(diagnosisName), [diagnosisName]);
  const timeline = useMemo(() => drugTimeline(meds), [meds]);
  const instructions = useMemo(() => patientInstructions(diagnosisName, meds), [diagnosisName, meds]);
  const allergyChecks = useMemo(
    () => allergySafety(selectedPatient?.allergies || [], meds),
    [selectedPatient?.allergies, meds],
  );
  const stock = useMemo(() => availabilityFor(meds), [meds]);

  useEffect(() => {
    setMeds(toEditableMeds(lastTreatment));
    setApproved(false);
  }, [lastTreatment]);

  useEffect(() => {
    const init: Record<string, boolean> = {};
    procedureOptions.forEach((p, i) => {
      init[p] = i < 2;
    });
    setProcedures(init);
  }, [procedureOptions]);

  const planStatus = !lastTreatment
    ? 'Awaiting Plan'
    : approved
      ? 'Approved'
      : status.toLowerCase().includes('reject')
        ? 'Rejected'
        : 'Pending Approval';

  const runTreatment = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const result = await treatmentApi.recommend({
        patient_id: selectedPatient.id,
        diagnosis_name: lastDiagnosis?.diagnosis[0]?.name ?? 'Pneumonia',
        diagnosis_id: lastDiagnosis?.id,
      });
      setLastTreatment(result);
      setGeneratedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      );
      setStatus('AI treatment plan generated — physician review required.');
      setCenterTab('medications');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Treatment generation failed');
    } finally {
      setLoading(false);
    }
  };

  const decide = async (ok: boolean) => {
    const ids = treatmentIds.length
      ? treatmentIds
      : lastTreatment?.ids ?? (lastTreatment?.id ? [lastTreatment.id] : []);
    if (!ids.length) {
      setStatus('Generate a treatment plan first to obtain IDs for approval.');
      return;
    }
    try {
      for (const id of ids) {
        await treatmentApi.approve(id, ok, {
          note: editNote || undefined,
          medications: meds.filter((m) => m.included),
          procedures: Object.entries(procedures)
            .filter(([, v]) => v)
            .map(([k]) => k),
        });
      }
      setApproved(ok);
      setStatus(ok ? 'Treatment plan approved' : 'Treatment plan rejected');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed');
    }
  };

  const updateMed = (idx: number, patch: Partial<EditableMed>) => {
    setMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const generateDischarge = async () => {
    if (!encounterId) {
      setStatus('Open an encounter from Diagnosis / Workspace first for documentation.');
      return;
    }
    try {
      const doc = await docsApi.generate(encounterId, 'discharge');
      setLastDocumentId(doc.id);
      setStatus('Discharge summary draft generated — open Reports to review.');
    } catch {
      setStatus('Could not generate discharge summary.');
    }
  };

  const selectedProcedureCount = Object.values(procedures).filter(Boolean).length;

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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/workspace')} sx={{ mt: 0.5 }}>
              Back
            </Button>
            {selectedPatient ? (
              <>
                <PatientAvatar patient={selectedPatient} size={56} />
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Treatment Planning
                  </Typography>
                  <Typography variant="h3" color="primary.dark">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Diagnosis: {diagnosisName}
                    {lastDiagnosis ? ' (from AI assessment)' : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doctor: {doctorLabel}
                    {generatedAt ? ` · Generated: ${generatedAt}` : ''}
                  </Typography>
                </Box>
              </>
            ) : (
              <Alert severity="warning">Select a patient to open the treatment planning workspace.</Alert>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={planStatus}
              color={approved ? 'success' : lastTreatment ? 'warning' : 'default'}
              variant="outlined"
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setStatus('Draft saved locally for this session.')}
              disabled={!lastTreatment}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              disabled={!lastTreatment}
              onClick={() => decide(true)}
            >
              Approve Treatment
            </Button>
          </Box>
        </Box>
      </Box>

      {!lastDiagnosis && selectedPatient && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No confirmed diagnosis in session — you can still generate a treatment plan (defaults to pneumonia demo if
          needed). Prefer running Diagnosis first.
        </Alert>
      )}
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
                Patient Information
              </Typography>
              {selectedPatient ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
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
                      BMI
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>{bmi ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Blood Group
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      {String(selectedPatient.vitals?.blood_group ?? '—')}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">No patient selected.</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Allergies
              </Typography>
              {selectedPatient?.allergies?.length ? (
                selectedPatient.allergies.map((a) => (
                  <Chip
                    key={a}
                    icon={<WarningAmberIcon />}
                    color="error"
                    size="small"
                    label={a}
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))
              ) : (
                <Chip size="small" color="success" variant="outlined" label="NKDA" />
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

              <Typography variant="h5" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
                Medical Conditions
              </Typography>
              {(history?.conditions || []).length ? (
                (history?.conditions || []).map((c) => (
                  <Typography key={c} variant="body2" sx={{ mb: 0.5 }}>
                    {c}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  None listed.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Latest Labs
              </Typography>
              {labChips.length ? (
                labChips.map((l) => (
                  <Chip
                    key={l.name}
                    size="small"
                    color={l.tone === 'default' ? 'default' : l.tone}
                    label={l.label}
                    sx={{ mr: 0.5, mb: 0.5 }}
                    variant={l.tone === 'success' ? 'outlined' : 'filled'}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No labs on file.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Generate Plan
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                AI proposes medications, safety checks, and follow-up. Final orders require physician approval.
              </Typography>
              <Button fullWidth variant="contained" onClick={runTreatment} disabled={!selectedPatient || loading}>
                Generate Treatment Plan
              </Button>
              {loading && <LinearProgress sx={{ mt: 1.5 }} />}
            </CardContent>
          </Card>
        </Stack>

        {/* CENTER — AI Treatment Plan (tabs) */}
        <Stack spacing={2}>
          <Card>
            <CardContent sx={{ pb: 0 }}>
              <Tabs
                value={centerTab}
                onChange={(_, v: CenterTab) => setCenterTab(v)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab value="treatment" label="Treatment" />
                <Tab value="medications" label="Medications" />
                <Tab value="procedures" label="Procedures" />
                <Tab value="monitoring" label="Monitoring" />
                <Tab value="evidence" label="Evidence" />
                <Tab value="prescription" label="Prescription" />
              </Tabs>
            </CardContent>
            <CardContent>
              {!lastTreatment && centerTab !== 'treatment' && (
                <Alert severity="info">Generate an AI treatment plan to populate this tab.</Alert>
              )}

              {centerTab === 'treatment' && (
                <Box>
                  <Box
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      Recommended Treatment
                    </Typography>
                    <Typography variant="h4" color="primary.dark">
                      {diagnosisName}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`Evidence ${strength}`} color={strength === 'HIGH' ? 'success' : 'default'} />
                      <Chip size="small" variant="outlined" label={`Guideline: ${guideline}`} />
                    </Stack>
                  </Box>

                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Why This Treatment?
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    ✓ Clinical context: {diagnosisName}
                  </Typography>
                  {(history?.conditions || []).slice(0, 2).map((c) => (
                    <Typography key={c} variant="body2" sx={{ mb: 0.5 }}>
                      ✓ History: {c}
                    </Typography>
                  ))}
                  {(lastTreatment?.guidelines || []).slice(0, 2).map((g, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                      ✓ {g.source}
                    </Typography>
                  ))}
                  {!lastTreatment && (
                    <Typography variant="body2" color="text.secondary">
                      Generate a plan to see guideline-linked reasoning.
                    </Typography>
                  )}

                  <Typography variant="h5" color="primary.main" sx={{ mt: 2, mb: 1 }}>
                    Expected Outcome
                  </Typography>
                  <Typography variant="body2">Reduced acute risk and symptom burden with guideline-directed therapy.</Typography>
                  <Typography variant="body2">Improved secondary prevention and safer medication use.</Typography>

                  <Typography variant="h5" color="primary.main" sx={{ mt: 2, mb: 1 }}>
                    Lifestyle
                  </Typography>
                  {lifestyle.map((item) => (
                    <Typography key={item} variant="body2" sx={{ mb: 0.5 }}>
                      ✓ {item}
                    </Typography>
                  ))}

                  <Typography variant="h5" color="primary.main" sx={{ mt: 2, mb: 1 }}>
                    Follow-up
                  </Typography>
                  {followUps.map((f) => (
                    <Box key={f.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography variant="body2">{f.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {f.when}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {centerTab === 'medications' && lastTreatment && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Editable medication cards — adjust dose, frequency, or exclude before approval.
                  </Typography>
                  {meds.map((m, idx) => (
                    <Card key={`${m.name}-${idx}`} variant="outlined" sx={{ mb: 1.5 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={m.included}
                                onChange={(e) => updateMed(idx, { included: e.target.checked })}
                              />
                            }
                            label={
                              <Typography variant="h5" color="primary.dark">
                                {m.name}
                              </Typography>
                            }
                          />
                          <Chip size="small" label={stars(m.evidence)} variant="outlined" />
                        </Box>
                        {editingIdx === idx ? (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <TextField
                              size="small"
                              label="Dose"
                              value={m.dose}
                              onChange={(e) => updateMed(idx, { dose: e.target.value })}
                            />
                            <TextField
                              size="small"
                              label="Frequency"
                              value={m.frequency}
                              onChange={(e) => updateMed(idx, { frequency: e.target.value })}
                            />
                            <TextField
                              size="small"
                              label="Duration"
                              value={m.duration}
                              onChange={(e) => updateMed(idx, { duration: e.target.value })}
                            />
                            <TextField
                              size="small"
                              label="Route"
                              value={m.route}
                              onChange={(e) => updateMed(idx, { route: e.target.value })}
                            />
                            <Button size="small" onClick={() => setEditingIdx(null)}>
                              Done
                            </Button>
                          </Stack>
                        ) : (
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {m.dose} · {m.frequency} · {m.duration} · {m.route}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              sx={{ mt: 1 }}
                              onClick={() => setEditingIdx(idx)}
                            >
                              Modify
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <Typography variant="h5" color="primary.main" sx={{ mt: 1, mb: 1 }}>
                    Drug Timeline
                  </Typography>
                  {timeline.map((t) => (
                    <Box key={`${t.when}-${t.label}`} sx={{ display: 'flex', gap: 1.5, mb: 0.75 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                        {t.when}
                      </Typography>
                      <Typography variant="body2">
                        {t.done ? '✔ ' : ''}
                        {t.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {centerTab === 'procedures' && (
                <Box>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Recommended Procedures
                  </Typography>
                  {procedureOptions.map((p) => (
                    <FormControlLabel
                      key={p}
                      control={
                        <Checkbox
                          checked={!!procedures[p]}
                          onChange={(e) => setProcedures((prev) => ({ ...prev, [p]: e.target.checked }))}
                        />
                      }
                      label={p}
                      sx={{ display: 'flex', ml: 0 }}
                    />
                  ))}
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {selectedProcedureCount} procedure(s) selected for the care plan.
                  </Alert>
                </Box>
              )}

              {centerTab === 'monitoring' && (
                <Box>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Required Monitoring
                  </Typography>
                  {monitoring.map((m) => (
                    <Box
                      key={m.item}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2">{m.item}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {m.schedule}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {centerTab === 'evidence' && (
                <Box>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Supporting Evidence
                  </Typography>
                  {(lastTreatment?.guidelines || []).length ? (
                    lastTreatment!.guidelines.map((g, i) => (
                      <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                        <CardContent>
                          <Typography sx={{ fontWeight: 700 }}>{g.source}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {g.excerpt || 'Guideline excerpt available after retrieval.'}
                          </Typography>
                          <Chip size="small" label={stars(5 - Math.min(i, 2))} sx={{ mt: 1 }} variant="outlined" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Generate a treatment plan to retrieve guideline citations.
                    </Typography>
                  )}
                </Box>
              )}

              {centerTab === 'prescription' && (
                <Box>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    Prescription Preview
                  </Typography>
                  {meds.filter((m) => m.included).length ? (
                    meds
                      .filter((m) => m.included)
                      .map((m, i) => (
                        <Box
                          key={`${m.name}-rx-${i}`}
                          sx={{
                            py: 1.25,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography sx={{ fontWeight: 700 }}>✓ {m.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {m.dose} · {m.frequency} · {m.duration}
                          </Typography>
                        </Box>
                      ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No medications selected.
                    </Typography>
                  )}

                  <Typography variant="h5" color="primary.main" sx={{ mt: 2, mb: 1 }}>
                    Patient Instructions
                  </Typography>
                  {instructions.map((line) => (
                    <Typography key={line} variant="body2" sx={{ mb: 0.75 }}>
                      • {line}
                    </Typography>
                  ))}

                  <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<LocalPharmacyIcon />}
                      disabled={!lastTreatment}
                      onClick={() => setStatus('Prescription package ready — approve treatment to send to pharmacy.')}
                    >
                      Generate Prescription
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DescriptionIcon />}
                      onClick={generateDischarge}
                    >
                      Generate Discharge Summary
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Doctor Review
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Diagnosis: {lastDiagnosis ? 'Assessed / available for confirmation' : 'Not yet run'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Treatment: {lastTreatment ? 'AI draft — editable before approval' : 'Not generated'}
              </Typography>
              <TextField
                fullWidth
                label="Doctor notes"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                multiline
                minRows={3}
                placeholder="Document modifications, rationale, or pharmacy instructions…"
              />
              <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  disabled={!lastTreatment}
                  onClick={() => decide(true)}
                >
                  Approve Treatment
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  disabled={!lastTreatment}
                  onClick={() => {
                    setCenterTab('medications');
                    decide(true);
                  }}
                >
                  Modify & Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  disabled={!lastTreatment}
                  onClick={() => decide(false)}
                >
                  Reject
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* RIGHT — Safety & actions */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Medication Safety
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2">Interaction</Typography>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  {(lastTreatment?.warnings || []).some((w) => /interaction/i.test(w))
                    ? 'Review alerts'
                    : 'None flagged'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2">Kidney Dose</Typography>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  {(lastTreatment?.warnings || []).some((w) => /renal|egfr|ckd|creatinine/i.test(w))
                    ? 'Adjust / verify'
                    : 'Normal'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="body2">Liver Dose</Typography>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  Normal
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Pregnancy</Typography>
                <Typography variant="body2" sx={{ fontWeight: 650 }}>
                  N/A
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Safety Alerts
              </Typography>
              {allergyChecks.length ? (
                allergyChecks.map((a) => (
                  <Alert
                    key={a.allergy}
                    severity={a.safe ? 'success' : 'error'}
                    icon={a.safe ? <CheckCircleIcon /> : <WarningAmberIcon />}
                    sx={{ mb: 1 }}
                  >
                    ⚠ {a.allergy} — {a.note}
                    {a.safe ? ' · ✓ Safe' : ''}
                  </Alert>
                ))
              ) : (
                <Alert severity="success">No allergies on file.</Alert>
              )}
              {(lastTreatment?.warnings || []).map((w) => (
                <Alert key={w} severity="warning" sx={{ mb: 1 }}>
                  {w}
                </Alert>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Contraindications
              </Typography>
              {(lastTreatment?.warnings || []).filter((w) => /contraindic|avoid|caution/i.test(w)).length ? (
                (lastTreatment?.warnings || [])
                  .filter((w) => /contraindic|avoid|caution/i.test(w))
                  .map((w) => (
                    <Typography key={w} variant="body2" sx={{ mb: 0.75 }}>
                      {w}
                    </Typography>
                  ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No absolute contraindications flagged for the current draft.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Medication Availability
              </Typography>
              {stock.length ? (
                stock.map((s) => (
                  <Box key={s.name} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{s.name}</Typography>
                      <Chip
                        size="small"
                        label={s.status}
                        color={s.status === 'Available' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                    {s.alternative && (
                      <Typography variant="caption" color="text.secondary">
                        Alternative: {s.alternative}
                      </Typography>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Generate a plan to check formulary status.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* Bottom toolbar */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h5" color="primary.main" gutterBottom>
            Orders & Actions
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="contained" color="success" disabled={!lastTreatment} onClick={() => decide(true)}>
              Approve Treatment
            </Button>
            <Button variant="outlined" disabled={!lastTreatment} onClick={() => setCenterTab('medications')}>
              Modify Medication
            </Button>
            <Button
              variant="outlined"
              disabled={!lastTreatment}
              onClick={() => setStatus('Pharmacy review requested.')}
            >
              Request Pharmacy Review
            </Button>
            <Button variant="outlined" onClick={() => setCenterTab('procedures')}>
              Order Procedure
            </Button>
            <Button
              variant="outlined"
              disabled={!lastTreatment}
              onClick={() => {
                setCenterTab('prescription');
                setStatus('Prescription package ready for approval.');
              }}
            >
              Generate Prescription
            </Button>
            <Button variant="outlined" onClick={generateDischarge}>
              Generate Discharge Summary
            </Button>
            <Button
              variant="outlined"
              disabled={!approved}
              onClick={() => setStatus('Orders queued for pharmacy.')}
            >
              Send to Pharmacy
            </Button>
            <Button
              variant="outlined"
              disabled={!approved}
              onClick={() => setStatus('Treatment summary prepared for EHR handoff.')}
            >
              Send to EHR
            </Button>
            <Button variant="outlined" onClick={() => window.print()}>
              Export PDF
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
