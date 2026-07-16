import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { treatmentApi } from '../api/client';
import { useClinicalStore } from '../store';
import PatientHeader from '../components/Patient/PatientHeader';
import ExplainabilityPanel from '../components/AI/ExplainabilityPanel';

export default function TreatmentPage() {
  const { selectedPatient, lastDiagnosis, lastTreatment, setLastTreatment, treatmentIds } =
    useClinicalStore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [editNote, setEditNote] = useState('');

  const runTreatment = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    setStatus('');
    try {
      const diagnosisName = lastDiagnosis?.diagnosis[0]?.name ?? 'Pneumonia';
      const result = await treatmentApi.recommend({
        patient_id: selectedPatient.id,
        diagnosis_name: diagnosisName,
        diagnosis_id: lastDiagnosis?.id,
      });
      setLastTreatment(result);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (approved: boolean) => {
    const ids = treatmentIds.length
      ? treatmentIds
      : lastTreatment?.ids ?? (lastTreatment?.id ? [lastTreatment.id] : []);
    if (!ids.length) {
      setStatus('Run CDSS workflow or generate treatment first to obtain IDs.');
      return;
    }
    for (const id of ids) {
      await treatmentApi.approve(id, approved, editNote ? { note: editNote } : undefined);
    }
    setStatus(approved ? 'Treatment plan approved' : 'Treatment plan rejected');
  };

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Treatment Recommendation
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Medication suggestions with safety checks — doctor decision required.
      </Typography>

      {!selectedPatient && <Alert severity="warning" sx={{ mb: 3 }}>Select a patient first.</Alert>}
      {selectedPatient && <PatientHeader patient={selectedPatient} />}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Based on diagnosis
          </Typography>
          <Typography variant="h4" color="primary.dark" sx={{ mb: 2 }}>
            {lastDiagnosis?.diagnosis[0]?.name || 'Run diagnosis first (or defaults to pneumonia demo)'}
          </Typography>
          <Button variant="contained" onClick={runTreatment} disabled={!selectedPatient || loading}>
            Generate Treatment Plan
          </Button>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {lastTreatment && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' } }}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Medication Suggestions
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Drug</TableCell>
                    <TableCell>Dose</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lastTreatment.medications.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.dose}</TableCell>
                      <TableCell>{m.frequency}</TableCell>
                      <TableCell>{m.duration ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Typography variant="h5" color="text.secondary" sx={{ mt: 3, mb: 1 }}>
                Evidence
              </Typography>
              {lastTreatment.guidelines.map((g, i) => (
                <Chip key={i} label={g.source} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" />
              ))}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" color="primary.main" gutterBottom>
                  Safety Checks
                </Typography>
                {['Allergy Check', 'Drug Interaction', 'Age Check'].map((c) => (
                  <Box key={c} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="body2">{c}</Typography>
                  </Box>
                ))}
                {lastTreatment.warnings.map((w) => (
                  <Alert key={w} severity="warning" icon={<WarningAmberIcon />} sx={{ mt: 1 }}>
                    {w}
                  </Alert>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h5" color="primary.main" gutterBottom>
                  Doctor Decision
                </Typography>
                <TextField
                  fullWidth
                  label="Modify / clinical note"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  multiline
                  minRows={2}
                  sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => decide(true)}>
                    Approve
                  </Button>
                  <Button variant="outlined" startIcon={<EditIcon />} onClick={() => decide(true)}>
                    Modify & Approve
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => decide(false)}>
                    Reject
                  </Button>
                </Stack>
                {status && <Alert severity="success" sx={{ mt: 2 }}>{status}</Alert>}
              </CardContent>
            </Card>

            <ExplainabilityPanel
              inputs={['Diagnosis context', 'Allergy profile', 'Interaction rules', 'Guidelines']}
              sources={lastTreatment.guidelines.map((g) => g.source)}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
