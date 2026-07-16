import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const isApp = location.pathname.startsWith('/app');

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255,255,255,0.92)',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1.25, gap: 1 }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
            }}
          >
            <Box
              component="img"
              src="/favicon.svg"
              alt=""
              sx={{ width: 36, height: 36 }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Source Serif 4", Georgia, serif',
                  fontWeight: 650,
                  color: 'primary.main',
                  lineHeight: 1.1,
                  fontSize: '1.25rem',
                }}
              >
                LongCare
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                }}
              >
                Clinical Decision Support
              </Typography>
            </Box>
          </Box>

          {!isApp ? (
            <>
              <Button
                component={RouterLink}
                to="/#considerations"
                color="inherit"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Evaluation
              </Button>
              <Button
                component={RouterLink}
                to="/#categories"
                color="inherit"
                sx={{ display: { xs: 'none', md: 'inline-flex' }, mr: 1 }}
              >
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
