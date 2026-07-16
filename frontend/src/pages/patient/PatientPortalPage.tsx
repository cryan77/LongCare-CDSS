import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import { chatApi } from '../../api/client';
import { useAuthStore } from '../../store';
import { DashboardWidget, KpiCard, greetingForNow } from '../../components/Dashboard/widgets';

/** Patient home — plain language, “what should I do today?” */
export default function PatientPortalPage() {
  const { user } = useAuthStore();
  const greeting = greetingForNow();
  const firstName = (user?.full_name || 'Jamie').split(' ')[0];

  const [taken, setTaken] = useState<Record<string, boolean>>({ morning: false, evening: false });
  const [chat, setChat] = useState<{ role: string; content: string }[]>([
    {
      role: 'assistant',
      content:
        'Ask educational questions about your health. I will not diagnose or recommend prescription changes.',
    },
  ]);
  const [input, setInput] = useState('Can I eat bananas?');
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
            'Bananas are generally fine for most people as part of a balanced diet. Follow your care team’s advice for your conditions, and ask your doctor if you have diet restrictions.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const medsDone = Object.values(taken).filter(Boolean).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Box>
          <Typography variant="h1" color="primary.dark">
            Hello {firstName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {greeting} — here’s what you need to know or do today.
          </Typography>
        </Box>
        <Chip label="Patient Portal" variant="outlined" />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Appointment" value="Tomorrow" hint="Cardiology · 10:30 AM" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Medications Today" value={`${medsDone}/2`} hint="Mark doses as taken" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Messages" value={1} hint="From your care team" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard label="Walk Goal" value="6.0k / 8k" hint="Steps today" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DashboardWidget title="Health Summary">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Conditions
                </Typography>
                <Typography sx={{ fontWeight: 650 }}>Type 2 Diabetes</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Status: Stable
                </Typography>
                <Typography sx={{ fontWeight: 650 }}>Hypertension</Typography>
                <Typography variant="body2" color="text.secondary">
                  Blood pressure: in target range
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Snapshot
                </Typography>
                <Typography variant="body2">Weight: 82 kg</Typography>
                <Typography variant="body2">Blood pressure: Normal</Typography>
                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  Blood sugar is higher than the target. Please discuss with your doctor.
                </Alert>
              </Grid>
            </Grid>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardWidget title="Upcoming Appointment">
            <Typography variant="h4" color="primary.dark" gutterBottom>
              Tomorrow
            </Typography>
            <Typography sx={{ fontWeight: 650 }}>Cardiology</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              10:30 AM · LongCare Clinic
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button size="small" variant="contained">
                Join Telehealth
              </Button>
              <Button size="small" variant="outlined">
                Reschedule
              </Button>
            </Box>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget title="Today's Medication">
            {[
              { key: 'morning', name: 'Metformin 500 mg', when: 'Morning', cta: 'Take Now' },
              { key: 'evening', name: 'Vitamin D', when: 'Evening', cta: 'Upcoming' },
            ].map((m) => (
              <Box
                key={m.key}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
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
                  label={
                    taken[m.key] ? (
                      <Chip size="small" color="success" label="Taken" />
                    ) : (
                      <Chip size="small" variant="outlined" label={m.cta} />
                    )
                  }
                />
              </Box>
            ))}
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget title="Health Goals">
            {[
              { label: 'Walk', value: '6000 / 8000', pct: 75 },
              { label: 'Water', value: '1.8 L', pct: 60 },
              { label: 'Medication', value: medsDone === 2 ? 'Completed' : 'In progress', pct: (medsDone / 2) * 100 },
            ].map((g) => (
              <Box key={g.label} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 650 }}>
                    {g.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {g.value}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={g.pct} sx={{ height: 8, borderRadius: 99 }} />
              </Box>
            ))}
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget title="Messages">
            <Typography variant="body2" sx={{ mb: 1 }}>
              Care team: Please bring your glucose log to tomorrow’s visit.
            </Typography>
            <Button size="small" variant="outlined">
              Reply
            </Button>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardWidget title="Recent Test Results">
            <Alert severity="info" sx={{ mb: 1 }}>
              Your average blood sugar is higher than the target range.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Please discuss medication adjustments with your doctor at your next visit. We show plain-language
              summaries instead of raw lab codes.
            </Typography>
          </DashboardWidget>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <DashboardWidget title="Health Assistant">
            <Alert severity="info" sx={{ mb: 2 }}>
              Educational guidance only — not a diagnosis or prescription.
            </Alert>
            <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              {chat.map((m, i) => (
                <Typography key={i} variant="body2" sx={{ mb: 1.25, whiteSpace: 'pre-wrap' }}>
                  <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.content}
                </Typography>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask a health education question…"
              />
              <Button variant="contained" onClick={send} disabled={loading}>
                Send
              </Button>
            </Box>
          </DashboardWidget>
        </Grid>
      </Grid>
    </Box>
  );
}
