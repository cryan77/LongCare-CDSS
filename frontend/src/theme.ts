import { createTheme, alpha } from '@mui/material/styles';

/** Clinical UI palette per ui.md — blue / white / gray + status colors */
const clinical = {
  blue: {
    50: '#eef4fb',
    100: '#d6e6f7',
    200: '#a9c9ec',
    300: '#6fa3d9',
    400: '#3d7fc2',
    500: '#2563a8',
    600: '#1a4f8c',
    700: '#143d6e',
    800: '#0f2f54',
    900: '#0a203a',
  },
  gray: {
    50: '#f7f8fa',
    100: '#eef0f3',
    200: '#dde1e7',
    300: '#c5ccd6',
    500: '#6b7785',
    700: '#3d4654',
    900: '#1a1f27',
  },
};

export const theme = createTheme({
  palette: {
    primary: {
      main: clinical.blue[600],
      light: clinical.blue[400],
      dark: clinical.blue[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: clinical.gray[700],
      light: clinical.gray[500],
      dark: clinical.gray[900],
      contrastText: '#ffffff',
    },
    background: {
      default: clinical.gray[50],
      paper: '#ffffff',
    },
    text: {
      primary: clinical.gray[900],
      secondary: clinical.gray[500],
    },
    divider: clinical.gray[200],
    success: { main: '#1b7f4e', light: '#e6f5ed', contrastText: '#fff' },
    warning: { main: '#c48812', light: '#fff6e5', contrastText: '#1a1f27' },
    error: { main: '#c62828', light: '#fdecea', contrastText: '#fff' },
    info: { main: clinical.blue[500], light: clinical.blue[50] },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", Helvetica, Arial, sans-serif',
    h1: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 600,
      fontSize: 'clamp(1.9rem, 2.5vw, 2.4rem)',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 600,
      fontSize: '1.6rem',
    },
    h3: {
      fontFamily: '"Source Serif 4", Georgia, serif',
      fontWeight: 600,
      fontSize: '1.35rem',
    },
    h4: { fontWeight: 650, fontSize: '1.1rem' },
    h5: {
      fontWeight: 700,
      fontSize: '0.75rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    h6: { fontWeight: 650, fontSize: '1rem' },
    body1: { fontSize: '0.98rem', lineHeight: 1.6 },
    body2: { fontSize: '0.9rem', lineHeight: 1.55 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: clinical.gray[50] },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 18px' },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(26, 79, 140, 0.25)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(26, 32, 39, 0.04)',
          border: `1px solid ${clinical.gray[200]}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: `1px solid ${clinical.gray[200]}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#ffffff', 0.96),
          color: clinical.gray[900],
          borderBottom: `1px solid ${clinical.gray[200]}`,
          boxShadow: 'none',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          '&.MuiAlert-colorWarning': { backgroundColor: '#fff6e5', color: '#7a5608' },
          '&.MuiAlert-colorError': { backgroundColor: '#fdecea', color: '#8b1c1c' },
          '&.MuiAlert-colorSuccess': { backgroundColor: '#e6f5ed', color: '#145c38' },
          '&.MuiAlert-colorInfo': { backgroundColor: clinical.blue[50], color: clinical.blue[800] },
        },
      },
    },
  },
});

export const statusColors = {
  safe: '#1b7f4e',
  review: '#c48812',
  critical: '#c62828',
};
