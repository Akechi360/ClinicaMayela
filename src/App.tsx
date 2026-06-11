import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WhatsappSimulator } from './components/WhatsappSimulator';

// Vistas
import { Dashboard } from './views/Dashboard';
import { Patients } from './views/Patients';
import { PatientDetail } from './views/PatientDetail';
import { NewEntry } from './views/NewEntry';
import { Agenda } from './views/Agenda';
import { TreatmentsCatalog } from './views/TreatmentsCatalog';
import { Finances } from './views/Finances';
import { Gallery } from './views/Gallery';
import { ClinicSettings } from './views/ClinicSettings';

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

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Patrón de puntos de fondo */}
      <div className="bg-grid-overlay"></div>

      {/* Barra de Navegación Lateral */}
      <Sidebar onNewCitaClick={() => navigate('/nueva-entrada')} />

      {/* Área de Contenido Principal */}
      <div className="flex-1 ml-[18rem] mr-5 flex flex-col min-h-screen">
        {/* Cabecera superior */}
        <Topbar />

        {/* Contenido dinámico principal (Desplazado hacia abajo por la Topbar) */}
        <main className="flex-1 pt-28 pb-16 max-w-7xl w-full mx-auto">
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
          </Routes>
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
