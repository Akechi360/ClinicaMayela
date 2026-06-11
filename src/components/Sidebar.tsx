import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Sparkles, 
  Image, 
  DollarSign, 
  Settings, 
  LogOut,
  Plus
} from 'lucide-react';

interface SidebarProps {
  onNewCitaClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewCitaClick }) => {
  const location = useLocation();

  const menuItems = [
    { name: 'Panel', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Pacientes', path: '/pacientes', icon: <Users size={18} /> },
    { name: 'Agenda', path: '/agenda', icon: <Calendar size={18} /> },
    { name: 'Tratamientos', path: '/tratamientos', icon: <Sparkles size={18} /> },
    { name: 'Galería', path: '/galeria', icon: <Image size={18} /> },
    { name: 'Finanzas', path: '/finanzas', icon: <DollarSign size={18} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 h-[calc(100vh-2.5rem)] glass-panel rounded-3xl flex flex-col justify-between py-8 px-5 fixed left-5 top-5 z-50 shadow-luxury border border-pure-white/40">
      <div>
        {/* Brand Header (High-fashion Cosmetics Style) */}
        <div className="flex flex-col items-center mb-10 text-center select-none group">
          <div className="w-12 h-12 rounded-full bg-satin-copper/10 border border-satin-copper/20 flex items-center justify-center mb-3 transition-transform duration-700 group-hover:rotate-180">
            <span className="material-symbols-outlined text-satin-copper text-xl font-light">spa</span>
          </div>
          <h1 className="text-base font-display font-light text-slate-dark tracking-[0.3em] uppercase transition-colors group-hover:text-satin-copper duration-500">Rejuvenece</h1>
          <div className="w-6 h-[1px] bg-satin-copper/30 my-2"></div>
          <p className="text-[8px] uppercase tracking-[0.25em] text-satin-copper font-semibold">Dra. Mayela González</p>
        </div>

        {/* Action Button */}
        <button 
          onClick={onNewCitaClick}
          className="w-full satin-button text-pure-white py-3 rounded-xl transition-all duration-300 mb-8 flex items-center justify-center gap-1.5 font-sans font-bold text-[10px] tracking-[0.15em] uppercase hover:shadow-[0_12px_30px_rgba(166,110,83,0.35)]"
        >
          <Plus size={13} /> Nueva Cita
        </button>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-semibold tracking-wider font-sans transition-all duration-500 relative group ${
                  active 
                    ? 'sidebar-active-item text-pure-white' 
                    : 'text-slate-medium hover:text-slate-dark hover:bg-pure-white/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${active ? 'text-satin-copper-light' : 'text-slate-light group-hover:text-satin-copper'} transition-colors duration-500`}>
                    {item.icon}
                  </span>
                  <span className="uppercase tracking-[0.1em]">{item.name}</span>
                </div>
                {active ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-satin-copper-light shadow-[0_0_8px_#C28E75]"></span>
                ) : (
                  <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-satin-copper/40 transition-all duration-300"></span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings & Logout */}
      <div className="border-t border-rose-champagne/40 pt-6 space-y-1.5">
        <Link
          to="/ajustes"
          className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-semibold tracking-wider font-sans transition-all duration-500 relative group ${
            isActive('/ajustes') 
              ? 'sidebar-active-item text-pure-white' 
              : 'text-slate-medium hover:text-slate-dark hover:bg-pure-white/40 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings size={15} className={isActive('/ajustes') ? 'text-satin-copper-light' : 'text-slate-light group-hover:text-satin-copper'} />
            <span className="uppercase tracking-[0.1em]">Ajustes</span>
          </div>
          {isActive('/ajustes') ? (
            <span className="w-1.5 h-1.5 rounded-full bg-satin-copper-light shadow-[0_0_8px_#C28E75]"></span>
          ) : (
            <span className="w-1 h-1 rounded-full bg-transparent group-hover:bg-satin-copper/40 transition-all duration-300"></span>
          )}
        </Link>
        <button
          onClick={() => alert('Cerrar sesión simulado')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-semibold tracking-wider font-sans text-slate-medium hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 text-left uppercase"
        >
          <LogOut size={15} className="text-slate-light" />
          <span className="tracking-[0.1em]">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
