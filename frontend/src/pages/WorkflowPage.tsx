import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { diagnosisApi } from '../api/client';
import { useClinicalStore } from '../store';
import PatientHeader from '../components/Patient/PatientHeader';
import AnalysisProgress from '../components/AI/AnalysisProgress';
import DiagnosisCard from '../components/AI/DiagnosisCard';

const WORKFLOW_STEPS = [
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
      if (data.diagnosis) setLastDiagnosis(data.diagnosis);
      if (data.treatment) setLastTreatment(data.treatment);
    } catch {
      setError('Workflow failed. Ensure the backend is running and OpenRouter is configured.');
      setActiveStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const diagnosis = result?.diagnosis as
    | {
        id?: number;
        diagnosis?: { name: string; probability: number }[];
        differential?: string[];
        reasoning?: string;
        evidence?: { source?: string; excerpt?: string }[];
        confidence?: number;
        safety_flags?: string[];
      }
    | undefined;
  const treatment = result?.treatment as
    | { medications?: { name: string; dose: string; frequency: string }[]; warnings?: string[] }
    | undefined;
  const documentation = result?.documentation as { content?: Record<string, string> } | undefined;
  const safety = result?.safety_review as { flags?: string[]; requires_human_review?: boolean } | undefined;

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Run CDSS Workflow
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Full multi-agent pipeline with physician approval gates at the end.
      </Typography>

      {!selectedPatient && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Select a patient from Patients / Workspace first.
        </Alert>
      )}
      {selectedPatient && <PatientHeader patient={selectedPatient} />}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' } }}>
        <Card>
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

        {(activeStep >= 0 || loading) && (
          <Card>
            <CardContent>
              <AnalysisProgress
                steps={WORKFLOW_STEPS}
                activeStep={Math.min(activeStep, WORKFLOW_STEPS.length - 1)}
                completed={!loading && !!result}
              />
            </CardContent>
          </Card>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Encounter #${result.encounter_id}`} color="primary" size="small" />
            <Chip label={`Diagnosis #${result.diagnosis_id}`} size="small" />
            <Chip label={`Document #${result.document_id}`} size="small" />
            <Chip label={String(result.status)} color="warning" size="small" />
          </Box>

          {diagnosis?.diagnosis && (
            <DiagnosisCard
              result={{
                id: diagnosis.id,
                diagnosis: diagnosis.diagnosis,
                differential: diagnosis.differential || [],
                reasoning: diagnosis.reasoning || '',
                evidence: diagnosis.evidence || [],
                confidence: diagnosis.confidence || 0,
                safety_flags: diagnosis.safety_flags || safety?.flags || [],
              }}
              symptoms={symptoms.split(',').map((s) => s.trim()).filter(Boolean)}
            />
          )}

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Treatment & Safety
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
              <Typography variant="body2">
                {(safety?.flags ?? []).length
                  ? (safety?.flags ?? []).join('; ')
                  : 'No critical safety flags. Physician review still required.'}
              </Typography>
            </CardContent>
          </Card>

          {documentation?.content && (
            <Card>
              <CardContent>
                <Typography variant="h5" color="primary.main" gutterBottom>
                  SOAP Documentation
                </Typography>
                {Object.entries(documentation.content).map(([k, v]) => (
                  <Box key={k} sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      {k}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {v}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          <Alert severity="info">
            Review and approve each artifact on Diagnosis, Treatment, and Documentation pages.
          </Alert>
        </Box>
      )}
    </Box>
  );
}
