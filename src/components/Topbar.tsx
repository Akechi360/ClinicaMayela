import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface TopbarProps {
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  onSearchChange, 
  searchPlaceholder = "Buscar paciente...",
  showSearch = true
}) => {
  const location = useLocation();

  // Obtener el título dinámico según la ruta
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Panel de Gestión';
    if (path.startsWith('/pacientes')) return 'Expedientes Clínicos';
    if (path.startsWith('/agenda')) return 'Agenda de la Clínica';
    if (path.startsWith('/tratamientos')) return 'Catálogo de Tratamientos';
    if (path.startsWith('/galeria')) return 'Galería de Casos';
    if (path.startsWith('/finanzas')) return 'Control Financiero';
    if (path.startsWith('/ajustes')) return 'Ajustes del Sistema';
    if (path.startsWith('/nueva-entrada')) return 'Registro de Tratamiento';
    return 'Rejuvenece';
  };

  return (
    <header className="fixed top-5 right-5 w-[calc(100%-19rem)] h-16 glass-panel rounded-2xl z-40 px-6 flex justify-between items-center shadow-luxury border border-pure-white/40">
      {/* Title */}
      <div>
        <h2 className="text-sm font-display font-light text-slate-dark tracking-[0.2em] uppercase">{getTitle()}</h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5">
        {/* Search */}
        {showSearch && (
          <div className="relative focus-within:ring-1 focus-within:ring-satin-copper/20 rounded-xl bg-pure-white/30 border border-satin-copper/15 px-4 py-1.5 flex items-center transition-all">
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-xs text-slate-dark placeholder-slate-light w-44 font-sans tracking-wide"
            />
            <Search size={12} className="text-satin-copper" />
          </div>
        )}

        {/* Notifications and Help */}
        <div className="flex items-center gap-1 border-r border-rose-champagne/80 pr-4">
          <button aria-label="Notificaciones" className="text-slate-medium hover:text-satin-copper p-1.5 rounded-xl hover:bg-pure-white/50 transition-colors">
            <Bell size={16} />
          </button>
          <button aria-label="Ayuda" className="text-slate-medium hover:text-satin-copper p-1.5 rounded-xl hover:bg-pure-white/50 transition-colors">
            <HelpCircle size={16} />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-dark leading-tight">Dra. Mayela González</p>
            <p className="text-[9px] text-satin-copper font-bold uppercase tracking-wider mt-0.5">Especialista</p>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-satin-copper/20 shadow-md">
            <img 
              alt="Dra. Mayela González" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKjS5i-riOBcVgFNnseY1IRnnqVypzEjBUkXkBg0mjrgCwcOaYqpY2n94ywToDTuGf7j9F-kBWzWB2yiJwHSpIsKiamoCVdIZM7KBz6gc4ugcQ-48g8brWW5T8TZ-Q4ogkIaKVv9CbWgYQuMLnP2WJzM1LZ1hjqVC1Q2Xh0PTGBOy5y6TQ9jNQpt_1TvBu-Ag2hUPkL9pjR3XVDZXnxF8AtZ5w9Vu2IKFWNgKD_HbqnLk6ldR45Oh1q7bKeExBlECNUL8BeqZeIJ8"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
