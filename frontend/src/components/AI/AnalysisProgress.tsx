import { Box, Step, StepLabel, Stepper, Typography } from '@mui/material';

const DEFAULT_STEPS = [
  'Loading patient data',
  'Checking allergies',
  'Running diagnosis model',
  'Searching guidelines',
  'Generating recommendation',
];

type Props = {
  activeStep: number;
  steps?: string[];
  completed?: boolean;
};

export default function AnalysisProgress({
  activeStep,
  steps = DEFAULT_STEPS,
  completed = false,
}: Props) {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" color="primary.main" sx={{ mb: 2 }}>
        {completed ? 'Analysis completed' : 'Analyzing patient'}
      </Typography>
      <Stepper activeStep={completed ? steps.length : activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label} completed={completed || index < activeStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
