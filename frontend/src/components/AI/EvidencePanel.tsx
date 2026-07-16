import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';

type EvidenceItem = {
  id?: string;
  source?: string;
  year?: number;
  excerpt?: string;
  relevance?: number;
};

type Props = {
  symptoms?: string[];
  findings?: string[];
  evidence?: EvidenceItem[];
  title?: string;
};

export default function EvidencePanel({
  symptoms = [],
  findings = [],
  evidence = [],
  title = 'Supporting Evidence',
}: Props) {
  const [open, setOpen] = useState(true);
  const checks = [...findings, ...symptoms.map((s) => s)];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" color="primary.main">
          {title}
        </Typography>
        <IconButton size="small" onClick={() => setOpen(!open)}>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {checks.map((item) => (
            <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.2 }} />
              <Typography variant="body2">{item}</Typography>
            </Box>
          ))}
          {evidence.map((e) => (
            <Box
              key={e.id || e.excerpt}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                <Chip label={e.source || 'Source'} size="small" color="primary" variant="outlined" />
                {e.year && <Chip label={String(e.year)} size="small" variant="outlined" />}
                {e.relevance != null && (
                  <Chip label={`${Math.round(e.relevance * (e.relevance <= 1 ? 100 : 1))}% match`} size="small" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {e.excerpt}
              </Typography>
            </Box>
          ))}
          {!checks.length && !evidence.length && (
            <Typography variant="body2" color="text.secondary">
              No supporting evidence listed yet.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
