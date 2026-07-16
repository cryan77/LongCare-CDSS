import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const [email, setEmail] = useState('doctor@longcare.ca');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token } = await authApi.login(email, password);
      localStorage.setItem('token', access_token);
      const user = await authApi.me();
      setAuth(access_token, user);
      navigate('/app/dashboard');
    } catch {
      setError('Invalid credentials. Try doctor@ / nurse@ / admin@longcare.ca with demo1234');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 72px)',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          minHeight: 520,
        }}
      >
        <Box
          component="img"
          src="/images/care-consultation.jpg"
          alt="Clinical consultation supporting evidence-based care"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(160deg, rgba(6,31,32,0.75) 0%, rgba(15,61,62,0.45) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 6,
            color: 'white',
          }}
        >
          <Typography
            variant="h5"
            sx={{ color: 'secondary.light', mb: 1.5, letterSpacing: '0.08em' }}
          >
            LongCare
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontFamily: '"Source Serif 4", Georgia, serif', mb: 1.5, color: 'white' }}
          >
            Secure clinician access
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 360 }}>
            AI-assisted diagnosis, treatment, imaging, and documentation — with physician approval
            required before clinical action.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, md: 6 },
          bgcolor: 'background.default',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 440, boxShadow: '0 8px 28px rgba(15,61,62,0.1)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h4"
              color="primary.dark"
              gutterBottom
              sx={{ fontFamily: '"Source Serif 4", Georgia, serif', fontSize: '1.75rem' }}
            >
              Clinician Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to access AI-powered clinical decision support tools.
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>
            <Alert severity="info" sx={{ mt: 3 }}>
              Demo: doctor@ / nurse@ / admin@longcare.ca — password demo1234
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
