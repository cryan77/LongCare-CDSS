import { Box, Container, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'primary.dark',
        color: 'white',
        py: 6,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          LongCare CDSS
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 3 }}>
          Clinically driven. Digitally inspired.
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Link component={RouterLink} to="/" color="inherit" underline="hover">
            About
          </Link>
          <Link component={RouterLink} to="/app/login" color="inherit" underline="hover">
            Clinician Portal
          </Link>
          <Link href="mailto:contact@longcare.ca" color="inherit" underline="hover">
            Contact
          </Link>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mt: 4, opacity: 0.6 }}>
          © {new Date().getFullYear()} LongCare Clinical Decision Support. For demonstration purposes only.
        </Typography>
      </Container>
    </Box>
  );
}
