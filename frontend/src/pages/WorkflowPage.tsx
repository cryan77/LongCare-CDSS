import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { diagnosisApi } from '../api/client';
import { useClinicalStore } from '../store';

const STEP_LABELS = [
  'Validation',
  'Diagnosis',
  'Knowledge',
  'Treatment',
  'Safety',
  'Documentation',
  'Pending Approval',
];

export default function WorkflowPage() {
  const {
    selectedPatient,
    setLastDiagnosis,
    setLastTreatment,
    setEncounterId,
    setWorkflowResult,
  } = useClinicalStore();
  const [symptoms, setSymptoms] = useState('fever, cough');
  const [wbc, setWbc] = useState('12000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(-1);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const runWorkflow = async () => {
    if (!selectedPatient) {
      setError('Select a patient first.');
      return;
    }
    setLoading(true);
    setError('');
    setActiveStep(0);
    setResult(null);
    try {
      const symptomList = symptoms.split(',').map((s) => s.trim()).filter(Boolean);
      // Animate steps briefly while request runs
      const timer = setInterval(() => {
        setActiveStep((s) => (s < 5 ? s + 1 : s));
      }, 350);

      const data = await diagnosisApi.workflow({
        patient_id: selectedPatient.id,
        symptoms: symptomList,
        labs: wbc ? { WBC: parseFloat(wbc) } : {},
      });

      clearInterval(timer);
      setActiveStep(6);
      setResult(data);
      setEncounterId(data.encounter_id);
      setWorkflowResult(data);
      if (data.diagnosis) {
        setLastDiagnosis(data.diagnosis);
      }
      if (data.treatment) {
        setLastTreatment(data.treatment);
      }
    } catch {
      setError('Workflow failed. Ensure the backend is running.');
      setActiveStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const diagnosis = result?.diagnosis as
    | { diagnosis?: { name: string; probability: number }[]; reasoning?: string; confidence?: number }
    | undefined;
  const treatment = result?.treatment as
    | { medications?: { name: string; dose: string; frequency: string }[]; warnings?: string[] }
    | undefined;
  const documentation = result?.documentation as { content?: Record<string, string> } | undefined;
  const safety = result?.safety_review as { flags?: string[]; requires_human_review?: boolean } | undefined;

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Run CDSS Workflow
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Full multi-agent pipeline: validation → diagnosis → knowledge → treatment → safety → documentation.
      </Typography>

      {!selectedPatient && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Select a patient from the Patients page first.
        </Alert>
      )}

      {selectedPatient && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Patient: {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.mrn})
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Symptoms (comma-separated)"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="WBC (cells/µL)"
            value={wbc}
            onChange={(e) => setWbc(e.target.value)}
            margin="normal"
            type="number"
          />
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={runWorkflow}
            disabled={loading || !selectedPatient}
            sx={{ mt: 2 }}
          >
            Run Full CDSS
          </Button>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {activeStep >= 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEP_LABELS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Workflow Results
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`Encounter #${result.encounter_id}`} color="primary" size="small" />
              <Chip label={`Diagnosis #${result.diagnosis_id}`} size="small" />
              <Chip label={`Document #${result.document_id}`} size="small" />
              <Chip label={String(result.status)} color="warning" size="small" />
            </Box>

            <Typography variant="subtitle2" color="primary.main">
              Diagnosis
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {diagnosis?.diagnosis?.[0]?.name} ({Math.round((diagnosis?.confidence ?? 0) * 100)}%) —{' '}
              {diagnosis?.reasoning}
            </Typography>

            <Typography variant="subtitle2" color="primary.main">
              Treatment
            </Typography>
            {(treatment?.medications ?? []).map((m) => (
              <Chip
                key={m.name}
                label={`${m.name} ${m.dose} ${m.frequency}`}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {(treatment?.warnings ?? []).map((w) => (
              <Alert key={w} severity="warning" sx={{ mt: 1 }}>
                {w}
              </Alert>
            ))}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="primary.main">
              Safety
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {(safety?.flags ?? []).length
                ? (safety?.flags ?? []).join('; ')
                : 'No critical safety flags. Physician review still required.'}
            </Typography>

            <Typography variant="subtitle2" color="primary.main">
              SOAP Documentation
            </Typography>
            {documentation?.content &&
              Object.entries(documentation.content).map(([k, v]) => (
                <Box key={k} sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                    {k}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {v}
                  </Typography>
                </Box>
              ))}

            <Alert severity="info" sx={{ mt: 2 }}>
              Review and approve each artifact on Diagnosis, Treatment, and Documentation pages.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
