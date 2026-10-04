import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dbDoctor, dbNotificaciones } from '../services/db';
import type { Notificacion } from '../services/db';
import { supabase } from '../services/supabase';
import { Bell, HelpCircle, Menu, Check } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  sidebarCollapsed: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  sidebarCollapsed
}) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

  const { data: notificaciones = [] } = useQuery<Notificacion[]>({
    queryKey: ['notificaciones'],
    queryFn: dbNotificaciones.listarNoLeidas,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('notificaciones-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleMarkAllRead = async () => {
    await dbNotificaciones.marcarTodasLeidas();
    queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    setShowNotifications(false);
  };

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
    if (path.startsWith('/consentimientos')) return 'Consentimientos';
    if (path.startsWith('/peptides')) return 'Protocolos de Péptidos';
    return 'Clínica Mayela';
  };

  const unreadCount = notificaciones.length;

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

      <div className="flex items-center gap-2 sm:gap-3 md:gap-5 shrink-0">
        <GlobalSearch />

        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-[#EEEEF0] pr-2 sm:pr-4 shrink-0">
          <div className="relative">
            <button
              aria-label="Notificaciones"
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-slate-light hover:text-rosa-petalo p-1 sm:p-1.5 rounded-xl hover:bg-[#F7F8FA] transition-colors cursor-pointer relative"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rosa-petalo text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-luxury border border-[#EEEEF0] overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EEEEF0]">
                  <span className="text-xs font-medium text-slate-dark">Notificaciones</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-rosa-petalo hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Check size={10} /> Marcar todas leídas
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <p className="text-xs text-slate-light text-center py-6">Sin notificaciones nuevas</p>
                  ) : (
                    notificaciones.map((n) => (
                      <div key={n.id} className="px-4 py-2.5 border-b border-[#EEEEF0] last:border-0 hover:bg-[#F7F8FA]">
                        <p className="text-[11px] text-slate-dark">{n.mensaje}</p>
                        <p className="text-[9px] text-slate-light mt-0.5">
                          {new Date(n.created_at).toLocaleString('es-MX')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
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
                src={doctor.foto_perfil ?? doctor.foto ?? undefined}
                className="w-full h-full object-cover"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
