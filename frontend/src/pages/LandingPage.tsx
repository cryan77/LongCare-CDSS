import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Alert,
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

const fadeUp = {
  animation: 'fadeUp 0.7s ease-out both',
};

const considerations = [
  {
    icon: <VisibilityIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Explainability and Transparency',
    points: [
      'Can clinicians understand how the tool generates its recommendations?',
      'Are the sources of evidence, data inputs, and algorithms clearly disclosed?',
      'Systems that operate as "black boxes" may undermine clinician trust and patient safety.',
    ],
  },
  {
    icon: <MenuBookIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Evidence Quality',
    points: [
      'Is the tool grounded in current clinical guidelines or validated research?',
      'Are there references to peer-reviewed studies or regulatory approvals?',
      'Vendors should be clear about how evidence is selected, updated, and applied.',
    ],
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Use of Patient Data',
    points: [
      'Does the tool incorporate historical patient data or rely solely on current inputs?',
      'Tools that lack longitudinal context may have limited relevance in complex cases.',
      'Consider the privacy, consent, and data integration implications.',
    ],
  },
  {
    icon: <IntegrationInstructionsIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Intended Use and Clinical Fit',
    points: [
      'Is the tool designed for a specific condition, workflow, or setting?',
      'Can it be meaningfully integrated into your clinical environment or EHR?',
      'Overly general tools may lack the specificity needed for high-impact use.',
    ],
  },
  {
    icon: <PsychologyIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Risk of Automation Bias',
    points: [
      'Does the interface encourage clinicians to accept AI-generated suggestions uncritically?',
      'There should be clear cues for when to question or override recommendations.',
    ],
  },
  {
    icon: <GavelIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Regulatory Landscape',
    points: [
      'Is the product approved, cleared, or registered with relevant health authorities?',
      'With evolving regulations, track how standards are applied to AI-CDSS tools.',
    ],
  },
];

const categories = [
  {
    icon: <BiotechIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Diagnostic Analysis',
    image: '/images/diagnostic-imaging.jpg',
    description:
      'Interpret medical images, labs, and chart data to surface patterns that support accurate, timely differential diagnosis.',
  },
  {
    icon: <ChatIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Clinical Knowledge',
    image: '/images/care-consultation.jpg',
    description:
      'Ask guideline-backed clinical questions and receive evidence-informed answers with citations for point-of-care use.',
  },
  {
    icon: <MedicationIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    title: 'Treatment Recommendations',
    image: '/images/hero-clinic.jpg',
    description:
      'Align patient context with clinical guidelines to suggest therapies, flag allergies, and support care planning.',
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Full-bleed hero */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: '78vh', md: '88vh' },
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden',
          color: 'white',
        }}
      >
        <Box
          component="img"
          src="/images/hero-clinic.jpg"
          alt="Clinician reviewing patient information at a clinical workstation"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            animation: 'fadeIn 1.2s ease-out',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(105deg, rgba(6,31,32,0.88) 0%, rgba(15,61,62,0.72) 42%, rgba(15,61,62,0.35) 100%)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', pb: { xs: 7, md: 10 }, pt: 12 }}>
          <Typography
            variant="h5"
            sx={{
              color: 'secondary.light',
              mb: 2,
              ...fadeUp,
              animationDelay: '0.1s',
            }}
          >
            LongCare
          </Typography>
          <Typography
            variant="h1"
            sx={{
              maxWidth: 720,
              mb: 2,
              color: 'white',
              ...fadeUp,
              animationDelay: '0.25s',
            }}
          >
            Clinical Decision Support
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 560,
              mb: 4,
              color: 'rgba(255,255,255,0.88)',
              fontSize: '1.15rem',
              ...fadeUp,
              animationDelay: '0.4s',
            }}
          >
            Evidence-based insights at the point of care — multi-agent AI that augments clinicians,
            never replaces judgment.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', ...fadeUp, animationDelay: '0.55s' }}>
            <Button
              component={RouterLink}
              to="/app/login"
              variant="contained"
              size="large"
              color="secondary"
            >
              Open Clinician Portal
            </Button>
            <Button
              component={RouterLink}
              to="/#categories"
              variant="outlined"
              size="large"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.55)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Explore Categories
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Introduction with image */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 11 } }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" color="primary.main" gutterBottom>
              An Introduction to Clinical Decision Support
            </Typography>
            <Typography variant="h2" color="primary.dark" sx={{ mb: 3 }}>
              Informed decisions, when and where they matter
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }} color="text.secondary">
              Clinical Decision Support (CDS) helps clinicians make evidence-based decisions at the
              point of care — delivering guidelines, alerts, and recommendations within real clinical
              workflows.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              AI-enabled CDS can reduce cognitive burden and improve consistency, while raising
              important questions around transparency, safety, and clinical accountability.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src="/images/care-consultation.jpg"
              alt="Clinician and patient in a primary care consultation"
              sx={{
                width: '100%',
                height: { xs: 280, md: 400 },
                objectFit: 'cover',
                borderRadius: 2,
                boxShadow: '0 16px 40px rgba(15, 61, 62, 0.18)',
              }}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Platform */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background:
            'linear-gradient(180deg, rgba(238,246,245,0.9) 0%, rgba(244,247,246,0.4) 100%)',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 5 }} sx={{ order: { xs: 2, md: 1 } }}>
              <Box
                component="img"
                src="/images/diagnostic-imaging.jpg"
                alt="Diagnostic imaging review on a clinical monitor"
                sx={{
                  width: '100%',
                  height: { xs: 260, md: 360 },
                  objectFit: 'cover',
                  borderRadius: 2,
                  boxShadow: '0 16px 40px rgba(15, 61, 62, 0.16)',
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }} sx={{ order: { xs: 1, md: 2 } }}>
              <Typography variant="h5" color="primary.main" gutterBottom>
                Practical CDS in Use Today
              </Typography>
              <Typography variant="h2" color="primary.dark" sx={{ mb: 3 }}>
                Built for real-world primary care
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }} color="text.secondary">
                LongCare CDSS combines multi-agent reasoning, guideline retrieval, imaging support,
                and physician approval workflows — transparent, citation-backed, and designed for
                clinical accountability.
              </Typography>
              <Button component={RouterLink} to="/app/login" variant="contained" size="large" sx={{ mt: 1 }}>
                Launch Demo Platform
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Considerations */}
      <Box id="considerations" sx={{ py: { xs: 8, md: 11 } }}>
        <Container maxWidth="lg">
          <Typography variant="h2" color="primary.dark" gutterBottom>
            Key Considerations When Evaluating AI-CDSS
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 720 }}>
            Assess clinical rigour, transparency, and safety — not just feature lists.
          </Typography>
          <Grid container spacing={3}>
            {considerations.map((item) => (
              <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(15, 61, 62, 0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'primary.50',
                        background: 'rgba(15, 61, 62, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      {item.icon}
                    </Box>
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

      {/* SaMD */}
      <Container maxWidth="md" sx={{ pb: 6 }}>
        <Alert
          severity="info"
          sx={{
            bgcolor: 'rgba(15, 61, 62, 0.05)',
            border: '1px solid',
            borderColor: 'divider',
            '& .MuiAlert-icon': { color: 'primary.main' },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
            Software as a Medical Device (SaMD)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-CDSS may require Health Canada approval when used for diagnosis, prognosis, or
            treatment support. Tools that only display independently verifiable reference information
            without replacing clinical judgment may fall outside SaMD requirements.
          </Typography>
        </Alert>
      </Container>

      {/* Categories with images */}
      <Box id="categories" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'rgba(238,246,245,0.55)' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" color="primary.dark" gutterBottom sx={{ mb: 1 }}>
            Understanding the Categories of AI-CDSS
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 640 }}>
            Three practical patterns clinicians encounter in primary care settings.
          </Typography>
          <Grid container spacing={3}>
            {categories.map((cat) => (
              <Grid key={cat.title} size={{ xs: 12, md: 4 }}>
                <Box sx={{ height: '100%' }}>
                  <Box
                    component="img"
                    src={cat.image}
                    alt={cat.title}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: '10px 10px 0 0',
                      display: 'block',
                    }}
                  />
                  <Card sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, mt: '-1px' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        {cat.icon}
                        <Typography variant="h4" color="primary.dark">
                          {cat.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {cat.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA band */}
      <Box
        sx={{
          position: 'relative',
          py: { xs: 9, md: 11 },
          overflow: 'hidden',
          color: 'white',
        }}
      >
        <Box
          component="img"
          src="/images/hero-clinic.jpg"
          alt=""
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.35)',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: 'secondary.light', mb: 2 }}>
            Primary care · Canada
          </Typography>
          <Typography variant="h2" sx={{ color: 'white', mb: 2 }}>
            Practical AI for clinical accountability
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9, maxWidth: 560, mx: 'auto' }}>
            Enhance diagnostic accuracy, treatment planning, and workflow efficiency — with safety
            and physician oversight built in.
          </Typography>
          <Button
            component={RouterLink}
            to="/app/login"
            variant="contained"
            size="large"
            color="secondary"
          >
            Launch Demo Platform
          </Button>
        </Container>
      </Box>

      {/* Contact */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 }, textAlign: 'center' }}>
        <Typography variant="h2" color="primary.dark" gutterBottom>
          Questions about Clinical Decision Support?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We help clinicians and organizations navigate this evolving space.
        </Typography>
        <Button variant="outlined" color="primary" href="mailto:contact@longcare.ca" size="large">
          Contact Us
        </Button>
      </Container>
    </>
  );
}
