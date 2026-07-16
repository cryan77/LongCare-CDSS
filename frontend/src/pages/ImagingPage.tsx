import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  getPatientXrays,
  loadMockXrayFile,
  type PatientXrayStudy,
} from '../utils/patientXrays';

export default function ImagingPage() {
  const { selectedPatient } = useClinicalStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
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

  const studies = useMemo(
    () => (selectedPatient ? getPatientXrays(selectedPatient) : []),
    [selectedPatient],
  );

  const clearObjectUrl = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }, []);

  const onFile = useCallback(
    (f: File | null) => {
      setFile(f);
      setResult(null);
      setError('');
      setSelectedStudyId(null);
      clearObjectUrl(preview);
      setPreview(f ? URL.createObjectURL(f) : null);
    },
    [preview, clearObjectUrl],
  );

  const selectStudy = async (study: PatientXrayStudy) => {
    setError('');
    setResult(null);
    setSelectedStudyId(study.id);
    clearObjectUrl(preview);
    setPreview(study.src);
    try {
      const f = await loadMockXrayFile(study.filename);
      setFile(f);
    } catch {
      setError('Could not load mock X-ray file.');
      setFile(null);
    }
  };

  // Auto-select first patient study when patient changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedPatient) return;
      const list = getPatientXrays(selectedPatient);
      if (!list.length) return;
      const study = list[0];
      setError('');
      setResult(null);
      setSelectedStudyId(study.id);
      setPreview((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return study.src;
      });
      try {
        const f = await loadMockXrayFile(study.filename);
        if (!cancelled) setFile(f);
      } catch {
        if (!cancelled) {
          setError('Could not load mock X-ray file.');
          setFile(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPatient?.id]);

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
        Review patient chest X-rays from the mock study library, or upload a new image for Vision AI.
      </Typography>

      {selectedPatient ? (
        <PatientHeader patient={selectedPatient} />
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a patient to load their mock X-ray studies, or upload any image below.
        </Alert>
      )}

      {selectedPatient && studies.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" color="primary.main" gutterBottom>
              Patient X-Ray Studies
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Mock images from `/xrays` — click a study to analyze.
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
              }}
            >
              {studies.map((study) => {
                const selected = selectedStudyId === study.id;
                return (
                  <Box
                    key={study.id}
                    onClick={() => void selectStudy(study)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: 'background.default',
                      transition: 'border-color 120ms ease, box-shadow 120ms ease',
                      '&:hover': { borderColor: 'primary.light', boxShadow: '0 4px 14px rgba(15,47,84,0.12)' },
                    }}
                  >
                    <Box
                      component="img"
                      src={study.src}
                      alt={study.title}
                      sx={{
                        width: '100%',
                        height: 140,
                        objectFit: 'cover',
                        display: 'block',
                        bgcolor: '#0a0a0a',
                      }}
                    />
                    <Box sx={{ p: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {study.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {study.date} · {study.modality}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
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
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" gutterBottom>
            Upload Additional Image
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Optional — drag & drop JPG/PNG, or choose a file
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
          {file && !selectedStudyId && (
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
                  sx={{
                    width: '100%',
                    maxHeight: 420,
                    objectFit: 'contain',
                    borderRadius: 1,
                    bgcolor: '#0a0a0a',
                    display: 'block',
                  }}
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
