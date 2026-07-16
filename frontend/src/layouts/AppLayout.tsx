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
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useAuthStore } from '../store';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/app/dashboard', icon: <DashboardIcon /> },
  { label: 'Patients', path: '/app/patients', icon: <PeopleIcon /> },
  { label: 'Diagnosis', path: '/app/diagnosis', icon: <BiotechIcon /> },
  { label: 'Treatment', path: '/app/treatment', icon: <MedicationIcon /> },
  { label: 'Knowledge Chat', path: '/app/chat', icon: <ChatIcon /> },
  { label: 'Documentation', path: '/app/documentation', icon: <DescriptionIcon /> },
];

export default function AppLayout() {
  const { token, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!token) {
    return <Navigate to="/app/login" replace />;
  }

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
          LongCare CDSS
        </Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
        <ListItemButton
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
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
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
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
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
            {user?.full_name || 'Clinician'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Physician approval required for all AI recommendations
          </Typography>
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
