import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  Typography,
} from '@mui/material';
import { chatApi } from '../../api/client';

/** Demo patient portal — educational only, no clinical AI diagnosis */
export default function PatientPortalPage() {
  const [taken, setTaken] = useState<Record<string, boolean>>({ morning: true, evening: false });
  const [chat, setChat] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content:
        'Welcome. Ask educational questions about your health. I will not diagnose or suggest prescription changes.',
    },
  ]);
  const [input, setInput] = useState('What is hypertension?');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    setChat((c) => [...c, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await chatApi.send(msg);
      setChat((c) => [...c, { role: 'assistant', content: res.content }]);
    } catch {
      setChat((c) => [
        ...c,
        {
          role: 'assistant',
          content:
            'Hypertension means your blood pressure is consistently higher than normal. Follow your doctor’s plan and contact the clinic if symptoms worsen.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Welcome, Jamie
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Your personal health summary — clear language, no complex medical reasoning.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Upcoming Appointment', value: 'Tomorrow · 10:30 AM' },
          { label: 'Current Conditions', value: 'Type 2 Diabetes · Hypertension' },
          { label: 'Recent Reports', value: '2' },
          { label: 'Messages', value: '1' },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" color="text.secondary">
                  {s.label}
                </Typography>
                <Typography variant="h4" color="primary.dark" sx={{ mt: 1 }}>
                  {s.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                My Health
              </Typography>
              <Typography sx={{ fontWeight: 650 }}>Type 2 Diabetes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Diagnosed 2020 · Status: Stable
              </Typography>
              <Typography sx={{ fontWeight: 650 }}>Blood Sugar Control</Typography>
              <Typography variant="body2" color="text.secondary">
                Your average blood sugar is higher than the target range. Please discuss medication adjustments with
                your doctor.
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Medications
              </Typography>
              {[
                { key: 'morning', name: 'Metformin 500 mg', when: 'Morning' },
                { key: 'evening', name: 'Amlodipine 5 mg', when: 'Evening' },
              ].map((m) => (
                <Box key={m.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 650 }}>{m.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {m.when}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!taken[m.key]}
                        onChange={(e) => setTaken({ ...taken, [m.key]: e.target.checked })}
                      />
                    }
                    label={taken[m.key] ? <Chip size="small" color="success" label="Taken" /> : 'Mark taken'}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Appointments
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Upcoming: Diabetes follow-up — Tomorrow 10:30 AM
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button size="small" variant="contained">
                  Join Telehealth
                </Button>
                <Button size="small" variant="outlined">
                  Book Appointment
                </Button>
                <Button size="small" variant="text" color="error">
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Health Assistant
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Educational answers only — not a diagnosis or prescription.
              </Alert>
              <Box sx={{ maxHeight: 220, overflow: 'auto', mb: 2 }}>
                {chat.map((m, i) => (
                  <Typography key={i} variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
                    <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.content}
                  </Typography>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box
                  component="input"
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && send()}
                  placeholder="Ask a health education question…"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #dde1e7',
                    fontFamily: 'inherit',
                  }}
                />
                <Button variant="contained" onClick={send} disabled={loading}>
                  Send
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
