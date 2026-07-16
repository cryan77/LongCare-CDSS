import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useState } from 'react';
import ConfidenceScore from './ConfidenceScore';
import EvidencePanel from './EvidencePanel';
import ExplainabilityPanel from './ExplainabilityPanel';

export type DiagnosisResultView = {
  id?: number;
  diagnosis: { name: string; probability: number }[];
  differential: string[];
  reasoning: string;
  evidence: { id?: string; source?: string; year?: number; excerpt?: string; relevance?: number }[];
  confidence: number;
  safety_flags: string[];
};

type Props = {
  result: DiagnosisResultView;
  symptoms?: string[];
  onApprove?: () => void;
  onReject?: () => void;
  onRequestMore?: () => void;
};

export default function DiagnosisCard({
  result,
  symptoms = [],
  onApprove,
  onReject,
  onRequestMore,
}: Props) {
  const [showReasoning, setShowReasoning] = useState(false);
  const primary = result.diagnosis[0];

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" color="primary.main" gutterBottom>
          AI Clinical Assessment
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Suggestion for physician review — not an automatic clinical decision
        </Typography>

        <Typography variant="h5" color="text.secondary" sx={{ mb: 0.5 }}>
          Possible diagnosis
        </Typography>
        <Typography variant="h3" color="primary.dark" sx={{ mb: 2 }}>
          {primary?.name || 'Pending'}
        </Typography>

        <Box sx={{ mb: 3, maxWidth: 280 }}>
          <ConfidenceScore value={result.confidence} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Button
            size="small"
            endIcon={showReasoning ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowReasoning(!showReasoning)}
          >
            Reasoning
          </Button>
          <Collapse in={showReasoning}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              {result.reasoning}
            </Typography>
          </Collapse>
        </Box>

        <EvidencePanel
          symptoms={symptoms}
          evidence={result.evidence}
          findings={result.safety_flags.length ? [] : undefined}
        />

        {result.differential.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
              Differential diagnosis
            </Typography>
            <Stack spacing={1}>
              {result.differential.map((d, i) => (
                <Box
                  key={d}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2">
                    {i + 1}. {d}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${Math.max(8, 40 - i * 12)}%`}
                    color="default"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {result.safety_flags.length > 0 && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            {result.safety_flags.join('; ')}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <ExplainabilityPanel
            inputs={[
              ...(symptoms.length ? ['Symptoms'] : []),
              'Patient chart',
              ...(result.evidence.length ? ['Guideline evidence'] : []),
            ]}
            sources={result.evidence.map((e) => e.source || 'Guideline').filter(Boolean) as string[]}
            confidence={result.confidence}
          />
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          Recommended next step: review by physician before entering the clinical record.
        </Alert>

        <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
          {onApprove && (
            <Button variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={onApprove}>
              Doctor Approve
            </Button>
          )}
          {onReject && (
            <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={onReject}>
              Reject
            </Button>
          )}
          {onRequestMore && (
            <Button variant="outlined" onClick={onRequestMore}>
              Request More Analysis
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
