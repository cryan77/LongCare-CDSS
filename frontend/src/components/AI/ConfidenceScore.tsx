import { Box, LinearProgress, Typography } from '@mui/material';

type Props = {
  value: number;
  label?: string;
  size?: 'sm' | 'md';
};

/** Confidence bar — never present AI as a final decision */
export default function ConfidenceScore({ value, label = 'Confidence', size = 'md' }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value * (value <= 1 ? 100 : 1))));
  const color = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'error';

  return (
    <Box sx={{ minWidth: size === 'sm' ? 120 : 180 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700, color: `${color}.main` }}>
          {pct}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ height: size === 'sm' ? 6 : 10, borderRadius: 99 }}
      />
    </Box>
  );
}
