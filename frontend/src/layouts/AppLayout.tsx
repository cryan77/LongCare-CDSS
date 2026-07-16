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
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicationIcon from '@mui/icons-material/Medication';
import ChatIcon from '@mui/icons-material/Chat';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ImageIcon from '@mui/icons-material/Image';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EventIcon from '@mui/icons-material/Event';
import { useMemo, useState } from 'react';
import { useAuthStore, useClinicalStore } from '../store';
import { homePathForRole, navForRole, portalLabel, type NavGroup } from '../roles';

const DRAWER_WIDTH = 280;

const iconMap: Record<NavGroup['icon'], React.ReactNode> = {
  dashboard: <DashboardIcon />,
  people: <PeopleIcon />,
  ai: <BiotechIcon />,
  imaging: <ImageIcon />,
  knowledge: <MenuBookIcon />,
  reports: <DescriptionIcon />,
  admin: <AdminPanelSettingsIcon />,
  vitals: <MonitorHeartIcon />,
  meds: <MedicationIcon />,
  tasks: <AssignmentIcon />,
  messages: <ChatIcon />,
  health: <FavoriteIcon />,
  appointments: <EventIcon />,
};

export default function AppLayout() {
  const { token, logout, user } = useAuthStore();
  const resetClinical = useClinicalStore((s) => s.resetClinical);
  const selectedPatient = useClinicalStore((s) => s.selectedPatient);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const navGroups = useMemo(() => navForRole(user?.role), [user?.role]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (!token) {
    return <Navigate to="/app/login" replace />;
  }

  // Redirect away from wrong-role default if somehow on /app without role home
  if (user && location.pathname === '/app') {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? true) }));

  const handleLogout = () => {
    setUserMenuAnchor(null);
    logout();
    resetClinical();
    navigate('/');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.25, py: 2.25 }}>
        <Box component="img" src="/favicon.svg" alt="" sx={{ width: 34, height: 34 }} />
        <Box>
          <Typography sx={{ fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 650, color: 'primary.main', lineHeight: 1.1 }}>
            LongCare
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {portalLabel(user?.role)}
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
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>{iconMap[group.icon]}</ListItemIcon>
                <ListItemText primary={group.label} />
              </ListItemButton>
            );
          }

          const open = openGroups[group.label] ?? true;
          return (
            <Box key={group.label}>
              <ListItemButton onClick={() => toggleGroup(group.label)} sx={{ borderRadius: 2, mb: 0.25 }}>
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 40 }}>{iconMap[group.icon]}</ListItemIcon>
                <ListItemText primary={group.label} slotProps={{ primary: { sx: { fontWeight: 650 } } }} />
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
      </List>

      {selectedPatient && user?.role !== 'admin' && user?.role !== 'patient' && (
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', background: 'rgba(26,79,140,0.04)' }}>
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
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <LocalHospitalIcon sx={{ color: 'primary.main', display: { xs: 'none', sm: 'block' } }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                LongCare · {portalLabel(user?.role)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {greeting}, {user?.full_name || 'User'}
              </Typography>
            </Box>
          </Box>

          {user?.role === 'doctor' && (
            <Chip
              size="small"
              label="Physician approval required"
              color="warning"
              variant="outlined"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            />
          )}
          {user?.role === 'nurse' && (
            <Chip
              size="small"
              label="Care documentation"
              color="info"
              variant="outlined"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            />
          )}
          {user?.role === 'admin' && (
            <Chip
              size="small"
              label="System administration"
              color="default"
              variant="outlined"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            />
          )}

          <IconButton>
            <Badge color="error" variant="dot">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          <Box
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              px: 1,
              py: 0.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {(user?.full_name || 'U')
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
            <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          </Box>

          <Menu
            id="user-menu"
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {user?.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || user?.role}
              </Typography>
            </Box>
            <Divider />
            <MenuItem disabled>
              <ListItemIcon>
                <PersonOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
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
