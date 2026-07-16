import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const INITIAL = [
  { id: '1', title: 'Record morning vitals — bay A', tag: 'Vitals', done: false },
  { id: '2', title: 'Medication round 12:00', tag: 'Meds', done: false },
  { id: '3', title: 'Notify physician: SpO₂ alert', tag: 'Alert', done: false },
  { id: '4', title: 'Update care plan notes', tag: 'Notes', done: true },
  { id: '5', title: 'Fall-risk rounding', tag: 'Safety', done: false },
];

export default function NurseTasksPage() {
  const [tasks, setTasks] = useState(INITIAL);

  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Care Tasks
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Shift checklist for assigned patients.
      </Typography>

      <Card sx={{ maxWidth: 720 }}>
        <CardContent>
          {tasks.map((t) => (
            <Box
              key={t.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.25,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={t.done}
                    onChange={(e) =>
                      setTasks((prev) =>
                        prev.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x)),
                      )
                    }
                  />
                }
                label={<Typography sx={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</Typography>}
              />
              <Chip size="small" label={t.tag} variant="outlined" color={t.tag === 'Alert' ? 'warning' : 'default'} />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
