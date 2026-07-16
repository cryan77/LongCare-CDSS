import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { chatApi } from '../api/client';

type Result = {
  content: string;
  citations?: { source: string; excerpt: string; year?: number; relevance?: number }[];
};

export default function KnowledgePage() {
  const [query, setQuery] = useState('Treatment guideline for pneumonia');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await chatApi.send(query.trim());
      setResult(data);
    } catch {
      setError('Knowledge search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Medical Knowledge Search
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Search clinical guidelines and evidence with similarity-ranked citations.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            sx={{ flex: 1, minWidth: 240 }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={search} disabled={loading}>
            Search
          </Button>
        </CardContent>
      </Card>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {result && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Summary
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {result.content}
              </Typography>
            </CardContent>
          </Card>

          {(result.citations || []).map((c, i) => (
            <Card key={i}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                  <Typography variant="h4">{c.source}</Typography>
                  {c.relevance != null && (
                    <Chip
                      label={`Similarity ${Math.round(c.relevance * (c.relevance <= 1 ? 100 : 1))}%`}
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
                {c.year && (
                  <Typography variant="caption" color="text.secondary">
                    Citation year: {c.year}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {c.excerpt}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
