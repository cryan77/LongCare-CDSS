import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { chatApi } from '../api/client';
import { useClinicalStore } from '../store';

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
        'I am the Medical Knowledge Agent. Ask me about clinical guidelines, treatment protocols, or drug information. All responses include citations and require physician review.',
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
        { role: 'assistant', content: 'Unable to reach knowledge agent. Is the backend running?' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Medical Knowledge Chat
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        RAG-powered clinical Q&A with guideline citations from WHO, NICE, AHA, and more.
      </Typography>

      <Card sx={{ height: 520, display: 'flex', flexDirection: 'column' }}>
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
                sx={{
                  p: 2,
                  maxWidth: '80%',
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
                {msg.citations && msg.citations.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {msg.citations.map((c, j) => (
                      <Chip
                        key={j}
                        label={c.source}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mt: 0.5 }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          ))}
          {loading && <CircularProgress size={24} />}
        </CardContent>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask about pneumonia treatment guidelines..."
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
