import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { imagingApi } from '../api/client';
import { useClinicalStore } from '../store';

export default function ImagingPage() {
  const { selectedPatient } = useClinicalStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    findings: string;
    abnormalities: string[];
    confidence: number;
    image_id: string;
    provider: string;
  } | null>(null);
  const [error, setError] = useState('');

  const onFile = (f: File | null) => {
    setFile(f);
    setResult(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (selectedPatient) form.append('patient_id', String(selectedPatient.id));
      const data = await imagingApi.analyze(form);
      setResult(data);
    } catch {
      setError('Image analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Medical Imaging
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload JPG/PNG chest imaging for Vision AI analysis (OpenRouter when configured, else mock).
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
            Choose Image
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {file.name}
            </Typography>
          )}
          {preview && (
            <Box
              component="img"
              src={preview}
              alt="Preview"
              sx={{ mt: 2, maxWidth: '100%', maxHeight: 360, borderRadius: 1, display: 'block' }}
            />
          )}
          <Button variant="contained" sx={{ mt: 2 }} onClick={analyze} disabled={!file || loading}>
            Analyze Image
          </Button>
          {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Findings ({result.provider})
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {result.findings}
            </Typography>
            <Typography variant="subtitle2">Abnormalities</Typography>
            <Typography variant="body2" color="text.secondary">
              {result.abnormalities.join(', ') || 'None flagged'}
            </Typography>
            <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
              Confidence: {Math.round(result.confidence * 100)}% · Image ID: {result.image_id}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Attach this image_id in diagnosis requests. Physician review required.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
