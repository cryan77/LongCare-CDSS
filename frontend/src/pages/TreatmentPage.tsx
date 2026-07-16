import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Stack,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { treatmentApi } from '../api/client';
import { useClinicalStore } from '../store';

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

  const approveAll = async (approved: boolean) => {
    const ids = treatmentIds.length
      ? treatmentIds
      : lastTreatment?.ids ?? (lastTreatment?.id ? [lastTreatment.id] : []);
    if (!ids.length) {
      setStatus('No treatment IDs to approve. Run CDSS workflow first.');
      return;
    }
    for (const id of ids) {
      await treatmentApi.approve(id, approved, editNote ? { note: editNote } : undefined);
    }
    setStatus(approved ? 'Treatment approved' : 'Treatment rejected');
  };

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Treatment Recommendation Agent
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Evidence-based treatment options with drug interaction and allergy safety checks.
      </Typography>

      {!selectedPatient && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Select a patient and run diagnosis first for best results.
        </Alert>
      )}

      <Button variant="contained" onClick={runTreatment} disabled={!selectedPatient || loading}>
        Generate Treatment Plan
      </Button>
      {loading && <LinearProgress sx={{ mt: 2, mb: 2 }} />}

      {lastTreatment && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recommended Medications
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

            {lastTreatment.warnings.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="error.main" gutterBottom>
                  <WarningAmberIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                  Safety Warnings
                </Typography>
                {lastTreatment.warnings.map((w) => (
                  <Alert key={w} severity="warning" sx={{ mb: 1 }}>
                    {w}
                  </Alert>
                ))}
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ mt: 3 }} gutterBottom>
              Guideline References
            </Typography>
            {lastTreatment.guidelines.map((g, i) => (
              <Chip key={i} label={g.source} size="small" sx={{ mr: 0.5 }} variant="outlined" />
            ))}

            <TextField
              fullWidth
              label="Physician edit / note (optional)"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              margin="normal"
              multiline
              minRows={2}
            />

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<CheckCircleIcon />}
                onClick={() => approveAll(true)}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => approveAll(false)}
              >
                Reject
              </Button>
            </Stack>

            {status && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {status}
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 3 }}>
              Safety checks: allergy screened, interactions screened, contraindications checked.
              Physician approval required.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
