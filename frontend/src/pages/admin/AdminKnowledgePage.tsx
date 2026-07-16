import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const STEPS = ['Upload PDF', 'OCR', 'Chunking', 'Embedding', 'Vector Database', 'Available to AI'];

export default function AdminKnowledgePage() {
  return (
    <Box>
      <Typography variant="h1" color="primary.dark" gutterBottom>
        Knowledge Base
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload clinical guidelines, SOPs, drug databases, and research for RAG.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" gutterBottom>
            Import Guidelines
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Demo ingest runs from <code>backend/data/guidelines.json</code> on server startup.
          </Typography>
          <Button variant="contained" component="label" startIcon={<CloudUploadIcon />}>
            Upload PDF
            <input type="file" hidden accept=".pdf,.json" />
          </Button>
          <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
            Supported: Clinical guidelines · Hospital SOPs · Drug databases · Research papers
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Ingest Pipeline
          </Typography>
          <Stepper activeStep={5} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label} completed>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );
}
