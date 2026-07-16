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
} from '@mui/material';
import { docsApi, patientsApi } from '../api/client';
import { useClinicalStore } from '../store';

export default function DocumentationPage() {
  const { selectedPatient, encounterId } = useClinicalStore();
  const [docType, setDocType] = useState('soap');
  const [content, setContent] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      let encId = encounterId;
      if (!encId) {
        const enc = await patientsApi.createEncounter(selectedPatient.id, 'Clinical encounter');
        encId = enc.id;
      }
      const result = await docsApi.generate(encId!, docType);
      setContent(result.content);
    } finally {
      setLoading(false);
    }
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
                  {value}
                </Typography>
              </Box>
            ))}
            <Alert severity="info">
              Document pending physician approval before entering clinical record.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
