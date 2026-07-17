import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DescriptionIcon from '@mui/icons-material/Description';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ScienceIcon from '@mui/icons-material/Science';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { chatApi, docsApi } from '../api/client';
import { useAuthStore, useClinicalStore } from '../store';
import PatientAvatar from '../components/Patient/PatientAvatar';
import { labStatus, patientHistory } from '../components/Diagnosis/helpers';
import {
  CHAT_MODES,
  CLINICAL_SKILLS,
  MENTION_TOKENS,
  NURSE_CHIPS,
  PROMPT_CHIPS,
  SIMILAR_CASES,
  SLASH_COMMANDS,
  buildTimeline,
  inferTopic,
  modePrefix,
  structureReply,
  type ChatMode,
  type StructuredReply,
} from '../components/Chat/helpers';

interface Message {
  role: string;
  content: string;
  citations?: { source: string; excerpt: string }[];
  structured?: StructuredReply;
  topic?: string;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isNurse = user?.role === 'nurse';
  const {
    selectedPatient,
    lastDiagnosis,
    lastTreatment,
    encounterId,
    setLastDocumentId,
  } = useClinicalStore();

  const history = selectedPatient ? patientHistory(selectedPatient) : null;
  const diagnosisName = lastDiagnosis?.diagnosis[0]?.name;
  const confPct = lastDiagnosis ? Math.round(lastDiagnosis.confidence * (lastDiagnosis.confidence <= 1 ? 100 : 1)) : null;

  const welcome: Message = {
    role: 'assistant',
    content: isNurse
      ? 'Care Assistant ready. I help with vitals trends and when to notify the physician. I cannot diagnose or prescribe.'
      : selectedPatient
        ? `Clinical AI workspace loaded for ${selectedPatient.first_name} ${selectedPatient.last_name}. Ask about diagnosis reasoning, guidelines, labs, or documentation — patient context is already attached.`
        : 'Clinical AI workspace. Select a patient so answers stay grounded in the chart — this is not a general chatbot.',
    structured: structureReply(
      isNurse
        ? 'Care Assistant ready.\n• Vitals alerts\n• Escalation guidance\n• Medication timing reminders'
        : 'Ready for clinical questions.\n• Diagnosis reasoning\n• Guideline search\n• Documentation drafts',
    ),
  };

  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState<ChatMode>('clinical');
  const [topics, setTopics] = useState<string[]>([]);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [skillsAnchor, setSkillsAnchor] = useState<null | HTMLElement>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([welcome]);
    setTopics([]);
    setSavedNotes([]);
    setStatus('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when patient or role context changes
  }, [selectedPatient?.id, isNurse]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const labChips = useMemo(() => {
    const labs = history?.labs || {};
    return Object.entries(labs).map(([name, value]) => {
      const st = labStatus(name, value);
      return { name, label: `${name} ${st.label}`, tone: st.tone };
    });
  }, [history]);

  const evidenceSources = useMemo(() => {
    const fromDx = (lastDiagnosis?.evidence || []).map((e) => e.source);
    const fromTx = (lastTreatment?.guidelines || []).map((g) => g.source);
    const fromChat = messages.flatMap((m) => m.citations?.map((c) => c.source) || []);
    return [...new Set([...fromDx, ...fromTx, ...fromChat])].filter(Boolean).slice(0, 6);
  }, [lastDiagnosis, lastTreatment, messages]);

  const contextFlags = useMemo(
    () => [
      { label: 'Patient', on: !!selectedPatient },
      { label: 'Diagnosis', on: !!lastDiagnosis },
      { label: 'Labs', on: labChips.length > 0 },
      { label: 'Imaging', on: true },
      { label: 'Medication', on: !!(history?.medications?.length || lastTreatment) },
      { label: 'History', on: !!(history?.conditions?.length) },
    ],
    [selectedPatient, lastDiagnosis, labChips.length, history, lastTreatment],
  );

  const timeline = useMemo(() => buildTimeline(topics), [topics]);

  const chips = isNurse
    ? NURSE_CHIPS
    : PROMPT_CHIPS.filter((c) => !c.modes || c.modes.includes(mode));

  const sendText = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || loading) return;

    const userMsg = isNurse ? trimmed : modePrefix(mode, trimmed);
    setLastUserPrompt(userMsg);
    setInput('');
    setShowSlash(false);
    setShowMention(false);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, topic: inferTopic(userMsg) }]);
    setTopics((prev) => {
      const t = inferTopic(userMsg);
      return prev.includes(t) ? prev : [...prev, t];
    });
    setLoading(true);
    try {
      const response = await chatApi.send(userMsg, selectedPatient?.id);
      setMessages((prev) => [
        ...prev,
        {
          ...response,
          structured: structureReply(response.content, response.citations),
          topic: inferTopic(userMsg),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isNurse
            ? 'Unable to reach care assistant. Escalate urgent concerns to the attending physician.'
            : 'Unable to reach clinical knowledge agent.',
          structured: structureReply(
            isNurse
              ? 'Unable to reach care assistant.\n• Escalate urgent concerns to the attending.'
              : 'Unable to reach clinical knowledge agent.\n• Retry or use guideline search offline.',
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendText(input);

  const onInputChange = (value: string) => {
    setInput(value);
    const last = value.slice(-1);
    const slash = /(^|\s)\/[\w-]*$/.test(value);
    const mention = /(^|\s)@[\w\s-]*$/.test(value);
    setShowSlash(slash || last === '/');
    setShowMention(mention || last === '@');
  };

  const applySlash = (_cmd: string, prompt: string) => {
    setShowSlash(false);
    setInput('');
    void sendText(prompt);
  };

  const applyMention = (insert: string) => {
    setShowMention(false);
    setInput((prev) => {
      const replaced = prev.replace(/(^|\s)@[\w\s-]*$/, `$1${insert} `);
      return replaced === prev ? `${prev}${insert} ` : replaced;
    });
  };

  const copyMsg = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied to clipboard.');
    } catch {
      setStatus('Could not copy.');
    }
  };

  const saveNote = (text: string) => {
    setSavedNotes((prev) => [text.slice(0, 280), ...prev].slice(0, 8));
    setStatus('Saved to session notes.');
  };

  const generateDoc = async (docType: string) => {
    if (!encounterId) {
      void sendText(
        docType === 'soap'
          ? 'Draft a SOAP note for this encounter using available patient context.'
          : `Draft a ${docType} for this patient using available clinical context.`,
      );
      return;
    }
    try {
      const doc = await docsApi.generate(encounterId, docType);
      setLastDocumentId(doc.id);
      setStatus(`${docType.toUpperCase()} draft generated — open Reports to review.`);
      setTopics((prev) => (prev.includes('SOAP / Documentation') ? prev : [...prev, 'SOAP / Documentation']));
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Generated ${docType} draft (document #${doc.id}). Open Reports to review and approve.`,
          structured: structureReply(
            `Documentation draft ready.\n• Type: ${docType}\n• Document ID: ${doc.id}\n• Review required before signing`,
            [{ source: 'Documentation agent', excerpt: 'Physician review required' }],
          ),
        },
      ]);
    } catch {
      void sendText(`Please draft a ${docType} for this encounter.`);
    }
  };

  const doctorLabel = isNurse ? 'Care Assistant' : 'Clinical AI Assistant';

  return (
    <Box>
      {/* Header */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/workspace')} sx={{ mt: 0.5 }}>
              Back
            </Button>
            <Box>
              <Typography variant="h3" color="primary.dark">
                {doctorLabel}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isNurse
                  ? 'Vitals alerts and escalation guidance — not for diagnosis or prescribing.'
                  : 'Patient-aware clinical copilot with guidelines, reasoning, and documentation.'}
              </Typography>
            </Box>
          </Box>
          {selectedPatient ? (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <PatientAvatar patient={selectedPatient} size={44} />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  MRN {selectedPatient.mrn}
                  {diagnosisName ? ` · ${diagnosisName}` : ''}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Select a patient to ground answers in chart context.
            </Alert>
          )}
        </Box>
      </Box>

      {isNurse && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Nurses cannot approve diagnoses or prescribe medications.
        </Alert>
      )}
      {status && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setStatus('')}>
          {status}
        </Alert>
      )}

      {/* Mode selector */}
      {!isNurse && (
        <Card sx={{ mb: 2 }}>
          <Tabs
            value={mode}
            onChange={(_, v: ChatMode) => setMode(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {CHAT_MODES.map((m) => (
              <Tab key={m.id} value={m.id} label={m.label} />
            ))}
          </Tabs>
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              {CHAT_MODES.find((m) => m.id === mode)?.hint}
            </Typography>
          </Box>
        </Card>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', xl: '0.85fr 1.4fr 0.85fr' },
          alignItems: 'start',
        }}
      >
        {/* LEFT — Patient context */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Patient Context
              </Typography>
              {selectedPatient ? (
                <>
                  <Typography variant="h4" color="primary.dark">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {selectedPatient.age} Years · {selectedPatient.gender}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Diagnosis
                  </Typography>
                  <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
                    {diagnosisName || 'Not assessed in this session'}
                    {confPct != null ? ` (${confPct}%)` : ''}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Symptoms / complaint
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {history?.prior_encounters?.[0]?.complaint ||
                      (history?.conditions?.[0] ? `${history.conditions[0]} follow-up` : '—')}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Labs
                  </Typography>
                  {labChips.length ? (
                    labChips.map((l) => (
                      <Chip
                        key={l.name}
                        size="small"
                        label={l.label}
                        color={l.tone === 'default' ? 'default' : l.tone}
                        sx={{ mr: 0.5, mb: 0.5 }}
                        variant={l.tone === 'success' ? 'outlined' : 'filled'}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      No labs on file
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, mb: 0.5 }}>
                    Allergies
                  </Typography>
                  {selectedPatient.allergies.length ? (
                    selectedPatient.allergies.map((a) => (
                      <Chip
                        key={a}
                        size="small"
                        color="error"
                        icon={<WarningAmberIcon />}
                        label={a}
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))
                  ) : (
                    <Chip size="small" color="success" variant="outlined" label="NKDA" />
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, mb: 0.5 }}>
                    Current Medication
                  </Typography>
                  {(history?.medications || []).length ? (
                    (history?.medications || []).map((m) => (
                      <Typography key={m} variant="body2" sx={{ mb: 0.25 }}>
                        {m}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      None listed
                    </Typography>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">No patient selected — AI answers will be less specific.</Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Encounter Timeline
              </Typography>
              {[
                { label: 'Admission / visit open', on: !!selectedPatient },
                { label: 'Labs available', on: labChips.length > 0 },
                { label: 'Imaging context', on: !!selectedPatient },
                { label: 'Diagnosis', on: !!lastDiagnosis },
                { label: 'Treatment', on: !!lastTreatment },
              ].map((step) => (
                <Typography key={step.label} variant="body2" sx={{ mb: 0.5, color: step.on ? 'text.primary' : 'text.disabled' }}>
                  {step.on ? '●' : '○'} {step.label}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Stack>

        {/* CENTER — Conversation */}
        <Stack spacing={2}>
          <Card sx={{ minHeight: 520, display: 'flex', flexDirection: 'column' }}>
            <CardContent ref={scrollRef} sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 480 }}>
              {messages.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      maxWidth: '92%',
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default',
                      color: msg.role === 'user' ? 'white' : 'text.primary',
                      border: msg.role === 'user' ? 'none' : '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    {msg.role === 'user' ? (
                      <>
                        <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mb: 0.5 }}>
                          {isNurse ? 'Nurse' : 'Doctor'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </Typography>
                      </>
                    ) : (
                      <AiStructuredMessage
                        msg={msg}
                        onCopy={() => copyMsg(msg.content)}
                        onRegenerate={() => lastUserPrompt && sendText(lastUserPrompt)}
                        onSave={() => saveNote(msg.content)}
                        onReport={() => generateDoc('soap')}
                        onNext={(q) => sendText(q)}
                        showToolbar={i > 0}
                      />
                    )}
                  </Paper>
                </Box>
              ))}
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="caption" color="text.secondary">
                    Clinical reasoning…
                  </Typography>
                </Box>
              )}
            </CardContent>

            {/* Prompt suggestions */}
            <Box sx={{ px: 2, pb: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, mb: 0.75 }}>
                Suggested questions
              </Typography>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {chips.map((c) => (
                  <Chip
                    key={c.label}
                    size="small"
                    label={c.label}
                    onClick={() => sendText(c.prompt)}
                    variant="outlined"
                    disabled={loading}
                  />
                ))}
              </Stack>
            </Box>

            {/* Composer */}
            <Box sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider', position: 'relative' }}>
              <Collapse in={showSlash && !isNurse}>
                <Paper variant="outlined" sx={{ mb: 1, maxHeight: 180, overflow: 'auto' }}>
                  <List dense disablePadding>
                    {SLASH_COMMANDS.filter((s) => !input || s.cmd.includes(input.trim().split(/\s+/).pop() || ''))
                      .map((s) => (
                        <ListItemButton key={s.cmd} onClick={() => applySlash(s.cmd, s.prompt)}>
                          <ListItemText primary={s.cmd} secondary={s.prompt} />
                        </ListItemButton>
                      ))}
                  </List>
                </Paper>
              </Collapse>
              <Collapse in={showMention && !isNurse}>
                <Paper variant="outlined" sx={{ mb: 1 }}>
                  <List dense disablePadding>
                    {MENTION_TOKENS.map((m) => (
                      <ListItemButton key={m.token} onClick={() => applyMention(m.insert)}>
                        <ListItemText primary={m.token} />
                      </ListItemButton>
                    ))}
                  </List>
                </Paper>
              </Collapse>

              <TextField
                fullWidth
                size="small"
                multiline
                maxRows={4}
                placeholder={
                  isNurse
                    ? 'Ask about vitals, escalation, or medication timing…'
                    : 'Ask a clinical question… (type / for commands, @ to mention context)'
                }
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, gap: 1, flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Attach note / file">
                    <IconButton size="small" onClick={() => fileRef.current?.click()}>
                      <AttachFileIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Voice input (demo)">
                    <IconButton size="small" onClick={() => setStatus('Voice input is a demo control in this build.')}>
                      <MicIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Discuss medical image">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setStatus('Imaging context noted — ask about chest X-ray findings.');
                        setInput((p) => (p.includes('@Chest X-Ray') ? p : `${p} @Chest X-Ray `.trimStart()));
                      }}
                    >
                      <ImageIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!isNurse && (
                    <>
                      <Tooltip title="Insert latest labs">
                        <IconButton
                          size="small"
                          onClick={() => applyMention('@Lab Results')}
                        >
                          <ScienceIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clinical skills">
                        <IconButton size="small" onClick={(e) => setSkillsAnchor(e.currentTarget)}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf,.txt"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setStatus(`Attached ${f.name} for discussion.`);
                        void sendText(`Please review the attached clinical file context: ${f.name}`);
                      }
                      e.target.value = '';
                    }}
                  />
                </Stack>
                <Button variant="contained" endIcon={<SendIcon />} onClick={send} disabled={loading || !input.trim()}>
                  Send
                </Button>
              </Box>
            </Box>
          </Card>

          {/* Bottom quick actions */}
          {!isNurse && (
            <Card>
              <CardContent>
                <Typography variant="h5" color="primary.main" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined" startIcon={<DescriptionIcon />} onClick={() => generateDoc('soap')}>
                    Generate SOAP
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => generateDoc('referral')}>
                    Generate Referral
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => sendText('Generate a prescription summary from the current treatment plan.')}
                  >
                    Generate Prescription
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => sendText('Summarize this visit for handoff.')}>
                    Generate Summary
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setMode('education');
                      void sendText('Generate patient instructions in plain language for clinician review.');
                    }}
                  >
                    Patient Instructions
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>

        {/* RIGHT — AI Insights */}
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Evidence
              </Typography>
              {evidenceSources.length ? (
                evidenceSources.map((s, i) => (
                  <Box key={s} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2">{s}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {'★'.repeat(Math.max(3, 5 - Math.min(i, 2)))}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ask a clinical question to retrieve guideline citations.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Similar Patients
              </Typography>
              {SIMILAR_CASES.map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    py: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography sx={{ fontWeight: 650 }}>Case #{c.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.similarity}% similar · {c.outcome}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Context Loaded
              </Typography>
              {contextFlags.map((f) => (
                <Typography
                  key={f.label}
                  variant="body2"
                  sx={{ mb: 0.5, color: f.on ? 'success.dark' : 'text.disabled' }}
                >
                  {f.on ? '✓' : '○'} {f.label}
                </Typography>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Conversation Summary
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Discussed
              </Typography>
              {topics.length ? (
                topics.map((t) => (
                  <Typography key={t} variant="body2" sx={{ mb: 0.25 }}>
                    • {t}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Nothing yet this session
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Pending
              </Typography>
              <Typography variant="body2">
                {topics.some((t) => t.includes('SOAP')) ? 'Review generated documentation' : 'Discharge summary (optional)'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Today
              </Typography>
              {timeline.map((e) => (
                <Box key={`${e.time}-${e.label}`} sx={{ display: 'flex', gap: 1.5, mb: 0.75 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56 }}>
                    {e.time}
                  </Typography>
                  <Typography variant="body2">{e.label}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          {savedNotes.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h5" color="primary.main" gutterBottom>
                  Saved Notes
                </Typography>
                {savedNotes.map((n, i) => (
                  <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {n}
                    {n.length >= 280 ? '…' : ''}
                  </Typography>
                ))}
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      <Menu anchorEl={skillsAnchor} open={Boolean(skillsAnchor)} onClose={() => setSkillsAnchor(null)}>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Clinical Skills
          </Typography>
        </MenuItem>
        {CLINICAL_SKILLS.map((s) => (
          <MenuItem
            key={s.label}
            onClick={() => {
              setSkillsAnchor(null);
              void sendText(s.prompt);
            }}
          >
            <ListItemText primary={s.label} />
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            setSkillsAnchor(null);
            applyMention('@Diagnosis');
          }}
        >
          <MenuBookIcon fontSize="small" sx={{ mr: 1 }} /> Insert @Diagnosis
        </MenuItem>
      </Menu>
    </Box>
  );
}

function AiStructuredMessage({
  msg,
  onCopy,
  onRegenerate,
  onSave,
  onReport,
  onNext,
  showToolbar,
}: {
  msg: Message;
  onCopy: () => void;
  onRegenerate: () => void;
  onSave: () => void;
  onReport: () => void;
  onNext: (q: string) => void;
  showToolbar: boolean;
}) {
  const s = msg.structured || structureReply(msg.content, msg.citations);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
        AI · Answer
      </Typography>

      <Typography variant="overline" color="text.secondary">
        Summary
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
        {s.summary}
      </Typography>

      {s.reasoning.length > 0 && (
        <>
          <Typography variant="overline" color="text.secondary">
            Reasoning
          </Typography>
          {s.reasoning.map((r) => (
            <Typography key={r} variant="body2" sx={{ mb: 0.35 }}>
              • {r}
            </Typography>
          ))}
        </>
      )}

      {(s.evidence.length > 0 || (msg.citations && msg.citations.length > 0)) && (
        <Box sx={{ mt: 1.25 }}>
          <Typography variant="overline" color="text.secondary">
            Evidence
          </Typography>
          <Box sx={{ mt: 0.25 }}>
            {(msg.citations?.length ? msg.citations.map((c) => c.source) : s.evidence).map((src) => (
              <Chip key={src} label={src} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
            ))}
          </Box>
        </Box>
      )}

      {s.confidence && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Confidence: <Box component="span" sx={{ fontWeight: 700 }}>{s.confidence}</Box>
        </Typography>
      )}

      {s.nextQuestion && showToolbar && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Next suggested question
          </Typography>
          <Chip
            size="small"
            label={s.nextQuestion}
            onClick={() => onNext(s.nextQuestion!)}
            sx={{ display: 'flex', mt: 0.5, height: 'auto', py: 0.75, '& .MuiChip-label': { whiteSpace: 'normal' } }}
            variant="outlined"
            color="primary"
          />
        </Box>
      )}

      {showToolbar && (
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          <Tooltip title="Copy">
            <IconButton size="small" onClick={onCopy}>
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Regenerate">
            <IconButton size="small" onClick={onRegenerate}>
              <RefreshIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save to notes">
            <IconButton size="small" onClick={onSave}>
              <BookmarkBorderIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Create report">
            <IconButton size="small" onClick={onReport}>
              <DescriptionIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add to notes">
            <IconButton size="small" onClick={onSave}>
              <NoteAddIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Box>
  );
}
