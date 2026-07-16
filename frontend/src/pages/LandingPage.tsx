import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Alert,
  Divider,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SecurityIcon from '@mui/icons-material/Security';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import PsychologyIcon from '@mui/icons-material/Psychology';
import GavelIcon from '@mui/icons-material/Gavel';
import BiotechIcon from '@mui/icons-material/Biotech';
import ChatIcon from '@mui/icons-material/Chat';
import MedicationIcon from '@mui/icons-material/Medication';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlineOutlined';

const considerations = [
  {
    icon: <VisibilityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Explainability and Transparency',
    points: [
      'Can clinicians understand how the tool generates its recommendations?',
      'Are the sources of evidence, data inputs, and algorithms clearly disclosed?',
      'Systems that operate as "black boxes" may undermine clinician trust and patient safety.',
    ],
  },
  {
    icon: <MenuBookIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Evidence Quality',
    points: [
      'Is the tool grounded in current clinical guidelines or validated research?',
      'Are there references to peer-reviewed studies or regulatory approvals?',
      'Vendors should be clear about how evidence is selected, updated, and applied.',
    ],
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Use of Patient Data',
    points: [
      'Does the tool incorporate historical patient data or rely solely on current inputs?',
      'Tools that lack longitudinal context may have limited relevance in complex cases.',
      'Consider the privacy, consent, and data integration implications.',
    ],
  },
  {
    icon: <IntegrationInstructionsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Intended Use and Clinical Fit',
    points: [
      'Is the tool designed for a specific condition, workflow, or setting?',
      'Can it be meaningfully integrated into your clinical environment or EHR?',
      'Overly general tools may lack the specificity needed for high-impact use.',
    ],
  },
  {
    icon: <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Risk of Automation Bias',
    points: [
      'Does the interface encourage clinicians to accept AI-generated suggestions uncritically?',
      'There should be clear cues for when to question or override recommendations.',
    ],
  },
  {
    icon: <GavelIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Regulatory Landscape',
    points: [
      'Is the product approved, cleared, or registered with relevant health authorities?',
      'With evolving regulations, track how standards are applied to AI-CDSS tools.',
    ],
  },
];

const categories = [
  {
    icon: <BiotechIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Diagnostic Analysis',
    description:
      'AI-powered CDSS designed for diagnostic analysis help clinicians interpret medical data such as images, test results, or chart information. These tools enhance diagnostic accuracy by identifying patterns that may be difficult to detect manually.',
  },
  {
    icon: <ChatIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Chatbots for Clinical Questions',
    description:
      'AI-enabled chatbots act as conversational assistants for clinicians, offering fast access to medical knowledge, guidelines, and drug information with evidence-informed responses integrated into clinical environments.',
  },
  {
    icon: <MedicationIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Treatment Recommendations',
    description:
      'AI-CDSS tools for treatment recommendations analyze patient data and align it with clinical guidelines to suggest appropriate therapeutic options, personalizing care plans with longitudinal patient context.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: 'background.default',
          py: { xs: 8, md: 12 },
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h1" color="primary.dark" gutterBottom>
            Clinical Decision Support
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
            AI-driven Clinical Decision Support Systems (AI-CDSS) are rapidly emerging tools designed
            to support clinicians with evidence-based insights at the point of care.
          </Typography>
        </Container>
      </Box>

      {/* Introduction */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h5" color="primary.main" gutterBottom>
          An Introduction to Clinical Decision Support
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }} color="text.secondary">
          Clinical Decision Support (CDS) refers to a broad range of tools and technologies that help
          healthcare clinicians make informed, evidence-based decisions at the point of care. These
          systems are designed to improve clinical workflows, enhance diagnostic accuracy, and support
          better patient outcomes by delivering relevant information such as guidelines, alerts, or
          recommendations, when and where it's needed most.
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }} color="text.secondary">
          As healthcare continues to evolve, CDS tools, including those powered by artificial
          intelligence (AI), are becoming increasingly prominent. They hold the potential to streamline
          care delivery and reduce cognitive burden, but also raise important questions around
          transparency, safety, and effectiveness.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Whether you're a clinician, healthcare professional, or researcher, our goal is to provide
          a clear and balanced starting point for understanding what CDS is, how it's being used, and
          what to consider when evaluating these technologies.
        </Typography>
      </Container>

      <Divider />

      {/* EMR Tools section */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h2" color="primary.dark" gutterBottom>
          Our Platform: Practical CDS in Use Today
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }} color="text.secondary">
          While many AI-enabled CDS tools are still in early stages of adoption, LongCare CDSS offers
          a trusted and effective form of clinical decision support built for real-world primary care
          settings — combining multi-agent AI reasoning, evidence retrieval, and physician approval
          workflows.
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }} color="text.secondary">
          These tools provide actionable, evidence-based prompts and decision aids that support
          clinicians in delivering guideline-aligned care across a range of conditions, with
          transparent reasoning and citation-backed recommendations.
        </Typography>
        <Button
          component={RouterLink}
          to="/app/login"
          variant="contained"
          size="large"
          sx={{ mt: 2 }}
        >
          Open Clinician Portal
        </Button>
      </Container>

      {/* Key Considerations */}
      <Box id="considerations" sx={{ bgcolor: '#f0f4f2', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" color="primary.dark" gutterBottom sx={{ mb: 1 }}>
            Key Considerations When Evaluating AI-CDSS
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 800 }}>
            The growing number of AI-driven Clinical Decision Support Systems on the market varies
            widely in scope, complexity, and reliability. Assess clinical rigour, transparency, and
            overall safety.
          </Typography>
          <Grid container spacing={3}>
            {considerations.map((item) => (
              <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>{item.icon}</Box>
                    <Typography variant="h4" gutterBottom color="primary.dark">
                      {item.title}
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {item.points.map((point) => (
                        <Typography
                          key={point}
                          component="li"
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {point}
                        </Typography>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* SaMD Alert */}
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
            AI-driven clinical decision support systems can be considered Software as a Medical Device (SaMD)
          </Typography>
          <Typography variant="body2">
            They may require Health Canada approval if designed for a medical purpose, functioning
            independently of medical hardware, and performing tasks such as collecting and analysing
            medical data, providing prognostic insights, or directly supporting treatment and diagnosis.
            Systems that offer independently verifiable reference information without replacing clinical
            judgment may not fall under SaMD requirements.
          </Typography>
        </Alert>
      </Container>

      {/* Categories */}
      <Box id="categories" sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" color="primary.dark" gutterBottom sx={{ mb: 5 }}>
            Understanding the Categories of AI-CDSS
          </Typography>
          <Grid container spacing={4}>
            {categories.map((cat) => (
              <Grid key={cat.title} size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: { md: 'center' } }}>
                    {cat.icon}
                  </Box>
                  <Typography variant="h5" color="primary.main" gutterBottom>
                    {cat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cat.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Webinar / CTA */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <PlayCircleOutlineIcon sx={{ fontSize: 56, mb: 2, opacity: 0.9 }} />
          <Typography variant="h5" gutterBottom sx={{ opacity: 0.9 }}>
            AI-Powered Clinical Decision Support
          </Typography>
          <Typography variant="h3" gutterBottom>
            Practical Considerations for Primary Care in Canada
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Explore how AI-powered CDSS are shaping the future of primary care — enhancing diagnostic
            accuracy, treatment planning, and workflow efficiency while examining safety, reliability,
            and clinical accountability.
          </Typography>
          <Button
            component={RouterLink}
            to="/app/login"
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': { bgcolor: '#f0f0f0' },
            }}
          >
            Launch Demo Platform
          </Button>
        </Container>
      </Box>

      {/* Contact */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" color="primary.dark" gutterBottom>
          Have questions about Clinical Decision Support Tools?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're here to help you navigate this evolving space.
        </Typography>
        <Button variant="outlined" color="primary" href="mailto:contact@longcare.ca">
          Contact Us
        </Button>
      </Container>
    </>
  );
}
