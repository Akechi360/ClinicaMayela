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

  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

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
    return 'Clínica Mayela';
  };

  return (
    <header
      className={`fixed top-3 sm:top-5 right-3 sm:right-5 left-3 sm:left-5 lg:right-5
        h-14 sm:h-16
        bg-white rounded-2xl z-40
        px-3 sm:px-6
        flex justify-between items-center
        shadow-luxury border border-[#EEEEF0]
        transition-all duration-300
        ${
          sidebarCollapsed
            ? 'lg:left-[7.25rem]'
            : 'lg:left-[18.25rem]'
        }`}
    >
      {/* Título */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Abrir menú de navegación"
          className="lg:hidden text-slate-medium hover:text-rosa-petalo p-1.5 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer shrink-0"
        >
          <Menu size={18} />
        </button>
        <h2 className="text-[11px] sm:text-xs md:text-sm font-display font-medium text-slate-dark tracking-[0.1em] sm:tracking-[0.15em] uppercase truncate max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-none">
          {getTitle()}
        </h2>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0">
        {showSearch && (
          <div className="hidden sm:flex relative focus-within:ring-1 focus-within:ring-rosa-petalo/30 rounded-xl bg-[#F7F8FA] border border-[#EEEEF0] px-3 py-1.5 items-center transition-all">
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-[10px] md:text-xs text-slate-dark placeholder-slate-light w-28 sm:w-36 md:w-44 lg:w-52 font-sans tracking-wide"
            />
            <Search size={12} className="text-slate-light shrink-0" />
          </div>
        )}

        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-[#EEEEF0] pr-2 sm:pr-4 shrink-0">
          <button aria-label="Notificaciones" className="text-slate-light hover:text-rosa-petalo p-1 sm:p-1.5 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer">
            <Bell size={15} />
          </button>
          <button aria-label="Ayuda" className="hidden sm:block text-slate-light hover:text-rosa-petalo p-1.5 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer">
            <HelpCircle size={15} />
          </button>
        </div>

        <div className="flex items-center shrink-0">
          {doctor && (
            <Link
              to="/perfil"
              aria-label="Ver perfil profesional"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-[#EEEEF0] hover:border-rosa-petalo shadow-sm cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <img
                alt={doctor.nombre}
                src={doctor.foto_perfil || doctor.foto}
                className="w-full h-full object-cover"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
