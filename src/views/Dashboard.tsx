import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbCitas, dbPacientes, dbTransacciones, dbDoctor } from '../services/db';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Obtener perfil de la doctora
  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

  // Obtener citas
  const { data: citas = [], isLoading: loadingCitas } = useQuery({
    queryKey: ['citas'],
    queryFn: dbCitas.listar
  });

  // Obtener pacientes
  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar
  });

  // Obtener transacciones
  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: dbTransacciones.listar
  });

  // Mutación para actualizar el estado de una cita
  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'confirmado' | 'en_sala' | 'pendiente' | 'cancelado' }) => 
      dbCitas.actualizarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    }
  });

  // Filtrar citas de "hoy" para la lista del panel
  const hoyStr = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter(cita => cita.fecha_hora.startsWith(hoyStr));

  // Estadísticas
  const nuevosPacientes = pacientes.length;
  const procedimientosHoy = citasHoy.length;
  
  // Calcular ingresos mensuales
  const ingresosMensuales = transacciones
    .filter(t => t.estado === 'completado')
    .reduce((sum, t) => sum + t.monto, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmado':
        return (
          <span className="flex items-center gap-1.5 text-muted-olive text-[10px] font-bold uppercase tracking-wider bg-muted-olive/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-olive"></span> Confirmado
          </span>
        );
      case 'en_sala':
        return (
          <span className="flex items-center gap-1.5 text-satin-copper text-[10px] font-bold uppercase tracking-wider bg-satin-copper/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-satin-copper animate-pulse"></span> En Sala
          </span>
        );
      case 'pendiente':
        return (
          <span className="flex items-center gap-1.5 text-slate-medium text-[10px] font-bold uppercase tracking-wider bg-slate-light/20 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-medium"></span> Pendiente
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-500/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 px-2">
      {/* Welcome Header (Luxury Editorial Style) */}
      <div className="relative overflow-hidden rounded-3xl p-10 glass-panel-dark text-pure-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-satin-copper/30">
        {/* Glow de fondo interno */}
        <div className="absolute -right-10 -top-20 w-80 h-80 bg-satin-copper/20 rounded-full filter blur-[90px] pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-slate-light/10 rounded-full filter blur-[90px] pointer-events-none"></div>

        <div className="space-y-3 relative z-10">
          <span className="text-[9px] uppercase tracking-[0.40em] text-satin-copper-light font-bold flex items-center gap-2">
            <span className="w-1.5 h-[1px] bg-satin-copper-light"></span> Sistema de Gestión Clínico
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-light leading-tight tracking-wide">
            Buenos días, <span className="italic font-normal text-rose-champagne tracking-normal">{doctor?.nombre || 'Dra. Mayela González'}</span>
          </h2>
          <p className="text-xs text-rose-champagne/75 font-light tracking-wide font-sans">
            Resumen del día clínico — {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-pure-white/10 backdrop-blur-md border border-satin-copper/20 px-5 py-3.5 rounded-2xl text-center shrink-0 relative z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
          <p className="text-[8px] uppercase tracking-[0.2em] text-satin-copper-light font-bold">CLÍNICA EN LÍNEA</p>
          <div className="flex items-center gap-2 justify-center mt-1.5 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-pure-white text-[10px] uppercase tracking-wider font-bold">Activo</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Side (Spans 8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
            {/* Pacientes */}
            <div className="luxury-card-glow rounded-3xl p-6 luxury-shadow luxury-hover flex flex-col justify-between h-44 relative overflow-hidden group">
              {/* Círculos decorativos vectoriales de alta gama */}
              <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full border border-satin-copper/5 pointer-events-none group-hover:scale-110 duration-700"></div>
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full border border-satin-copper/5 pointer-events-none group-hover:scale-120 duration-700"></div>
              
              <div>
                <div className="w-8 h-8 rounded-full bg-satin-copper/10 text-satin-copper flex items-center justify-center mb-4 border border-satin-copper/15">
                  <Users size={14} />
                </div>
                <h3 className="text-[8px] uppercase tracking-[0.25em] text-slate-light font-bold">Total Pacientes</h3>
                <p className="text-4xl font-display font-normal text-slate-dark mt-1">
                  {nuevosPacientes}
                </p>
              </div>
              <p className="text-[9px] text-muted-olive font-semibold tracking-wide uppercase mt-2">
                Fichas activas
              </p>
            </div>

            {/* Citas de Hoy */}
            <div className="luxury-card-glow rounded-3xl p-6 luxury-shadow luxury-hover flex flex-col justify-between h-44 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full border border-satin-copper/5 pointer-events-none group-hover:scale-110 duration-700"></div>
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full border border-satin-copper/5 pointer-events-none group-hover:scale-120 duration-700"></div>

              <div>
                <div className="w-8 h-8 rounded-full bg-satin-copper/10 text-satin-copper flex items-center justify-center mb-4 border border-satin-copper/15">
                  <Calendar size={14} />
                </div>
                <h3 className="text-[8px] uppercase tracking-[0.25em] text-slate-light font-bold">Procedimientos</h3>
                <p className="text-4xl font-display font-normal text-slate-dark mt-1">
                  {procedimientosHoy}
                </p>
              </div>
              <p className="text-[9px] text-satin-copper font-semibold tracking-wide uppercase mt-2">Programados hoy</p>
            </div>

            {/* Ingresos Mensuales */}
            <div className="luxury-card-glow rounded-3xl p-6 luxury-shadow luxury-hover flex flex-col justify-between h-44 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full border border-satin-copper/5 pointer-events-none group-hover:scale-110 duration-700"></div>
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full border border-satin-copper/5 pointer-events-none group-hover:scale-120 duration-700"></div>

              <div>
                <div className="w-8 h-8 rounded-full bg-satin-copper/10 text-satin-copper flex items-center justify-center mb-4 border border-satin-copper/15">
                  <DollarSign size={14} />
                </div>
                <h3 className="text-[8px] uppercase tracking-[0.25em] text-slate-light font-bold">Caja Estimada</h3>
                <p className="text-3xl font-display font-normal text-slate-dark mt-1.5">
                  {formatCurrency(ingresosMensuales)}
                </p>
              </div>
              <p className="text-[9px] text-muted-olive font-semibold tracking-wide uppercase mt-2">Facturación total</p>
            </div>
          </div>

          {/* Upcoming Treatments List (Floating Cards) */}
          <div className="glass-panel rounded-3xl p-6 luxury-shadow border border-pure-white/40">
            <div className="flex justify-between items-center mb-6 border-b border-rose-champagne/40 pb-4">
              <div>
                <h3 className="text-base font-display font-medium text-slate-dark tracking-wide">Procedimientos del Día</h3>
                <p className="text-[11px] text-slate-light mt-0.5">Agenda clínica de tratamientos programados para hoy.</p>
              </div>
              <Link to="/agenda" className="text-[10px] font-bold uppercase tracking-wider text-satin-copper hover:text-satin-copper-hover transition-colors flex items-center gap-1">
                Ver Agenda <ChevronRight size={12} />
              </Link>
            </div>

            {loadingCitas ? (
              <div className="py-8 text-center text-xs text-slate-light">Cargando agenda del día...</div>
            ) : citasHoy.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-rose-champagne/80 rounded-2xl bg-rose-champagne-light/15">
                <Calendar className="mx-auto text-slate-light mb-2 opacity-50" size={30} />
                <p className="text-xs text-slate-medium font-semibold">No hay citas programadas para hoy.</p>
                <Link to="/agenda" className="text-[9px] text-satin-copper font-bold uppercase tracking-[0.15em] mt-3 inline-block hover:underline">
                  Programar una cita ahora
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {citasHoy.map((cita) => (
                  <div key={cita.id} className="floating-row rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
                    <div className="flex items-center gap-4">
                      {/* Avatar o Iniciales con estilo metálico */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pure-white to-rose-champagne/60 border border-satin-copper/20 flex items-center justify-center text-xs text-satin-copper font-bold shadow-sm">
                        {cita.paciente?.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <Link to={`/pacientes/${cita.paciente_id}`} className="font-display font-medium text-sm text-slate-dark hover:text-satin-copper transition-colors flex items-center gap-2">
                          {cita.paciente?.nombre}
                          {cita.paciente?.es_vip && (
                            <span className="text-[7px] bg-satin-copper/10 border border-satin-copper/20 text-satin-copper font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">VIP</span>
                          )}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-slate-light font-medium tracking-wide uppercase mt-0.5">
                          <span className="font-bold text-satin-copper-light">{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} HS</span>
                          <span>•</span>
                          <span>{cita.tratamiento?.nombre}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div>
                        {getEstadoBadge(cita.estado)}
                      </div>
                      <div className="flex items-center gap-2">
                        {cita.estado === 'pendiente' && (
                          <button 
                            onClick={() => updateEstadoMutation.mutate({ id: cita.id, estado: 'en_sala' })}
                            className="text-[9px] font-bold text-satin-copper hover:text-pure-white hover:bg-satin-copper border border-satin-copper/25 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider bg-pure-white/40 cursor-pointer"
                          >
                            Llamar
                          </button>
                        )}
                        {cita.estado === 'en_sala' && (
                          <button 
                            onClick={() => navigate(`/nueva-entrada?pacienteId=${cita.paciente_id}&citaId=${cita.id}`)}
                            className="text-[9px] font-bold text-pure-white bg-satin-copper hover:bg-satin-copper-hover px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider cursor-pointer"
                          >
                            Atender
                          </button>
                        )}
                        <Link 
                          to={`/pacientes/${cita.paciente_id}`} 
                          className="text-[9px] font-bold text-slate-medium hover:text-slate-dark border border-slate-light/10 hover:border-slate-light/30 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider bg-pure-white/20"
                        >
                          Ficha
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side (Spans 4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Daily Summary / Mini Calendar */}
          <div className="bg-slate-dark text-rose-champagne rounded-2xl p-6 shadow-luxury flex flex-col justify-between h-[280px] relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-satin-copper rounded-full opacity-5 filter blur-3xl pointer-events-none"></div>
            <div>
              <h3 className="text-lg font-display font-medium text-pure-white mb-4 border-b border-slate-medium/30 pb-2">Resumen del Día</h3>
              <div className="space-y-4 text-xs font-sans uppercase tracking-wider font-semibold">
                <div className="flex justify-between items-center border-b border-slate-medium/15 pb-2">
                  <span className="text-slate-light">En Sala de Espera</span>
                  <span className="font-semibold text-pure-white bg-satin-copper px-2.5 py-0.5 rounded-full text-[10px]">
                    {citasHoy.filter(c => c.estado === 'en_sala').length}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-medium/15 pb-2">
                  <span className="text-slate-light">Confirmados Hoy</span>
                  <span className="font-semibold text-pure-white">
                    {citasHoy.filter(c => c.estado === 'confirmado').length}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-medium/15 pb-2">
                  <span className="text-slate-light">Pendientes</span>
                  <span className="font-semibold text-pure-white">
                    {citasHoy.filter(c => c.estado === 'pendiente').length}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/agenda')}
              className="mt-6 w-full py-2.5 border border-satin-copper/50 text-satin-copper hover:bg-satin-copper hover:text-pure-white font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all duration-300 shadow-md shadow-satin-copper/5"
            >
              Ver Agenda Completa
            </button>
          </div>

          {/* Bot Automation Health Card */}
          <div className="glass-panel rounded-2xl p-6 luxury-shadow">
            <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-dark mb-4 flex items-center gap-2">
              <MessageSquare size={14} className="text-satin-copper" /> 
              Automatizaciones WhatsApp
            </h3>
            <div className="space-y-4 font-sans">
              <div className="flex items-center gap-3 p-3.5 bg-rose-champagne-light/50 rounded-xl border border-rose-champagne">
                <div className="w-8 h-8 rounded-full bg-muted-olive/10 text-muted-olive flex items-center justify-center border border-muted-olive/10 shrink-0">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-dark">Recordatorios Enviados</p>
                  <p className="text-[10px] text-slate-medium mt-0.5">Bot confirmó 4 citas automáticamente hoy.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3.5 bg-rose-champagne-light/50 rounded-xl border border-rose-champagne">
                <div className="w-8 h-8 rounded-full bg-satin-copper/10 text-satin-copper flex items-center justify-center border border-satin-copper/10 shrink-0">
                  <Clock size={15} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-dark">Seguimientos Clínicos</p>
                  <p className="text-[10px] text-slate-medium mt-0.5">1 mensaje programado para Botox (3 semanas).</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
