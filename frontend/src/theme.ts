import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2d6a4f',
      light: '#40916c',
      dark: '#1b4332',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#52b788',
      light: '#74c69d',
      dark: '#2d6a4f',
    },
    background: {
      default: '#fafbfa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
    },
    success: {
      main: '#2d6a4f',
    },
    warning: {
      main: '#e9c46a',
    },
    error: {
      main: '#c1121f',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    body1: {
      fontSize: '1.0625rem',
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 6,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e8ece9',
        },
      },
    },
  },
});
