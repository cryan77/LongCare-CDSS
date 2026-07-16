import { AppBar, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

export default function Header() {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'white',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <LocalHospitalIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 32 }} />
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
            }}
          >
            LongCare CDSS
          </Typography>
          {!isApp ? (
            <>
              <Button component={RouterLink} to="/#considerations" color="inherit" sx={{ mr: 1 }}>
                Evaluation
              </Button>
              <Button component={RouterLink} to="/#categories" color="inherit" sx={{ mr: 2 }}>
                AI Categories
              </Button>
              <Button component={RouterLink} to="/app/login" variant="contained" color="primary">
                Clinician Portal
              </Button>
            </>
          ) : (
            <Button component={RouterLink} to="/" color="inherit">
              Back to Home
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
