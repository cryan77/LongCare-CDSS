import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { adminApi } from '../../api/client';

const MODEL_OPTIONS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-sonnet-4',
  'google/gemini-2.5-flash',
];

export default function AdminAIConfigPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-config'],
    queryFn: adminApi.aiConfig,
  });
  const [form, setForm] = useState({
    diagnosis_model: '',
    treatment_model: '',
    embedding_model: '',
    vision_model: '',
    temperature: 0.2,
    max_tokens: 4000,
  });

  useEffect(() => {
    if (data) {
      setForm({
        diagnosis_model: data.diagnosis_model || '',
        treatment_model: data.treatment_model || '',
        embedding_model: data.embedding_model || '',
        vision_model: data.vision_model || '',
        temperature: data.temperature ?? 0.2,
        max_tokens: data.max_tokens ?? 4000,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => adminApi.updateAiConfig(form),
  });

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        AI Configuration
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure diagnosis, treatment, embedding, and vision models for the platform.
      </Typography>

      {isLoading && <Alert severity="info">Loading configuration…</Alert>}
      {mutation.isSuccess && <Alert severity="success" sx={{ mb: 2 }}>Configuration saved for this server process.</Alert>}

      <Card sx={{ maxWidth: 640 }}>
        <CardContent>
          {(
            [
              ['diagnosis_model', 'Diagnosis Model'],
              ['treatment_model', 'Treatment Model'],
              ['vision_model', 'Vision Model'],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              select
              fullWidth
              label={label}
              margin="normal"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            >
              {MODEL_OPTIONS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
          ))}
          <TextField
            fullWidth
            label="Embedding Model"
            margin="normal"
            value={form.embedding_model}
            onChange={(e) => setForm({ ...form, embedding_model: e.target.value })}
          />
          <TextField
            fullWidth
            type="number"
            label="Temperature"
            margin="normal"
            slotProps={{ htmlInput: { step: 0.1, min: 0, max: 2 } }}
            value={form.temperature}
            onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
          />
          <TextField
            fullWidth
            type="number"
            label="Maximum Tokens"
            margin="normal"
            value={form.max_tokens}
            onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value, 10) })}
          />
          <Button variant="contained" sx={{ mt: 2 }} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Save Configuration
          </Button>
          {data && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Provider: {data.provider} · OpenRouter: {data.openrouter_configured ? 'yes' : 'no'}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
