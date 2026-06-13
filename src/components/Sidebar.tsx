import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dbDoctor } from '../services/db';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Sparkles, 
  FileText,
  Image, 
  DollarSign, 
  Settings, 
  LogOut,
  Plus,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  onNewCitaClick: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onNewCitaClick, 
  collapsed, 
  onToggleCollapse, 
  mobileOpen, 
  onCloseMobile 
}) => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Consultar perfil de la doctora
  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

  const clinicalItems = [
    { name: 'Panel', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Agenda', path: '/agenda', icon: <Calendar size={18} /> },
    { name: 'Pacientes', path: '/pacientes', icon: <Users size={18} /> },
    { name: 'Consentimientos', path: '/consentimientos', icon: <FileText size={18} /> },
  ];

  const adminItems = [
    { name: 'Tratamientos', path: '/tratamientos', icon: <Sparkles size={18} /> },
    { name: 'Galería', path: '/galeria', icon: <Image size={18} /> },
    { name: 'Finanzas', path: '/finanzas', icon: <DollarSign size={18} /> },
  ];

  const accountItems = [
    { name: 'Mi Perfil', path: '/perfil', icon: <User size={18} /> },
    { name: 'Ajustes', path: '/ajustes', icon: <Settings size={18} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Cierre en Escape y Focus Trap para móviles
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile();
      }
      if (e.key === 'Tab') {
        const focusableElements = sidebarRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstEl = focusableElements[0] as HTMLElement;
        const lastEl = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  return (
    <aside 
      ref={sidebarRef}
      className={`fixed transition-all duration-300 z-50 shadow-luxury border border-pure-white/40 glass-panel lg:rounded-3xl rounded-r-3xl
        lg:left-5 lg:top-5 lg:h-[calc(100vh-2.5rem)]
        left-0 top-0 h-screen lg:translate-x-0
        ${collapsed ? 'lg:w-20' : 'lg:w-64'} 
        w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col justify-between py-6 px-4`}
      aria-label="Menú principal de navegación"
      aria-hidden={!mobileOpen && window.innerWidth < 1024 ? "true" : "false"}
    >
      {/* Botón Colapsar (Desktop) */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-satin-copper hover:bg-satin-copper-hover text-pure-white items-center justify-center border border-pure-white/20 shadow-md cursor-pointer z-50 hover:scale-105 transition-all"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className="space-y-6 overflow-y-auto no-scrollbar pr-1">
        {/* Brand Header (High-fashion Cosmetics Style) */}
        <div className="flex flex-col items-center mb-6 text-center select-none group">
          <div className="w-10 h-10 rounded-full bg-satin-copper/10 border border-satin-copper/20 flex items-center justify-center transition-transform duration-700 group-hover:rotate-180">
            <span className="material-symbols-outlined text-satin-copper text-lg font-light">spa</span>
          </div>
          {!collapsed && (
            <>
              <h1 className="text-sm font-display font-light text-slate-dark tracking-[0.3em] uppercase mt-3 transition-colors group-hover:text-satin-copper duration-500">Rejuvenece</h1>
              <div className="w-6 h-[1px] bg-satin-copper/30 my-2"></div>
              <p className="text-[8px] uppercase tracking-[0.2em] text-satin-copper font-bold truncate max-w-full">
                {doctor?.nombre || 'Dra. Mayela González'}
              </p>
            </>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={onNewCitaClick}
          aria-label="Programar nueva cita"
          className="w-full satin-button text-pure-white py-3 rounded-xl transition-all duration-300 mb-6 flex items-center justify-center gap-1.5 font-sans font-bold text-[10px] tracking-[0.15em] uppercase hover:shadow-[0_12px_30px_rgba(166,110,83,0.35)] cursor-pointer"
        >
          <Plus size={14} /> 
          {!collapsed && <span>Nueva Cita</span>}
        </button>

        {/* Navigation Blocks */}
        <div className="space-y-5">
          {/* Bloque Clínico */}
          <div className="space-y-1.5">
            {!collapsed && <p className="text-[8px] uppercase tracking-[0.2em] text-slate-light font-bold px-3">Clínica</p>}
            <nav className="space-y-1">
              {clinicalItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.name : undefined}
                    aria-label={item.name}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-semibold tracking-wider font-sans transition-all duration-300 relative group ${
                      active 
                        ? 'sidebar-active-item text-pure-white shadow-sm' 
                        : 'text-slate-medium hover:text-slate-dark hover:bg-pure-white/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`${active ? 'text-satin-copper-light' : 'text-slate-light group-hover:text-satin-copper'} transition-colors duration-300`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="uppercase tracking-[0.1em]">{item.name}</span>}
                    </div>
                    {!collapsed && (active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-satin-copper-light shadow-[0_0_8px_#C28E75]"></span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-satin-copper/40 transition-all duration-300"></span>
                    ))}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bloque Administrativo */}
          <div className="space-y-1.5">
            {!collapsed && <p className="text-[8px] uppercase tracking-[0.2em] text-slate-light font-bold px-3">Gestión</p>}
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    title={collapsed ? item.name : undefined}
                    aria-label={item.name}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-semibold tracking-wider font-sans transition-all duration-300 relative group ${
                      active 
                        ? 'sidebar-active-item text-pure-white shadow-sm' 
                        : 'text-slate-medium hover:text-slate-dark hover:bg-pure-white/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`${active ? 'text-satin-copper-light' : 'text-slate-light group-hover:text-satin-copper'} transition-colors duration-300`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="uppercase tracking-[0.1em]">{item.name}</span>}
                    </div>
                    {!collapsed && (active ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-satin-copper-light shadow-[0_0_8px_#C28E75]"></span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-satin-copper/40 transition-all duration-300"></span>
                    ))}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Footer Settings & Logout */}
      <div className="border-t border-satin-copper/15 pt-5 space-y-2">
        {/* Enlaces de Cuenta */}
        <nav className="space-y-1">
          {accountItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={collapsed ? item.name : undefined}
                aria-label={item.name}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-semibold tracking-wider font-sans transition-all duration-300 relative group ${
                  active 
                    ? 'sidebar-active-item text-pure-white' 
                    : 'text-slate-medium hover:text-slate-dark hover:bg-pure-white/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`${active ? 'text-satin-copper-light' : 'text-slate-light group-hover:text-satin-copper'} transition-colors duration-300`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="uppercase tracking-[0.1em]">{item.name}</span>}
                </div>
                {!collapsed && (active ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-satin-copper-light shadow-[0_0_8px_#C28E75]"></span>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-satin-copper/40 transition-all duration-300"></span>
                ))}
              </Link>
            );
          })}
        </nav>

        {/* Doctor Info Section */}
        {!collapsed && doctor && (
          <div className="flex items-center gap-3 p-2 bg-pure-white/20 rounded-xl border border-satin-copper/10 select-none">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-satin-copper/25 shadow-sm shrink-0">
              <img src={doctor.foto_perfil} alt={doctor.nombre} className="w-full h-full object-cover" />
            </div>
            <div className="truncate min-w-0 flex-1">
              <p className="text-[9px] font-semibold text-slate-dark truncate leading-tight">{doctor.nombre}</p>
              <p className="text-[7px] text-satin-copper font-bold uppercase tracking-wider truncate mt-0.5">{doctor.especialidad}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => alert('Cerrar sesión simulado')}
          title={collapsed ? "Cerrar Sesión" : undefined}
          aria-label="Cerrar sesión"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-semibold tracking-wider font-sans text-slate-medium hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 text-left uppercase cursor-pointer"
        >
          <LogOut size={15} className="text-slate-light" />
          {!collapsed && <span className="tracking-[0.1em]">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
