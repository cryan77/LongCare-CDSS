import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';

type Props = {
  inputs?: string[];
  model?: string;
  sources?: string[];
  confidence?: number;
};

export default function ExplainabilityPanel({
  inputs = ['Symptoms', 'Lab results', 'Chart context'],
  model = 'OpenRouter clinical reasoning',
  sources = [],
  confidence,
}: Props) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '10px !important', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Why did AI say this?
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          Input data used
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
          {inputs.map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2">{i}</Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
          Model
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {model}
        </Typography>
        {sources.length > 0 && (
          <>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
              Knowledge sources
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
              {sources.map((s) => (
                <Chip key={s} label={s} size="small" variant="outlined" />
              ))}
            </Box>
          </>
        )}
        {confidence != null && (
          <Typography variant="body2">
            Confidence: <strong>{Math.round(confidence * (confidence <= 1 ? 100 : 1))}%</strong>
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
