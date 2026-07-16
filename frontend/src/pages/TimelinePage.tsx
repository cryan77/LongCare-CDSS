import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import { timelineApi } from '../api/client';
import { useClinicalStore } from '../store';

type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  detail: string;
  date: string;
};

export default function TimelinePage() {
  const { selectedPatient } = useClinicalStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['timeline', selectedPatient?.id],
    queryFn: () => timelineApi.get(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  if (!selectedPatient) {
    return (
      <Alert severity="warning">Select a patient to view their medical timeline.</Alert>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load timeline.</Alert>;
  }

  const events: TimelineEvent[] = data?.events ?? [];

  return (
    <Box>
      <Typography variant="h4" color="primary.dark" gutterBottom>
        Medical Timeline
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {selectedPatient.first_name} {selectedPatient.last_name} ({selectedPatient.mrn})
      </Typography>

      {events.length === 0 && <Alert severity="info">No clinical events yet.</Alert>}

      {events.map((ev) => (
        <Card key={ev.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Chip label={ev.type} size="small" color="primary" variant="outlined" />
              <Typography variant="caption" color="text.secondary">
                {new Date(ev.date).toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="h6">{ev.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {ev.detail}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
