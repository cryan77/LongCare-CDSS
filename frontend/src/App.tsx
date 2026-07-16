import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AppLayout from './layouts/AppLayout';
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
import AdminPage from './pages/AdminPage';
import { AuthBootstrap } from './components/AuthBootstrap';

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
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="workspace" element={<PatientWorkspacePage />} />
              <Route path="workflow" element={<WorkflowPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="imaging" element={<ImagingPage />} />
              <Route path="diagnosis" element={<DiagnosisPage />} />
              <Route path="treatment" element={<TreatmentPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="documentation" element={<DocumentationPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
