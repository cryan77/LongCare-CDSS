import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { diagnosisApi } from '../api/client';
import { useClinicalStore } from '../store';

export default function DiagnosisPage() {
  const { selectedPatient, setLastDiagnosis, lastDiagnosis, setEncounterId } = useClinicalStore();
  const [symptoms, setSymptoms] = useState('fever, cough');
  const [wbc, setWbc] = useState('12000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runDiagnosis = async () => {
    if (!selectedPatient) {
      setError('Please select a patient first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const symptomList = symptoms.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await diagnosisApi.run({
        patient_id: selectedPatient.id,
        symptoms: symptomList,
        labs: wbc ? { WBC: parseFloat(wbc) } : {},
      });
      setLastDiagnosis(result);
      if (result.encounter_id) setEncounterId(result.encounter_id);
    } catch {
      setError('Diagnosis failed. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (approved: boolean) => {
    if (lastDiagnosis?.id) {
      await diagnosisApi.approve(lastDiagnosis.id, approved);
    }
  };

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        AI Diagnosis Agent
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Multi-agent clinical reasoning with differential diagnosis and evidence retrieval.
      </Typography>

      {!selectedPatient && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Select a patient from the Patients page to run diagnosis.
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
          <Button variant="contained" onClick={runDiagnosis} disabled={loading} sx={{ mt: 2 }}>
            Run Diagnosis Agent
          </Button>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {lastDiagnosis && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">AI Reasoning Output</Typography>
              <Chip
                label={`${Math.round(lastDiagnosis.confidence * 100)}% confidence`}
                color="primary"
              />
            </Box>

            <Typography variant="subtitle2" color="primary.main" gutterBottom>
              Primary Diagnosis
            </Typography>
            {lastDiagnosis.diagnosis.map((d) => (
              <Chip
                key={d.name}
                label={`${d.name} (${Math.round(d.probability * 100)}%)`}
                color="primary"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
              Differential
            </Typography>
            <Box sx={{ mb: 2 }}>
              {lastDiagnosis.differential.map((d) => (
                <Chip key={d} label={d} variant="outlined" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Clinical Reasoning
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {lastDiagnosis.reasoning}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Evidence (RAG)
            </Typography>
            <List dense>
              {lastDiagnosis.evidence.map((e) => (
                <ListItem key={e.id} alignItems="flex-start">
                  <ListItemText
                    primary={`${e.source} (${e.year}) — relevance ${e.relevance}`}
                    secondary={e.excerpt}
                  />
                </ListItem>
              ))}
            </List>

            {lastDiagnosis.safety_flags.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {lastDiagnosis.safety_flags.join('; ')}
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              All AI recommendations require physician review before entering the clinical record.
            </Alert>

            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={() => approve(true)}
              sx={{ mt: 2, mr: 1 }}
            >
              Approve Diagnosis
            </Button>
            <Button variant="outlined" color="error" onClick={() => approve(false)} sx={{ mt: 2 }}>
              Reject
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
