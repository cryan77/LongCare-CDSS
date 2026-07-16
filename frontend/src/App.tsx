import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppLayout from './layouts/AppLayout';
import RoleRoute from './components/RoleRoute';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import DiagnosisPage from './pages/DiagnosisPage';
import TreatmentPage from './pages/TreatmentPage';
import ChatPage from './pages/ChatPage';
import DocumentationPage from './pages/DocumentationPage';
import WorkflowPage from './pages/WorkflowPage';
import TimelinePage from './pages/TimelinePage';
import ImagingPage from './pages/ImagingPage';
import PatientWorkspacePage from './pages/PatientWorkspacePage';
import KnowledgePage from './pages/KnowledgePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAIConfigPage from './pages/admin/AdminAIConfigPage';
import AdminKnowledgePage from './pages/admin/AdminKnowledgePage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminMonitoringPage from './pages/admin/AdminMonitoringPage';
import NurseDashboardPage from './pages/nurse/NurseDashboardPage';
import NurseVitalsPage from './pages/nurse/NurseVitalsPage';
import NurseMedicationsPage from './pages/nurse/NurseMedicationsPage';
import NurseTasksPage from './pages/nurse/NurseTasksPage';
import PatientPortalPage from './pages/patient/PatientPortalPage';
import { AuthBootstrap } from './components/AuthBootstrap';
import { useAuthStore } from './store';
import { homePathForRole } from './roles';

const queryClient = new QueryClient();

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  return <RoleRoute>{children}</RoleRoute>;
}

function AppHomeRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  return <Navigate to={homePathForRole(role)} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthBootstrap />
          <Routes>
            <Route
              path="/"
              element={
                <PublicLayout>
                  <LandingPage />
                </PublicLayout>
              }
            />
            <Route
              path="/app/login"
              element={
                <PublicLayout>
                  <LoginPage />
                </PublicLayout>
              }
            />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<AppHomeRedirect />} />

              {/* Doctor */}
              <Route path="dashboard" element={<Guard><DashboardPage /></Guard>} />
              <Route path="workflow" element={<Guard><WorkflowPage /></Guard>} />
              <Route path="diagnosis" element={<Guard><DiagnosisPage /></Guard>} />
              <Route path="treatment" element={<Guard><TreatmentPage /></Guard>} />
              <Route path="imaging" element={<Guard><ImagingPage /></Guard>} />
              <Route path="knowledge" element={<Guard><KnowledgePage /></Guard>} />
              <Route path="documentation" element={<Guard><DocumentationPage /></Guard>} />

              {/* Shared clinician */}
              <Route path="patients" element={<Guard><PatientsPage /></Guard>} />
              <Route path="workspace" element={<Guard><PatientWorkspacePage /></Guard>} />
              <Route path="timeline" element={<Guard><TimelinePage /></Guard>} />
              <Route path="chat" element={<Guard><ChatPage /></Guard>} />

              {/* Admin portal */}
              <Route path="admin" element={<Guard><AdminDashboardPage /></Guard>} />
              <Route path="admin/users" element={<Guard><AdminUsersPage /></Guard>} />
              <Route path="admin/ai" element={<Guard><AdminAIConfigPage /></Guard>} />
              <Route path="admin/knowledge" element={<Guard><AdminKnowledgePage /></Guard>} />
              <Route path="admin/audit" element={<Guard><AdminAuditPage /></Guard>} />
              <Route path="admin/monitoring" element={<Guard><AdminMonitoringPage /></Guard>} />

              {/* Nurse portal */}
              <Route path="nurse" element={<Guard><NurseDashboardPage /></Guard>} />
              <Route path="nurse/vitals" element={<Guard><NurseVitalsPage /></Guard>} />
              <Route path="nurse/medications" element={<Guard><NurseMedicationsPage /></Guard>} />
              <Route path="nurse/tasks" element={<Guard><NurseTasksPage /></Guard>} />

              {/* Patient portal */}
              <Route path="patient" element={<Guard><PatientPortalPage /></Guard>} />
              <Route path="patient/health" element={<Guard><PatientPortalPage /></Guard>} />
              <Route path="patient/medications" element={<Guard><PatientPortalPage /></Guard>} />
              <Route path="patient/appointments" element={<Guard><PatientPortalPage /></Guard>} />
              <Route path="patient/chat" element={<Guard><PatientPortalPage /></Guard>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
