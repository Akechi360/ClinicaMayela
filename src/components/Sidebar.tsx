import React, { useRef, useEffect, useState } from 'react';
import logoSimbolo from '../assets/brand/simbolo.png';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dbDoctor } from '../services/db';
import { supabase } from '../services/supabase';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  FlaskConical,
  Calculator
} from 'lucide-react';

interface SidebarProps {
  onNewCitaClick: () => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem { name: string; path: string; icon: React.ReactNode; count?: number }

const CLAVE_GRUPOS = 'sidebar-grupos-plegados';

/** Iniciales de la doctora ("Dra. Mayela González" → "MG") para cuando no hay foto. */
const iniciales = (nombre?: string | null) => {
  const p = (nombre ?? '').replace(/\b(dra|dr)\.?\s/i, '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? 'M') + (p[1]?.[0] ?? 'G')).toUpperCase();
};

export const Sidebar: React.FC<SidebarProps> = ({
  onNewCitaClick,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}) => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

  // Avisos del menú: citas por confirmar y fichas de ingreso recibidas que aún no se cargan al expediente
  const { data: pendientes } = useQuery({
    queryKey: ['sidebar-pendientes'],
    queryFn: async () => {
      const [citas, fichas] = await Promise.all([
        supabase.from('citas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente').gte('fecha_hora', new Date().toISOString()),
        supabase.from('fichas_ingreso').select('id', { count: 'exact', head: true }).eq('estado', 'recibida'),
      ]);
      return { citas: citas.count ?? 0, fichas: fichas.count ?? 0 };
    },
    refetchInterval: 60_000,
  });

  // Grupos plegables; se recuerda cuáles dejó plegados (solo es una comodidad: si el navegador no lo permite, arrancan abiertos)
  const [plegados, setPlegados] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(CLAVE_GRUPOS) ?? '[]'); } catch { return []; }
  });
  const alternarGrupo = (id: string) => {
    setPlegados((prev) => {
      const nuevo = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(CLAVE_GRUPOS, JSON.stringify(nuevo)); } catch { /* sin almacenamiento */ }
      return nuevo;
    });
  };

  const diario: NavItem[] = [
    { name: 'Panel', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Agenda', path: '/agenda', icon: <Calendar size={18} />, count: pendientes?.citas },
    { name: 'Pacientes', path: '/pacientes', icon: <Users size={18} />, count: pendientes?.fichas },
  ];

  const grupos: { id: string; titulo: string; items: NavItem[] }[] = [
    {
      id: 'clinica',
      titulo: 'Clínica',
      items: [
        { name: 'Consentimientos', path: '/consentimientos', icon: <FileText size={18} /> },
        { name: 'Péptidos', path: '/peptides', icon: <FlaskConical size={18} /> },
        { name: 'Calculadora', path: '/calculadora', icon: <Calculator size={18} /> },
        { name: 'Galería', path: '/galeria', icon: <Image size={18} /> },
      ],
    },
    {
      id: 'gestion',
      titulo: 'Gestión',
      items: [
        { name: 'Tratamientos', path: '/tratamientos', icon: <Sparkles size={18} /> },
        { name: 'Finanzas', path: '/finanzas', icon: <DollarSign size={18} /> },
      ],
    },
  ];

  const ajustes: NavItem = { name: 'Ajustes', path: '/ajustes', icon: <Settings size={18} /> };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
      if (e.key === 'Tab') {
        const els = sidebarRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea'
        );
        if (!els || els.length === 0) return;
        const first = els[0] as HTMLElement;
        const last = els[els.length - 1] as HTMLElement;
        if (e.shiftKey) {
          if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
          if (document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const itemClass = (active: boolean) =>
    `flex items-center h-9 rounded-xl text-[13.5px] font-medium font-sans transition-all duration-300 relative group ${
      collapsed ? 'lg:w-11 lg:mx-auto lg:justify-center lg:px-0 px-2.5 gap-3' : 'px-2.5 gap-3'
    } ${
      active
        ? 'sidebar-active-item text-white shadow-sm'
        : 'text-slate-medium hover:text-slate-dark hover:bg-[#F7F8FA]'
    }`;

  const renderItems = (items: NavItem[]) =>
    items.map((item) => {
      const active = isActive(item.path);
      const hayAviso = !!item.count && item.count > 0;
      const aviso = hayAviso ? (item.count! > 99 ? '99+' : String(item.count)) : null;
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onCloseMobile}
          title={collapsed ? item.name : undefined}
          aria-label={hayAviso ? `${item.name}, ${aviso} pendientes` : item.name}
          aria-current={active ? 'page' : undefined}
          className={itemClass(active)}
        >
          <span className={`${active ? 'text-white' : 'text-slate-light group-hover:text-rosa-petalo'} transition-colors duration-300 shrink-0`}>
            {item.icon}
          </span>
          <span className={`flex-1 truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
          {aviso && (
            <span
              className={`flex items-center justify-center rounded-full font-semibold ${
                collapsed ? 'lg:absolute lg:top-0.5 lg:right-0.5 lg:min-w-4 lg:h-4 lg:text-[9.5px] lg:px-1' : ''
              } min-w-5 h-5 px-1.5 text-[11px] ${active ? 'bg-white/30 text-white' : 'bg-rosa-petalo/20 text-[#7d6482]'}`}
            >
              {aviso}
            </span>
          )}
        </Link>
      );
    });

  return (
    <aside
      ref={sidebarRef}
      className={`fixed transition-all duration-300 z-50 shadow-luxury
        bg-white/70 backdrop-blur-xl border border-white/40
        rounded-r-3xl lg:rounded-3xl
        left-0 top-0 h-screen
        md:left-3 md:top-3 md:h-[calc(100vh-1.5rem)] md:rounded-3xl
        lg:left-5 lg:top-5 lg:h-[calc(100vh-2.5rem)]
        ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
        ${mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+3rem)] lg:translate-x-0'}
        flex flex-col py-4 px-3`}
      aria-label="Menú principal de navegación"
    >
      {/* Botón colapsar */}
      <button
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
        className="hidden lg:flex absolute -right-3 top-16 w-6 h-6 rounded-full rosa-button items-center justify-center shadow-md cursor-pointer z-50 hover:scale-105 transition-all"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Marca */}
      <div className={`flex items-center gap-2.5 px-1.5 pb-3 select-none ${collapsed ? 'lg:justify-center' : ''}`}>
        <Link to="/dashboard" onClick={onCloseMobile} className="shrink-0" aria-label="Ir al panel">
          <img src={logoSimbolo} alt="Clínica Dra. Mayela González" className={collapsed ? 'lg:h-7 h-9 w-auto' : 'h-9 w-auto'} />
        </Link>
        <div className={`min-w-0 flex-1 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
          <p className="font-fraunces text-[13px] font-medium text-slate-dark truncate">{doctor?.nombre || 'Dra. Mayela González'}</p>
          <p className="text-[11px] text-slate-light truncate">{doctor?.especialidad || 'Medicina estética'}</p>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-slate-light hover:text-slate-dark p-1 rounded-xl transition-all cursor-pointer hover:bg-[#F7F8FA]"
          aria-label="Cerrar menú"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nueva cita */}
      <button
        onClick={onNewCitaClick}
        aria-label="Programar nueva cita"
        className={`rosa-button h-10 rounded-xl transition-all duration-300 mb-2 mx-0.5 flex items-center justify-center gap-2 font-sans font-semibold text-[13px] cursor-pointer ${collapsed ? 'lg:w-11 lg:self-center lg:mx-0' : ''}`}
      >
        <Plus size={16} />
        <span className={collapsed ? 'lg:hidden' : ''}>Nueva cita</span>
      </button>

      {/* Navegación (si no cabe, esta zona tiene scroll; el pie siempre queda visible) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1">
        <nav className="space-y-0.5">{renderItems(diario)}</nav>

        {grupos.map((g) => {
          const plegado = !collapsed && plegados.includes(g.id);
          return (
            <div key={g.id} className="pt-1.5">
              {collapsed ? (
                <div className="hidden lg:block w-7 mx-auto border-t border-[#EEE8EE] mb-1.5" />
              ) : null}
              <button
                type="button"
                onClick={() => alternarGrupo(g.id)}
                aria-expanded={!plegado}
                className={`w-full items-center justify-between px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-light hover:text-slate-dark transition-colors cursor-pointer bg-transparent border-none ${collapsed ? 'lg:hidden flex' : 'flex'}`}
              >
                {g.titulo}
                <ChevronDown size={13} className={`transition-transform duration-200 ${plegado ? '-rotate-90' : ''}`} />
              </button>
              {!plegado && <nav className="space-y-0.5">{renderItems(g.items)}</nav>}
            </div>
          );
        })}
      </div>

      {/* Pie: ajustes y la doctora */}
      <div className="border-t border-[#EEE8EE] pt-2 mt-2 space-y-1.5">
        <nav>{renderItems([ajustes])}</nav>

        <div className={`flex items-center gap-2.5 p-1.5 bg-[#F7F3F7] rounded-xl ${collapsed ? 'lg:flex-col lg:bg-transparent lg:p-0 lg:gap-1' : ''}`}>
          <Link
            to="/perfil"
            onClick={onCloseMobile}
            title="Mi perfil"
            aria-label="Mi perfil"
            className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg"
          >
            <div className="w-8 h-8 rounded-[9px] overflow-hidden shrink-0 flex items-center justify-center text-[12px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#c9b2c8,#8a6f88)' }}>
              {doctor?.foto
                ? <img src={doctor.foto} alt="" className="w-full h-full object-cover" />
                : iniciales(doctor?.nombre)}
            </div>
            <div className={`min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="text-[12.5px] font-semibold text-slate-dark truncate">{doctor?.nombre || 'Dra. Mayela González'}</p>
              <p className="text-[11px] text-slate-light">Mi perfil</p>
            </div>
          </Link>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-light hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer bg-transparent border-none shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
