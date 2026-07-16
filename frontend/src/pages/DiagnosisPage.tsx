import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { diagnosisApi } from '../api/client';
import { useClinicalStore } from '../store';
import PatientHeader from '../components/Patient/PatientHeader';
import DiagnosisCard from '../components/AI/DiagnosisCard';
import AnalysisProgress from '../components/AI/AnalysisProgress';

export default function DiagnosisPage() {
  const { selectedPatient, setLastDiagnosis, lastDiagnosis, setEncounterId } = useClinicalStore();
  const [symptoms, setSymptoms] = useState('fever, cough');
  const [wbc, setWbc] = useState('12000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(-1);
  const [status, setStatus] = useState('');
  const [tests, setTests] = useState({ echo: false, cta: false, sputum: false });

  const runDiagnosis = async () => {
    if (!selectedPatient) {
      setError('Select a patient in Patients / Workspace first.');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('');
    setActiveStep(0);
    const timer = setInterval(() => setActiveStep((s) => (s < 4 ? s + 1 : s)), 400);
    try {
      const symptomList = symptoms.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await diagnosisApi.run({
        patient_id: selectedPatient.id,
        symptoms: symptomList,
        labs: wbc ? { WBC: parseFloat(wbc) } : {},
      });
      clearInterval(timer);
      setActiveStep(5);
      setLastDiagnosis(result);
      if (result.encounter_id) setEncounterId(result.encounter_id);
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
    await diagnosisApi.approve(lastDiagnosis.id, approved);
    setStatus(approved ? 'Diagnosis approved by physician' : 'Diagnosis rejected');
  };

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        AI Diagnosis Workspace
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Assessment for physician review — AI never finalizes clinical decisions.
      </Typography>

      {!selectedPatient && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Select a patient to begin the clinical assessment.
        </Alert>
      )}
      {selectedPatient && <PatientHeader patient={selectedPatient} />}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '0.95fr 1.05fr' } }}>
        <Card>
          <CardContent>
            <Typography variant="h5" color="primary.main" gutterBottom>
              Clinical Inputs
            </Typography>
            <TextField
              fullWidth
              label="Patient symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              margin="normal"
              helperText="Comma-separated (shown as evidence checks)"
            />
            <TextField
              fullWidth
              label="WBC (cells/µL)"
              value={wbc}
              onChange={(e) => setWbc(e.target.value)}
              margin="normal"
              type="number"
            />
            <Typography variant="h5" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
              Recommended tests
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={tests.echo} onChange={(e) => setTests({ ...tests, echo: e.target.checked })} />}
              label="Echocardiogram"
            />
            <FormControlLabel
              control={<Checkbox checked={tests.cta} onChange={(e) => setTests({ ...tests, cta: e.target.checked })} />}
              label="CT Angiography"
            />
            <FormControlLabel
              control={<Checkbox checked={tests.sputum} onChange={(e) => setTests({ ...tests, sputum: e.target.checked })} />}
              label="Sputum culture"
            />
            <Button variant="contained" onClick={runDiagnosis} disabled={loading || !selectedPatient} sx={{ mt: 2, display: 'block' }}>
              Run AI Assessment
            </Button>
            {loading && <LinearProgress sx={{ mt: 2 }} />}
            {(loading || activeStep >= 0) && (
              <Box sx={{ mt: 2 }}>
                <AnalysisProgress activeStep={Math.min(activeStep, 4)} completed={!loading && !!lastDiagnosis} />
              </Box>
            )}
          </CardContent>
        </Card>

        <Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {status && <Alert severity="success" sx={{ mb: 2 }}>{status}</Alert>}
          {lastDiagnosis ? (
            <DiagnosisCard
              result={lastDiagnosis}
              symptoms={symptoms.split(',').map((s) => s.trim()).filter(Boolean)}
              onApprove={() => approve(true)}
              onReject={() => approve(false)}
              onRequestMore={runDiagnosis}
            />
          ) : (
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  AI assessment will appear here with confidence, evidence, differentials, and physician controls.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}
