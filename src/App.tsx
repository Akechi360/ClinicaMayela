import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WhatsappSimulator } from './components/WhatsappSimulator';
import { PageLoadSkeleton } from './components/PageLoadSkeleton';
import { InactivityGuard } from './components/InactivityGuard';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import { Login } from './views/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { supabase } from './services/supabase';

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
const PeptidesProtocol = lazy(() => import('./views/PeptidesProtocol').then(m => ({ default: m.PeptidesProtocol })));
const PeptidesConsent = lazy(() => import('./views/PeptidesConsent').then(m => ({ default: m.PeptidesConsent })));
const PeptidesReport = lazy(() => import('./views/PeptidesReport').then(m => ({ default: m.PeptidesReport })));
const VerifyRecipe = lazy(() => import('./views/VerifyRecipe').then(m => ({ default: m.VerifyRecipe })));
const AvisoLegal = lazy(() => import('./views/legal/paginas').then(m => ({ default: m.AvisoLegal })));
const Privacidad = lazy(() => import('./views/legal/paginas').then(m => ({ default: m.Privacidad })));
const Seguridad = lazy(() => import('./views/legal/paginas').then(m => ({ default: m.Seguridad })));
const Cookies = lazy(() => import('./views/legal/paginas').then(m => ({ default: m.Cookies })));
const LandingPage = lazy(() => import('./views/LandingPage').then(m => ({ default: m.LandingPage })));

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    navigate('/login');
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
        className={`flex-1 min-w-0 transition-all duration-300
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

        <main className="flex-1 min-w-0 pt-24 sm:pt-28 pb-24 sm:pb-24 max-w-screen-2xl w-full mx-auto">
          <Suspense fallback={<PageLoadSkeleton />}>
            <Routes>
              {/* ESCALABILIDAD: agregar aquí rutas de portal de pacientes
                  cuando se implemente el sistema de roles. Ejemplo:
                  <Route path="/portal/*" element={<PatientPortal />} /> */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
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
              <Route path="/peptides" element={<PeptidesProtocol />} />
              <Route path="/peptides/consent/:protocolId" element={<PeptidesConsent />} />
              <Route path="/peptides/report/:protocolId" element={<PeptidesReport />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      <WhatsappSimulator />
      <InactivityGuard />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <Routes>
              <Route
                path="/"
                element={
                  <Suspense fallback={<PageLoadSkeleton />}>
                    <LandingPage />
                  </Suspense>
                }
              />
              <Route path="/login" element={<Login />} />
              {[['/aviso-legal', AvisoLegal], ['/privacidad', Privacidad], ['/seguridad', Seguridad], ['/cookies', Cookies]].map(([path, Page]) => {
                const P = Page as React.LazyExoticComponent<React.FC>;
                return <Route key={path as string} path={path as string} element={<Suspense fallback={<PageLoadSkeleton />}><P /></Suspense>} />;
              })}
              <Route
                path="/v/:codigo"
                element={
                  <Suspense fallback={<PageLoadSkeleton />}>
                    <VerifyRecipe />
                  </Suspense>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
