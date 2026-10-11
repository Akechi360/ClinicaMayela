import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Limpia la caché antigua de respuestas de API (podía devolver datos viejos y guardar datos de pacientes en el equipo)
if ('caches' in window) { void caches.delete('app-cache'); }

createRoot(document.getElementById('root')!).render(
  <App />
)
