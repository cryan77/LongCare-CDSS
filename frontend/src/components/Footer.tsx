import { Box, Container, Divider, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 0,
        color: 'white',
        background: 'linear-gradient(160deg, #0a2e2f 0%, #0f3d3e 55%, #1f5a52 100%)',
        pt: 8,
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr 1fr' },
            gap: 4,
            mb: 5,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
              <Box component="img" src="/favicon.svg" alt="" sx={{ width: 32, height: 32 }} />
              <Typography
                variant="h6"
                sx={{ fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 650 }}
              >
                LongCare CDSS
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 360, lineHeight: 1.7 }}>
              Clinically driven decision support for primary care — evidence retrieval,
              multi-agent reasoning, and physician approval at the point of care.
            </Typography>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'secondary.light', mb: 2 }}>
              Product
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link component={RouterLink} to="/#categories" color="inherit" underline="hover">
                AI Categories
              </Link>
              <Link component={RouterLink} to="/#considerations" color="inherit" underline="hover">
                Evaluation Guide
              </Link>
              <Link component={RouterLink} to="/app/login" color="inherit" underline="hover">
                Clinician Portal
              </Link>
            </Box>
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'secondary.light', mb: 2 }}>
              Contact
            </Typography>
            <Link href="mailto:contact@longcare.ca" color="inherit" underline="hover">
              contact@longcare.ca
            </Link>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.7 }}>
              Demonstration platform — AI outputs require physician review.
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 3 }} />
        <Typography variant="caption" sx={{ opacity: 0.55 }}>
          © {new Date().getFullYear()} LongCare Clinical Decision Support. Not a medical device for
          clinical use without regulatory clearance.
        </Typography>
      </Container>
    </Box>
  );
}
