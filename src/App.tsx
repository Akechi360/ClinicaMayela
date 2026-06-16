import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WhatsappSimulator } from './components/WhatsappSimulator';
import { PageLoadSkeleton } from './components/PageLoadSkeleton';
import { ComingSoon } from './views/ComingSoon';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';

// Vistas con Lazy Loading
const Dashboard = lazy(() => import('./views/Dashboard').then(m => ({ default: m.Dashboard })));
const Patients = lazy(() => import('./views/Patients').then(m => ({ default: m.Patients })));
const PatientDetail = lazy(() => import('./views/PatientDetail').then(m => ({ default: m.PatientDetail })));
const NewEntry = lazy(() => import('./views/NewEntry').then(m => ({ default: m.NewEntry })));
const Agenda = lazy(() => import('./views/Agenda').then(m => ({ default: m.Agenda })));
const TreatmentsCatalog = lazy(() => import('./views/TreatmentsCatalog').then(m => ({ default: m.TreatmentsCatalog })));
const Finances = lazy(() => import('./views/Finances').then(m => ({ default: m.Finances })));
const Gallery = lazy(() => import('./views/Gallery').then(m => ({ default: m.Gallery })));
const ClinicSettings = lazy(() => import('./views/ClinicSettings').then(m => ({ default: m.ClinicSettings })));
const Consentimientos = lazy(() => import('./views/Consentimientos').then(m => ({ default: m.Consentimientos })));
const DoctorProfile = lazy(() => import('./views/DoctorProfile').then(m => ({ default: m.DoctorProfile })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate('/sesion-cerrada');
  };

  return (
    <div className="flex min-h-screen bg-transparent relative">
      <div className="bg-app-image"></div>
      <div className="bg-grid-overlay"></div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-dark/30 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        onNewCitaClick={() => {
          setMobileMenuOpen(false);
          navigate('/nueva-entrada');
        }}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div
        className={`flex-1 transition-all duration-300
          ${
            sidebarCollapsed
              ? 'lg:ml-[7.25rem]'
              : 'lg:ml-[18.25rem]'
          }
          ml-0 lg:mr-5
          px-3 sm:px-4 lg:px-0
          flex flex-col min-h-screen`}
      >
        <Topbar
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20 max-w-screen-2xl w-full mx-auto">
          <Suspense fallback={<PageLoadSkeleton />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pacientes" element={<Patients />} />
              <Route path="/pacientes/:id" element={<PatientDetail />} />
              <Route path="/nueva-entrada" element={<NewEntry />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/tratamientos" element={<TreatmentsCatalog />} />
              <Route path="/finanzas" element={<Finances />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/ajustes" element={<ClinicSettings />} />
              <Route path="/consentimientos" element={<Consentimientos />} />
              <Route path="/perfil" element={<DoctorProfile />} />
              <Route
                path="/sesion-cerrada"
                element={
                  <ComingSoon
                    moduleName="Sesión Cerrada"
                    progress={40}
                  />
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>

      <WhatsappSimulator />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <AppLayout />
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
