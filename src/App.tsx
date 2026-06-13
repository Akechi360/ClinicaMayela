import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WhatsappSimulator } from './components/WhatsappSimulator';
import { PageLoadSkeleton } from './components/PageLoadSkeleton';

// Vistas con Lazy Loading (Named exports)
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

// Layout interno para tener acceso a `useNavigate` de React Router
const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent relative">
      {/* Imagen de fondo premium fixed */}
      <div className="bg-app-image"></div>

      {/* Patrón de puntos de fondo */}
      <div className="bg-grid-overlay"></div>

      {/* Backdrop para móviles */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-dark/30 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Barra de Navegación Lateral */}
      <Sidebar 
        onNewCitaClick={() => {
          setMobileMenuOpen(false);
          navigate('/nueva-entrada');
        }} 
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Área de Contenido Principal */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-[7.25rem]' : 'lg:ml-[18.25rem]'} ml-5 mr-5 flex flex-col min-h-screen`}>
        {/* Cabecera superior */}
        <Topbar 
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Contenido dinámico principal (Desplazado hacia abajo por la Topbar) */}
        <main className="flex-1 pt-28 pb-16 max-w-7xl w-full mx-auto">
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
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Simulador flotante del Bot de WhatsApp */}
      <WhatsappSimulator />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppLayout />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
