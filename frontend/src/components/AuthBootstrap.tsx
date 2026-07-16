import { useEffect, useState } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuthStore } from '../store';

/** Loads /auth/me when a token exists; clears invalid sessions. */
export function AuthBootstrap() {
  const { token, user, setAuth, logout } = useAuthStore();
  const [ready, setReady] = useState(!token);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      setReady(true);
      return;
    }
    if (user) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (!cancelled) {
          setAuth(token, me);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          logout();
          setReady(true);
          if (location.pathname.startsWith('/app') && location.pathname !== '/app/login') {
            navigate('/app/login', { replace: true });
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, setAuth, logout, navigate, location.pathname]);

  if (!ready && location.pathname.startsWith('/app') && location.pathname !== '/app/login') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return null;
}
