import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  IconButton,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicationIcon from '@mui/icons-material/Medication';
import ChatIcon from '@mui/icons-material/Chat';
import DescriptionIcon from '@mui/icons-material/Description';
import TimelineIcon from '@mui/icons-material/Timeline';
import ImageIcon from '@mui/icons-material/Image';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useAuthStore, useClinicalStore } from '../store';

const DRAWER_WIDTH = 268;

const navItems = [
  { label: 'Dashboard', path: '/app/dashboard', icon: <DashboardIcon /> },
  { label: 'Patients', path: '/app/patients', icon: <PeopleIcon /> },
  { label: 'Run CDSS', path: '/app/workflow', icon: <AccountTreeIcon /> },
  { label: 'Timeline', path: '/app/timeline', icon: <TimelineIcon /> },
  { label: 'Imaging', path: '/app/imaging', icon: <ImageIcon /> },
  { label: 'Diagnosis', path: '/app/diagnosis', icon: <BiotechIcon /> },
  { label: 'Treatment', path: '/app/treatment', icon: <MedicationIcon /> },
  { label: 'Knowledge Chat', path: '/app/chat', icon: <ChatIcon /> },
  { label: 'Documentation', path: '/app/documentation', icon: <DescriptionIcon /> },
];

export default function AppLayout() {
  const { token, logout, user } = useAuthStore();
  const resetClinical = useClinicalStore((s) => s.resetClinical);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!token) {
    return <Navigate to="/app/login" replace />;
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.25, py: 2 }}>
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 34, height: 34 }} />
        <Box>
          <Typography
            sx={{
              fontFamily: '"Source Serif 4", Georgia, serif',
              fontWeight: 650,
              color: 'primary.main',
              lineHeight: 1.15,
              fontSize: '1.15rem',
            }}
          >
            LongCare
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.04em' }}>
            CDSS Portal
          </Typography>
        </Box>
      </Toolbar>
      <List sx={{ px: 1, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected, &:hover': { bgcolor: 'rgba(15, 61, 62, 0.06)' },
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{ primary: { sx: { fontWeight: 550 } } }}
            />
          </ListItemButton>
        ))}
        <ListItemButton
          onClick={() => {
            logout();
            resetClinical();
            navigate('/');
          }}
          sx={{ borderRadius: 2, mt: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          AI assists — physicians decide
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(255,255,255,0.94)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user?.full_name || 'Clinician'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role || 'doctor'} · Clinical workspace
            </Typography>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', sm: 'block' },
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              bgcolor: 'rgba(196, 163, 90, 0.15)',
              border: '1px solid',
              borderColor: 'rgba(196, 163, 90, 0.35)',
            }}
          >
            <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 600 }}>
              Physician approval required
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
