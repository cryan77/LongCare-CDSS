import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
  Collapse,
  Badge,
  Avatar,
  Chip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicationIcon from '@mui/icons-material/Medication';
import ChatIcon from '@mui/icons-material/Chat';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import TimelineIcon from '@mui/icons-material/Timeline';
import ImageIcon from '@mui/icons-material/Image';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useMemo, useState } from 'react';
import { useAuthStore, useClinicalStore } from '../store';

const DRAWER_WIDTH = 280;

type NavChild = { label: string; path: string; icon?: React.ReactNode };
type NavGroup = {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavChild[];
};

const navGroups: NavGroup[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: <DashboardIcon /> },
  {
    label: 'Patients',
    icon: <PeopleIcon />,
    children: [
      { label: 'Patient List', path: '/app/patients', icon: <PeopleIcon /> },
      { label: 'Patient Workspace', path: '/app/workspace', icon: <TimelineIcon /> },
    ],
  },
  {
    label: 'Clinical AI',
    icon: <BiotechIcon />,
    children: [
      { label: 'Run CDSS', path: '/app/workflow', icon: <AccountTreeIcon /> },
      { label: 'Diagnosis', path: '/app/diagnosis', icon: <BiotechIcon /> },
      { label: 'Treatment', path: '/app/treatment', icon: <MedicationIcon /> },
      { label: 'Medical Chat', path: '/app/chat', icon: <ChatIcon /> },
    ],
  },
  {
    label: 'Medical Imaging',
    icon: <ImageIcon />,
    children: [{ label: 'X-Ray Analysis', path: '/app/imaging', icon: <ImageIcon /> }],
  },
  {
    label: 'Knowledge Base',
    icon: <MenuBookIcon />,
    children: [{ label: 'Search Guidelines', path: '/app/knowledge', icon: <MenuBookIcon /> }],
  },
  {
    label: 'Reports',
    icon: <DescriptionIcon />,
    children: [{ label: 'SOAP / Discharge', path: '/app/documentation', icon: <DescriptionIcon /> }],
  },
  {
    label: 'Administration',
    icon: <AdminPanelSettingsIcon />,
    children: [{ label: 'Users & Audit', path: '/app/admin', icon: <AdminPanelSettingsIcon /> }],
  },
];

export default function AppLayout() {
  const { token, logout, user } = useAuthStore();
  const resetClinical = useClinicalStore((s) => s.resetClinical);
  const selectedPatient = useClinicalStore((s) => s.selectedPatient);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Patients: true,
    'Clinical AI': true,
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (!token) {
    return <Navigate to="/app/login" replace />;
  }

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.25, py: 2.25 }}>
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 34, height: 34 }} />
        <Box>
          <Typography sx={{ fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 650, color: 'primary.main', lineHeight: 1.1 }}>
            LongCare
          </Typography>
          <Typography variant="caption" color="text.secondary">
            AI-CDSS Clinical
          </Typography>
        </Box>
      </Toolbar>

      <List sx={{ px: 1, flexGrow: 1, overflow: 'auto' }}>
        {navGroups.map((group) => {
          if (!group.children) {
            const selected = location.pathname === group.path;
            return (
              <ListItemButton
                key={group.label}
                selected={selected}
                onClick={() => {
                  navigate(group.path!);
                  setMobileOpen(false);
                }}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>{group.icon}</ListItemIcon>
                <ListItemText primary={group.label} />
              </ListItemButton>
            );
          }

          const open = openGroups[group.label] ?? false;
          return (
            <Box key={group.label}>
              <ListItemButton onClick={() => toggleGroup(group.label)} sx={{ borderRadius: 2, mb: 0.25 }}>
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>{group.icon}</ListItemIcon>
                <ListItemText
                  primary={group.label}
                  slotProps={{ primary: { sx: { fontWeight: 650 } } }}
                />
                {open ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {group.children.map((child) => (
                    <ListItemButton
                      key={child.path}
                      selected={location.pathname === child.path}
                      onClick={() => {
                        navigate(child.path);
                        setMobileOpen(false);
                      }}
                      sx={{ pl: 4, borderRadius: 2, mb: 0.25 }}
                    >
                      <ListItemText primary={child.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}

        <ListItemButton
          onClick={() => {
            logout();
            resetClinical();
            navigate('/');
          }}
          sx={{ borderRadius: 2, mt: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>

      {selectedPatient && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'primary.50', background: 'rgba(26,79,140,0.04)' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Active patient
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 650 }}>
            {selectedPatient.first_name} {selectedPatient.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedPatient.mrn}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <LocalHospitalIcon sx={{ color: 'primary.main', display: { xs: 'none', sm: 'block' } }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                LongCare Clinic
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {greeting}, {user?.full_name || 'Clinician'}
              </Typography>
            </Box>
          </Box>

          <Chip
            size="small"
            label="Physician approval required"
            color="warning"
            variant="outlined"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          />

          <IconButton>
            <Badge color="error" variant="dot">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {(user?.full_name || 'D')
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 650, lineHeight: 1.2 }}>
                {user?.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {user?.role}
              </Typography>
            </Box>
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
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          mt: 8,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
