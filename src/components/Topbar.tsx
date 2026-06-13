import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dbDoctor } from '../services/db';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

interface TopbarProps {
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  onToggleMobileMenu: () => void;
  sidebarCollapsed: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  onSearchChange, 
  searchPlaceholder = "Buscar paciente...",
  showSearch = true,
  onToggleMobileMenu,
  sidebarCollapsed
}) => {
  const location = useLocation();

  // Consultar perfil de la doctora
  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

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
    if (path.startsWith('/perfil')) return 'Perfil Profesional';
    return 'Rejuvenece';
  };

  return (
    <header className={`fixed top-5 right-5 h-16 glass-panel rounded-2xl z-40 px-6 flex justify-between items-center shadow-luxury border border-pure-white/40 transition-all duration-300 ${
      sidebarCollapsed ? 'lg:w-[calc(100%-8.5rem)]' : 'lg:w-[calc(100%-19.5rem)]'
    } w-[calc(100%-2.5rem)]`}>
      {/* Title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Abrir menú de navegación"
          className="lg:hidden text-slate-medium hover:text-satin-copper p-1.5 rounded-xl hover:bg-pure-white/40 transition-colors cursor-pointer shrink-0"
        >
          <Menu size={18} />
        </button>
        <h2 className="text-xs md:text-sm font-display font-light text-slate-dark tracking-[0.2em] uppercase truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{getTitle()}</h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Search */}
        {showSearch && (
          <div className="relative focus-within:ring-1 focus-within:ring-satin-copper/20 rounded-xl bg-pure-white/30 border border-satin-copper/15 px-3 py-1.5 flex items-center transition-all">
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-[10px] md:text-xs text-slate-dark placeholder-slate-light w-24 sm:w-44 font-sans tracking-wide"
            />
            <Search size={12} className="text-satin-copper shrink-0" />
          </div>
        )}

        {/* Notifications and Help */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-rose-champagne/80 pr-3 sm:pr-4 shrink-0">
          <button aria-label="Notificaciones" className="text-slate-medium hover:text-satin-copper p-1.5 rounded-xl hover:bg-pure-white/50 transition-colors cursor-pointer">
            <Bell size={16} />
          </button>
          <button aria-label="Ayuda" className="text-slate-medium hover:text-satin-copper p-1.5 rounded-xl hover:bg-pure-white/50 transition-colors cursor-pointer">
            <HelpCircle size={16} />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {doctor && (
            <Link 
              to="/perfil" 
              aria-label="Ver perfil profesional" 
              className="w-9 h-9 rounded-full overflow-hidden border border-satin-copper/20 hover:border-satin-copper shadow-md cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <img 
                alt={doctor.nombre} 
                src={doctor.foto_perfil}
                className="w-full h-full object-cover"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
