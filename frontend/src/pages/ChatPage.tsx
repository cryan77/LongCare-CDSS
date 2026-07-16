import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { chatApi } from '../api/client';
import { useClinicalStore } from '../store';
import PatientHeader from '../components/Patient/PatientHeader';

interface Message {
  role: string;
  content: string;
  citations?: { source: string; excerpt: string }[];
}

export default function ChatPage() {
  const { selectedPatient } = useClinicalStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Clinical AI Assistant — ask guideline-backed questions in the context of the selected patient. Sources will be cited. Physician review required.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const response = await chatApi.send(userMsg, selectedPatient?.id);
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Unable to reach clinical knowledge agent.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Clinical AI Assistant
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Patient-context aware Q&A with citations — not a general chatbot.
      </Typography>

      {!selectedPatient ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Select a patient to ground answers in chart context.
        </Alert>
      ) : (
        <PatientHeader patient={selectedPatient} />
      )}

      <Card sx={{ height: 560, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
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
                  maxWidth: '85%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  border: msg.role === 'user' ? 'none' : '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                {msg.role !== 'user' && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                    AI · Evidence-informed
                  </Typography>
                )}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
                {msg.citations && msg.citations.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Sources
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {msg.citations.map((c, j) => (
                        <Chip key={j} label={c.source} size="small" variant="outlined" sx={{ mr: 0.5, mt: 0.5 }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          ))}
          {loading && <CircularProgress size={22} />}
        </CardContent>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="e.g. What are first-line options for outpatient CAP?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <Button variant="contained" onClick={send} disabled={loading}>
            <SendIcon />
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
