import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Slider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PanToolIcon from '@mui/icons-material/PanTool';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import StraightenIcon from '@mui/icons-material/Straighten';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CompareIcon from '@mui/icons-material/Compare';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { chatApi, imagingApi } from '../api/client';
import { useClinicalStore } from '../store';
import PatientAvatar from '../components/Patient/PatientAvatar';
import { labStatus, patientHistory } from '../components/Diagnosis/helpers';
import {
  getPatientXrays,
  loadMockXrayFile,
  type PatientXrayStudy,
} from '../utils/patientXrays';
import {
  anatomyStatuses,
  buildReport,
  confidencePercent,
  explanationFor,
  findingScores,
  imagingDifferentials,
  primaryFinding,
  qualityAssessment,
  recommendationsFor,
  severityFor,
  type ImagingResult,
} from '../components/Imaging/helpers';

type Overlay = 'original' | 'heatmap' | 'segmentation' | 'boxes';
type RightTab = 'findings' | 'correlation' | 'recommendations' | 'report' | 'chat';

export default function ImagingPage() {
  const navigate = useNavigate();
  const { selectedPatient, lastDiagnosis } = useClinicalStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImagingResult | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>('original');
  const [compare, setCompare] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>('findings');
  const [activeRegion, setActiveRegion] = useState('');
  const [approved, setApproved] = useState(false);
  const [report, setReport] = useState('');
  const [reportEditing, setReportEditing] = useState(false);
  const [chatInput, setChatInput] = useState('Why is this finding clinically significant?');
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const studies = useMemo(
    () => (selectedPatient ? getPatientXrays(selectedPatient) : []),
    [selectedPatient],
  );
  const selectedStudy = studies.find((s) => s.id === selectedStudyId) || studies[0];
  const previousStudy = studies.find((s) => s.id !== selectedStudyId);
  const history = selectedPatient ? patientHistory(selectedPatient) : null;
  const scores = findingScores(result);
  const anatomy = anatomyStatuses(result);
  const differentials = imagingDifferentials(result);
  const explanations = explanationFor(result);
  const recommendations = recommendationsFor(result);
  const confidence = confidencePercent(result?.confidence);

  const clearObjectUrl = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }, []);

  const resetViewer = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setPanMode(false);
    setOverlay('original');
  };

  const onFile = useCallback(
    (nextFile: File | null) => {
      setFile(nextFile);
      setResult(null);
      setReport('');
      setError('');
      setStatus('');
      setSelectedStudyId(null);
      clearObjectUrl(preview);
      setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
      resetViewer();
    },
    [preview, clearObjectUrl],
  );

  const selectStudy = async (study: PatientXrayStudy) => {
    setError('');
    setStatus('');
    setResult(null);
    setReport('');
    setSelectedStudyId(study.id);
    clearObjectUrl(preview);
    setPreview(study.src);
    resetViewer();
    try {
      setFile(await loadMockXrayFile(study.filename));
    } catch {
      setError('Could not load mock X-ray file.');
      setFile(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!selectedPatient) return;
      const study = getPatientXrays(selectedPatient)[0];
      if (!study) return;
      setSelectedStudyId(study.id);
      setPreview((old) => {
        if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
        return study.src;
      });
      setResult(null);
      setReport('');
      resetViewer();
      try {
        const loaded = await loadMockXrayFile(study.filename);
        if (!cancelled) setFile(loaded);
      } catch {
        if (!cancelled) setError('Could not load mock X-ray file.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPatient?.id]);

  useEffect(() => {
    if (result) {
      setReport(buildReport(result, selectedStudy?.title || 'Chest X-Ray'));
      setRightTab('findings');
    }
  }, [result, selectedStudy?.title]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setStatus('');
    setApproved(false);
    try {
      const form = new FormData();
      form.append('file', file);
      if (selectedPatient) form.append('patient_id', String(selectedPatient.id));
      setResult(await imagingApi.analyze(form));
      setStatus('AI analysis complete — radiologist or physician review required.');
    } catch {
      setError('Image analysis failed. Check backend / Vision model configuration.');
    } finally {
      setLoading(false);
    }
  };

  const askAi = async () => {
    const question = chatInput.trim();
    if (!question) return;
    setChatInput('');
    setChatMessages((old) => [...old, { role: 'user', content: question }]);
    setChatLoading(true);
    try {
      const context = result
        ? `Imaging context: ${result.findings}. Abnormalities: ${result.abnormalities.join(', ')}. `
        : '';
      const reply = await chatApi.send(`${context}${question}`, selectedPatient?.id);
      setChatMessages((old) => [...old, { role: 'assistant', content: reply.content }]);
    } catch {
      setChatMessages((old) => [
        ...old,
        { role: 'assistant', content: 'Unable to reach the clinical imaging assistant.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const fullscreen = () => {
    void viewerRef.current?.requestFullscreen?.();
  };

  const patientName = selectedPatient
    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
    : 'No patient selected';
  const imageFilter = `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 1 : 0})`;

  return (
    <Box>
      {/* Workstation header */}
      <Box
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/workspace')}>
              Back
            </Button>
            {selectedPatient && <PatientAvatar patient={selectedPatient} size={48} />}
            <Box>
              <Typography variant="h3" color="primary.dark">
                Imaging › {selectedStudy?.title || 'Chest X-Ray'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patientName}
                {selectedPatient ? ` · MRN ${selectedPatient.mrn}` : ''}
                {selectedStudy ? ` · ${selectedStudy.date}` : ''}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip
              label={loading ? 'AI Analyzing' : result ? 'AI Analysis Complete' : 'Awaiting Analysis'}
              color={result ? 'success' : loading ? 'warning' : 'default'}
              variant="outlined"
            />
            <Chip label={approved ? 'Reviewed' : 'Radiologist Pending'} variant="outlined" />
            <Button
              size="small"
              variant="outlined"
              startIcon={<CompareIcon />}
              disabled={!previousStudy}
              onClick={() => setCompare((v) => !v)}
            >
              Compare Previous
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<DescriptionIcon />}
              disabled={!result}
              onClick={() => {
                setRightTab('report');
                setStatus('Radiology report draft prepared for review.');
              }}
            >
              Generate Report
            </Button>
          </Stack>
        </Box>
      </Box>

      {!selectedPatient && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select a patient for clinical correlation, or upload an image for standalone analysis.
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {status && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setStatus('')}>{status}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '0.72fr 1.75fr 0.9fr' },
          alignItems: 'start',
        }}
      >
        {/* LEFT — Patient and study */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>Patient & Study</Typography>
              {selectedPatient ? (
                <>
                  <Typography variant="h4" color="primary.dark">{patientName}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {selectedPatient.gender} · {selectedPatient.age} Years · MRN {selectedPatient.mrn}
                  </Typography>
                  <ContextBlock title="Clinical Indication">
                    {history?.prior_encounters?.[0]?.complaint ||
                      lastDiagnosis?.diagnosis[0]?.name ||
                      'Chest symptoms / clinical correlation'}
                  </ContextBlock>
                  <ContextBlock title="Known Conditions">
                    {(history?.conditions || []).slice(0, 4).join(' · ') || 'None listed'}
                  </ContextBlock>
                  <ContextBlock title="Allergies">
                    {selectedPatient.allergies.join(' · ') || 'NKDA'}
                  </ContextBlock>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">No patient context loaded.</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>Study Library</Typography>
              {studies.map((study) => (
                <Box
                  key={study.id}
                  onClick={() => void selectStudy(study)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '68px 1fr',
                    gap: 1,
                    p: 0.75,
                    mb: 1,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedStudyId === study.id ? 'primary.main' : 'divider',
                    bgcolor: selectedStudyId === study.id ? 'primary.50' : 'transparent',
                  }}
                >
                  <Box component="img" src={study.src} alt="" sx={{ width: 68, height: 55, objectFit: 'cover', bgcolor: '#000' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 650 }}>{study.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{study.date} · {study.modality}</Typography>
                  </Box>
                </Box>
              ))}
              <Button fullWidth variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ mt: 1 }}>
                Upload Image
                <input type="file" hidden accept="image/jpeg,image/png,image/jpg" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>Imaging Timeline</Typography>
              {studies.slice().reverse().map((study, i) => (
                <Box key={study.id} sx={{ display: 'flex', gap: 1, mb: 0.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 76 }}>{study.date}</Typography>
                  <Typography variant="body2">{i === studies.length - 1 ? 'Current study' : study.title}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Stack>

        {/* CENTER — Image viewer */}
        <Stack spacing={2}>
          <Card>
            <Box sx={{ px: 1.5, py: 1, display: 'flex', gap: 0.25, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
              <ViewerButton title="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + 0.2))}><ZoomInIcon /></ViewerButton>
              <ViewerButton title="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}><ZoomOutIcon /></ViewerButton>
              <ViewerButton title="Pan mode" active={panMode} onClick={() => setPanMode((v) => !v)}><PanToolIcon /></ViewerButton>
              <ViewerButton title="Reset viewer" onClick={resetViewer}><RestartAltIcon /></ViewerButton>
              <ViewerButton title="Invert" active={invert} onClick={() => setInvert((v) => !v)}><InvertColorsIcon /></ViewerButton>
              <ViewerButton title="Measurements" onClick={() => setStatus('Measurement tool enabled (visual demo).')}><StraightenIcon /></ViewerButton>
              <ViewerButton title="Fullscreen" onClick={fullscreen}><FullscreenIcon /></ViewerButton>
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                Zoom {Math.round(zoom * 100)}%
              </Typography>
            </Box>

            <Box
              ref={viewerRef}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped?.type.startsWith('image/')) onFile(dropped);
              }}
              sx={{
                position: 'relative',
                height: { xs: 460, md: 650 },
                overflow: 'hidden',
                bgcolor: '#050708',
                border: dragging ? '3px dashed #4da3ff' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: panMode ? 'grab' : 'default',
              }}
            >
              {preview ? (
                <>
                  <Box
                    component="img"
                    src={preview}
                    alt="Current chest X-ray"
                    sx={{
                      maxWidth: compare ? '49%' : '96%',
                      maxHeight: '96%',
                      objectFit: 'contain',
                      filter: imageFilter,
                      transform: `scale(${zoom})`,
                      transition: 'transform 120ms ease, filter 120ms ease',
                    }}
                  />
                  {compare && previousStudy && (
                    <Box
                      component="img"
                      src={previousStudy.src}
                      alt="Prior chest X-ray"
                      sx={{ maxWidth: '49%', maxHeight: '96%', objectFit: 'contain', filter: imageFilter, transform: `scale(${zoom})` }}
                    />
                  )}
                  {overlay !== 'original' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: compare ? '24%' : '50%',
                        top: '54%',
                        width: overlay === 'boxes' ? 150 : 210,
                        height: overlay === 'boxes' ? 120 : 180,
                        transform: 'translate(-50%, -50%)',
                        border: overlay === 'boxes' ? '3px solid #ffca28' : 'none',
                        borderRadius: overlay === 'segmentation' ? '45%' : 3,
                        bgcolor: overlay === 'heatmap' ? 'rgba(255, 82, 30, .28)' : overlay === 'segmentation' ? 'rgba(20, 160, 255, .22)' : 'transparent',
                        boxShadow: overlay === 'heatmap' ? '0 0 55px 25px rgba(255, 80, 20, .35)' : 'none',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {activeRegion && (
                    <Chip
                      label={`${activeRegion} highlighted`}
                      color="warning"
                      sx={{ position: 'absolute', top: 12, right: 12 }}
                    />
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', color: 'grey.400' }}>
                  <CloudUploadIcon sx={{ fontSize: 52 }} />
                  <Typography>Drop a JPG/PNG image here or select a study.</Typography>
                </Box>
              )}
            </Box>

            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Brightness</Typography>
                  <Slider size="small" value={brightness} min={40} max={180} onChange={(_, v) => setBrightness(v as number)} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Contrast / Window Level</Typography>
                  <Slider size="small" value={contrast} min={40} max={180} onChange={(_, v) => setContrast(v as number)} />
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">AI Layers</Typography>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                {([
                  ['original', 'Original'],
                  ['heatmap', 'AI Heatmap'],
                  ['segmentation', 'Segmentation'],
                  ['boxes', 'Bounding Boxes'],
                ] as [Overlay, string][]).map(([id, label]) => (
                  <Chip key={id} label={label} size="small" clickable color={overlay === id ? 'primary' : 'default'} variant={overlay === id ? 'filled' : 'outlined'} onClick={() => setOverlay(id)} />
                ))}
              </Stack>
              <Button variant="contained" sx={{ mt: 2 }} onClick={analyze} disabled={!file || loading}>
                Analyze Image
              </Button>
              {loading && <CircularProgress size={22} sx={{ ml: 2, verticalAlign: 'middle' }} />}
            </CardContent>
          </Card>

          {compare && previousStudy && (
            <Card>
              <CardContent>
                <Typography variant="h5" color="primary.main" gutterBottom>Previous Study Comparison</Typography>
                <Typography variant="body2"><b>Previous:</b> {previousStudy.date} → <b>Current:</b> {selectedStudy?.date}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>• Opacity / detected finding: assess for interval change</Typography>
                <Typography variant="body2">• Pleural fluid: correlate with AI findings</Typography>
                <Typography variant="body2">• Heart size: compare as stable or changed</Typography>
                <Alert severity="info" sx={{ mt: 1 }}>Zoom, window level, and contrast are synchronized across both images.</Alert>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>AI Processing Timeline</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                {['Upload', 'Preprocessing', 'Lung Segmentation', 'Finding Detection', 'Clinical Correlation', 'Report Generation'].map((step, i) => (
                  <Chip key={step} icon={result || (loading && i < 3) ? <CheckCircleIcon /> : undefined} label={step} color={result ? 'success' : loading && i < 3 ? 'warning' : 'default'} variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Stack>

        {/* RIGHT — Findings and actions */}
        <Stack spacing={2}>
          <Card>
            <Tabs value={rightTab} onChange={(_, v: RightTab) => setRightTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab value="findings" label="Findings" />
              <Tab value="correlation" label="Context" />
              <Tab value="recommendations" label="Next Steps" />
              <Tab value="report" label="Report" />
              <Tab value="chat" label="Chat" />
            </Tabs>
            <CardContent>
              {rightTab === 'findings' && (
                <>
                  <Box sx={{ p: 1.5, borderRadius: 2, border: '2px solid', borderColor: result ? 'warning.main' : 'divider', mb: 2 }}>
                    <Typography variant="overline" color="text.secondary">Primary Finding</Typography>
                    <Typography variant="h4" color="primary.dark">{primaryFinding(result)}</Typography>
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`Confidence ${confidence}%`} color={confidence >= 85 ? 'warning' : 'default'} />
                      <Chip size="small" label={`Severity ${result ? severityFor(result.confidence) : '—'}`} variant="outlined" />
                    </Stack>
                  </Box>

                  <SectionTitle>Detected Findings</SectionTitle>
                  {result ? (
                    <>
                      {result.abnormalities.map((finding) => <Typography key={finding} variant="body2" sx={{ mb: 0.5 }}>✓ {finding}</Typography>)}
                      {!result.abnormalities.length && <Typography variant="body2">No abnormality flagged.</Typography>}
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}>{result.findings}</Typography>
                    </>
                  ) : <Typography variant="body2" color="text.secondary">Run analysis to populate findings.</Typography>}

                  <SectionTitle>Anatomical Regions</SectionTitle>
                  {anatomy.map((item) => (
                    <Box key={item.region} onClick={() => setActiveRegion(item.region)} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, cursor: 'pointer' }}>
                      <Typography variant="body2">{item.region}</Typography>
                      <Chip size="small" label={item.abnormal ? 'Abnormal' : 'Normal'} color={item.abnormal ? 'warning' : 'success'} variant="outlined" />
                    </Box>
                  ))}

                  <SectionTitle>AI Explanation</SectionTitle>
                  {explanations.map((line) => <Typography key={line} variant="body2" sx={{ mb: 0.5 }}>• {line}</Typography>)}

                  <SectionTitle>Confidence Chart</SectionTitle>
                  {scores.map((item) => <ScoreBar key={item.name} label={item.name} score={item.score} />)}

                  <SectionTitle>Possible Diagnoses</SectionTitle>
                  {differentials.map((item) => <ScoreBar key={item.name} label={item.name} score={item.score} />)}
                </>
              )}

              {rightTab === 'correlation' && (
                <>
                  <SectionTitle>Clinical Correlation</SectionTitle>
                  <Typography variant="caption" color="text.secondary">Symptoms / indication</Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>{history?.prior_encounters?.[0]?.complaint || 'Clinical indication not recorded'}</Typography>
                  <Typography variant="caption" color="text.secondary">Laboratory</Typography>
                  {Object.entries(history?.labs || {}).slice(0, 6).map(([name, value]) => {
                    const state = labStatus(name, value);
                    return <Chip key={name} size="small" label={`${name}: ${String(value)} (${state.label})`} color={state.tone === 'default' ? 'default' : state.tone} sx={{ mr: 0.5, mb: 0.5 }} />;
                  })}
                  <Alert severity={result?.abnormalities.length ? 'warning' : 'info'} sx={{ mt: 1.5 }}>
                    {result?.abnormalities.length
                      ? 'Imaging findings require correlation with symptoms, inflammatory markers, and examination.'
                      : 'AI assessment is not a radiologist diagnosis.'}
                  </Alert>

                  <SectionTitle>Image Quality</SectionTitle>
                  {qualityAssessment().map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>{item.value}</Typography>
                    </Box>
                  ))}
                </>
              )}

              {rightTab === 'recommendations' && (
                <>
                  <SectionTitle>Suggested Next Steps</SectionTitle>
                  {recommendations.map((item) => (
                    <Box key={item.action} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>{item.action}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.timing}</Typography>
                    </Box>
                  ))}
                  <Alert severity="info" sx={{ mt: 2 }}>Recommendations are decision support only and require clinician review.</Alert>
                </>
              )}

              {rightTab === 'report' && (
                <>
                  <SectionTitle>Radiology Report</SectionTitle>
                  <TextField
                    fullWidth
                    multiline
                    minRows={13}
                    value={report || buildReport(result, selectedStudy?.title || 'Chest X-Ray')}
                    onChange={(e) => setReport(e.target.value)}
                    slotProps={{ htmlInput: { readOnly: !reportEditing } }}
                  />
                  <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={() => setReport(buildReport(result, selectedStudy?.title || 'Chest X-Ray'))}>Generate</Button>
                    <Button size="small" variant="outlined" onClick={() => setReportEditing((v) => !v)}>{reportEditing ? 'Finish Edit' : 'Edit'}</Button>
                    <Button size="small" variant="contained" color="success" disabled={!result} onClick={() => { setApproved(true); setStatus('Radiology report approved for downstream workflow.'); }}>Approve</Button>
                    <Button size="small" variant="outlined" onClick={() => window.print()}>Export PDF</Button>
                  </Stack>
                </>
              )}

              {rightTab === 'chat' && (
                <>
                  <SectionTitle>Clinical AI Chat</SectionTitle>
                  <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 1 }}>
                    {chatMessages.length ? chatMessages.map((message, i) => (
                      <Box key={i} sx={{ p: 1, mb: 1, borderRadius: 1, bgcolor: message.role === 'user' ? 'primary.50' : 'background.default', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary">{message.role === 'user' ? 'Doctor' : 'AI'}</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
                      </Box>
                    )) : <Typography variant="body2" color="text.secondary">Ask about the current image and clinical correlation.</Typography>}
                  </Box>
                  <TextField fullWidth size="small" multiline maxRows={3} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void askAi(); } }} />
                  <Button fullWidth variant="contained" endIcon={<SendIcon />} sx={{ mt: 1 }} disabled={chatLoading || !chatInput.trim()} onClick={() => void askAi()}>
                    Ask AI
                  </Button>
                  {chatLoading && <LinearProgress sx={{ mt: 1 }} />}
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>

      {/* Bottom action bar */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="contained" color="success" disabled={!result} startIcon={<CheckCircleIcon />} onClick={() => { setApproved(true); setStatus('AI findings approved by clinician.'); }}>
              Approve Findings
            </Button>
            <Button variant="outlined" startIcon={<WarningAmberIcon />} onClick={() => setStatus('Radiologist review requested.')}>Request Radiologist Review</Button>
            <Button variant="outlined" disabled={!result} onClick={() => setRightTab('report')}>Generate Report</Button>
            <Button variant="outlined" disabled={!previousStudy} onClick={() => setCompare((v) => !v)}>Compare Study</Button>
            <Button variant="outlined" onClick={() => setStatus('Secure share link prepared (demo).')}>Share</Button>
            <Button variant="outlined" onClick={() => window.print()}>Export</Button>
            <Button variant="outlined" disabled={!approved} onClick={() => setStatus('Approved report queued for EHR / PACS handoff.')}>Send to EHR</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function ContextBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ py: 1, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary">{title}</Typography>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Typography variant="h5" color="primary.main" sx={{ mt: 2, mb: 1 }}>{children}</Typography>;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{score}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={score} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}

function ViewerButton({
  title,
  children,
  onClick,
  active = false,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip title={title}>
      <IconButton size="small" color={active ? 'primary' : 'default'} onClick={onClick}>{children}</IconButton>
    </Tooltip>
  );
}
