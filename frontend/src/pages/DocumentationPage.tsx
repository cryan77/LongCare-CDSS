import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  TextField,
  Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { docsApi, patientsApi } from '../api/client';
import { useClinicalStore } from '../store';

export default function DocumentationPage() {
  const { selectedPatient, encounterId, lastDocumentId, setLastDocumentId, setEncounterId } =
    useClinicalStore();
  const [docType, setDocType] = useState('soap');
  const [content, setContent] = useState<Record<string, string> | null>(null);
  const [docId, setDocId] = useState<number | null>(lastDocumentId);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [editPlan, setEditPlan] = useState('');

  const generate = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    setStatus('');
    try {
      let encId = encounterId;
      if (!encId) {
        const enc = await patientsApi.createEncounter(selectedPatient.id, 'Clinical encounter');
        encId = enc.id;
        setEncounterId(encId);
      }
      const result = await docsApi.generate(encId!, docType);
      setContent(result.content);
      setDocId(result.id);
      setLastDocumentId(result.id);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (approved: boolean) => {
    if (!docId) {
      setStatus('Generate a document first.');
      return;
    }
    const edits = editPlan ? { plan: editPlan } : undefined;
    await docsApi.approve(docId, approved, edits);
    if (editPlan && content) {
      setContent({ ...content, plan: editPlan });
    }
    setStatus(approved ? 'Document approved' : 'Document rejected');
  };

  const downloadPdf = async () => {
    if (!docId) return;
    const blob = await docsApi.pdf(docId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-doc-${docId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Clinical Documentation Agent
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Generate SOAP notes and discharge summaries for physician review.
      </Typography>

      {!selectedPatient && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Select a patient to generate documentation.
        </Alert>
      )}

      <ToggleButtonGroup
        value={docType}
        exclusive
        onChange={(_, v) => v && setDocType(v)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="soap">SOAP Note</ToggleButton>
        <ToggleButton value="discharge">Discharge Summary</ToggleButton>
      </ToggleButtonGroup>

      <Box>
        <Button variant="contained" onClick={generate} disabled={!selectedPatient || loading}>
          Generate {docType === 'soap' ? 'SOAP Note' : 'Discharge Summary'}
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ mt: 2 }} />}

      {content && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            {Object.entries(content).map(([key, value]) => (
              <Box key={key} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  color="primary.main"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                  gutterBottom
                >
                  {key}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {String(value)}
                </Typography>
              </Box>
            ))}

            <TextField
              fullWidth
              label="Edit Plan section (optional)"
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value)}
              margin="normal"
              multiline
              minRows={2}
            />

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Button variant="contained" startIcon={<CheckCircleIcon />} onClick={() => approve(true)}>
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => approve(false)}
              >
                Reject
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={downloadPdf}
                disabled={!docId}
              >
                Download PDF
              </Button>
            </Stack>

            {status && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {status}
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              Document pending physician approval before entering clinical record.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
