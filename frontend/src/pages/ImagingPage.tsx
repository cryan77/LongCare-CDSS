import { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { imagingApi } from '../api/client';
import { useClinicalStore } from '../store';
import PatientHeader from '../components/Patient/PatientHeader';
import ConfidenceScore from '../components/AI/ConfidenceScore';

export default function ImagingPage() {
  const { selectedPatient } = useClinicalStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    findings: string;
    abnormalities: string[];
    confidence: number;
    image_id: string;
    provider: string;
  } | null>(null);
  const [error, setError] = useState('');

  const onFile = useCallback(
    (f: File | null) => {
      setFile(f);
      setResult(null);
      setError('');
      if (preview) URL.revokeObjectURL(preview);
      setPreview(f ? URL.createObjectURL(f) : null);
    },
    [preview],
  );

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
      setError('Image analysis failed. Check backend / Vision model configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Medical Imaging
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload chest X-ray / CT for Vision AI findings — physician interpretation required.
      </Typography>

      {selectedPatient ? (
        <PatientHeader patient={selectedPatient} />
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Optional: select a patient to attach imaging to the chart.
        </Alert>
      )}

      <Card
        sx={{
          mb: 3,
          border: '2px dashed',
          borderColor: dragging ? 'primary.main' : 'divider',
          bgcolor: dragging ? 'rgba(26,79,140,0.04)' : 'background.paper',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f && f.type.startsWith('image/')) onFile(f);
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" gutterBottom>
            Upload Image
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag & drop JPG/PNG here, or choose a file
          </Typography>
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
            <Typography variant="body2" sx={{ mt: 2 }}>
              {file.name}
            </Typography>
          )}
        </CardContent>
      </Card>

      {(preview || result) && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Original Image
              </Typography>
              {preview && (
                <Box
                  component="img"
                  src={preview}
                  alt="Original"
                  sx={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 1, bgcolor: 'background.default' }}
                />
              )}
              <Button variant="contained" sx={{ mt: 2 }} onClick={analyze} disabled={!file || loading}>
                Analyze Image
              </Button>
              {loading && <CircularProgress size={22} sx={{ ml: 2, verticalAlign: 'middle' }} />}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                AI Findings
              </Typography>
              {!result && !loading && (
                <Typography color="text.secondary">Run analysis to view findings and confidence.</Typography>
              )}
              {loading && <Typography color="text.secondary">Analyzing imaging…</Typography>}
              {result && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Finding
                  </Typography>
                  <Typography variant="h4" color="primary.dark" sx={{ mb: 2 }}>
                    {result.abnormalities[0] || result.findings.slice(0, 80)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {result.findings}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Abnormalities
                  </Typography>
                  <Box sx={{ mt: 0.5, mb: 2 }}>
                    {result.abnormalities.length ? (
                      result.abnormalities.map((a) => (
                        <Chip key={a} label={a} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))
                    ) : (
                      <Chip label="None flagged" size="small" variant="outlined" />
                    )}
                  </Box>
                  <Box sx={{ maxWidth: 240 }}>
                    <ConfidenceScore value={result.confidence} />
                  </Box>
                  <Typography variant="caption" sx={{ mt: 2, display: 'block' }} color="text.secondary">
                    Provider: {result.provider} · Image ID: {result.image_id}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h5" color="primary.main" gutterBottom>
              Radiology Report
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Draft findings for radiologist / physician review. Attach image_id when running diagnosis.
            </Typography>
            <Alert severity="info">Physician review required before clinical use.</Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
