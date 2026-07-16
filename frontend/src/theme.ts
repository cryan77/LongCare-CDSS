import { createTheme, alpha } from '@mui/material/styles';

const teal = {
  50: '#eef6f5',
  100: '#d5ebe8',
  200: '#a9d4cf',
  300: '#7eb8a8',
  400: '#4f9589',
  500: '#2f7369',
  600: '#1f5a52',
  700: '#0f3d3e',
  800: '#0a2e2f',
  900: '#061f20',
};

export const theme = createTheme({
  palette: {
    primary: {
      main: teal[700],
      light: teal[500],
      dark: teal[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c4a35a',
      light: '#d4bc84',
      dark: '#9a7d3d',
      contrastText: '#061f20',
    },
    background: {
      default: '#f4f7f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#13201f',
      secondary: '#4a5c5a',
    },
    divider: '#dce6e3',
    success: { main: teal[500] },
    warning: { main: '#c4a35a' },
    error: { main: '#b42318' },
    info: { main: teal[500] },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", Helvetica, Arial, sans-serif',
    h1: {
      fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif',
      fontWeight: 600,
      fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
      lineHeight: 1.15,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif',
      fontWeight: 600,
      fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)',
      lineHeight: 1.25,
    },
    h3: {
      fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif',
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h4: {
      fontFamily: '"Source Sans 3", sans-serif',
      fontWeight: 600,
      fontSize: '1.2rem',
    },
    h5: {
      fontFamily: '"Source Sans 3", sans-serif',
      fontWeight: 600,
      fontSize: '0.85rem',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    h6: {
      fontFamily: '"Source Sans 3", sans-serif',
      fontWeight: 700,
    },
    body1: {
      fontSize: '1.0625rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.95rem',
      lineHeight: 1.65,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(ellipse at top left, rgba(126, 184, 168, 0.12), transparent 45%), radial-gradient(ellipse at bottom right, rgba(196, 163, 90, 0.08), transparent 40%)',
          backgroundAttachment: 'fixed',
        },
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 22px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(15, 61, 62, 0.22)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(15, 61, 62, 0.05)',
          border: `1px solid ${alpha(teal[700], 0.1)}`,
          backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #fbfdfe 100%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${alpha(teal[700], 0.12)}`,
          background: `linear-gradient(180deg, ${teal[50]} 0%, #ffffff 40%)`,
        },
      },
    },
  },
});
