// @ts-nocheck
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

  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

  const { data: citas = [], isLoading: loadingCitas } = useQuery({
    queryKey: ['citas'],
    queryFn: dbCitas.listar
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar
  });

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: dbTransacciones.listar
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'confirmado' | 'en_sala' | 'pendiente' | 'cancelado' }) =>
      dbCitas.actualizarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    }
  });

  const hoyStr = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter(cita => cita.fecha_hora.startsWith(hoyStr));

  const nuevosPacientes = pacientes.length;
  const procedimientosHoy = citasHoy.length;
  const completadasHoy = citasHoy.filter(c => c.estado === 'completado').length;

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
          <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Confirmado
          </span>
        );
      case 'en_sala':
        return (
          <span className="flex items-center gap-1.5 text-[#A0806C] text-[10px] font-semibold uppercase tracking-wider bg-rosa-petalo/10 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-rosa-petalo animate-pulse"></span> En Sala
          </span>
        );
      case 'pendiente':
        return (
          <span className="flex items-center gap-1.5 text-slate-medium text-[10px] font-semibold uppercase tracking-wider bg-[#F0F1F3] px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]"></span> Pendiente
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-semibold uppercase tracking-wider bg-red-50 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Cancelado
          </span>
        );
    }
  };

  const progressPercent = procedimientosHoy > 0 ? Math.round((completadasHoy / procedimientosHoy) * 100) : 0;

  return (
    <div className="space-y-6 px-2">
      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 md:gap-5">

        {/* ── Hero Banner (dark) ── col-span-12 */}
        <div className="col-span-12 relative overflow-hidden rounded-2xl p-6 sm:p-8 glass-panel-dark text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="absolute -right-10 -top-16 w-60 h-60 bg-rosa-petalo/10 rounded-full filter blur-[80px] pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-satin-copper-light/8 rounded-full filter blur-[80px] pointer-events-none"></div>

          <div className="space-y-2 relative z-10">
            <span className="text-[9px] uppercase tracking-[0.35em] text-rosa-petalo/70 font-medium flex items-center gap-2">
              <span className="w-2 h-[0.5px] bg-rosa-petalo/50"></span> Sistema de Gestión Clínico
            </span>
            <h2 className="text-2xl md:text-4xl font-display font-light leading-tight tracking-wide">
              Buenos días, <span className="italic font-normal text-rosa-petalo">{doctor?.nombre || 'Dra. Mayela González'}</span>
            </h2>
            <p className="text-xs text-white/45 font-light tracking-wide font-sans">
              Resumen del día clínico — {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/[0.06] px-4 py-2.5 rounded-xl shrink-0 relative z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-white text-[9px] uppercase tracking-wider font-medium">Activo</span>
          </div>
        </div>

        {/* ── Caja Estimada (big) ── col-span-5 */}
        <div className="col-span-12 md:col-span-5 bg-white rounded-2xl p-5 shadow-bento hover:shadow-bento-hover transition-all duration-300 flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full border-[12px] border-satin-copper-light/[0.06] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          <div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rosa-petalo/12 to-satin-copper-light/10 flex items-center justify-center mb-3">
              <DollarSign size={14} className="text-rosa-petalo" />
            </div>
            <h3 className="text-[8px] uppercase tracking-[0.18em] text-slate-light font-medium">Caja Estimada del Mes</h3>
            <p className="text-3xl md:text-4xl font-sans font-medium text-slate-dark mt-1 tracking-tight">
              {formatCurrency(ingresosMensuales)}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[8px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">+18%</span>
            <span className="text-[8px] text-[#C0C4CC]">vs. mes anterior</span>
          </div>
        </div>

        {/* ── Pacientes + Citas (stacked) ── col-span-3 */}
        <div className="col-span-6 md:col-span-3 grid grid-rows-2 gap-4 md:gap-5">
          <div className="bg-white rounded-2xl p-4 shadow-bento hover:shadow-bento-hover transition-all duration-300 flex flex-col justify-between">
            <div className="w-7 h-7 rounded-lg bg-[#F7F8FA] flex items-center justify-center mb-2">
              <Users size={13} className="text-slate-medium" />
            </div>
            <div>
              <h3 className="text-[7px] uppercase tracking-[0.15em] text-slate-light font-medium">Pacientes</h3>
              <p className="text-xl font-sans font-medium text-slate-dark mt-0.5">{nuevosPacientes}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-bento hover:shadow-bento-hover transition-all duration-300 flex flex-col justify-between">
            <div className="w-7 h-7 rounded-lg bg-[#F7F8FA] flex items-center justify-center mb-2">
              <Calendar size={13} className="text-slate-medium" />
            </div>
            <div>
              <h3 className="text-[7px] uppercase tracking-[0.15em] text-slate-light font-medium">Citas Hoy</h3>
              <p className="text-xl font-sans font-medium text-slate-dark mt-0.5">{procedimientosHoy}</p>
            </div>
          </div>
        </div>

        {/* ── Progreso del Día ── col-span-4 */}
        <div className="col-span-6 md:col-span-4 bg-white rounded-2xl p-5 shadow-bento hover:shadow-bento-hover transition-all duration-300 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full border-[10px] border-satin-copper-light/[0.06] pointer-events-none"></div>
          <h3 className="text-[8px] uppercase tracking-[0.18em] text-slate-light font-medium">Completadas Hoy</h3>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-sans font-medium text-slate-dark">{completadasHoy}</span>
            <span className="text-sm text-[#C0C4CC]">/ {procedimientosHoy}</span>
          </div>
          <div className="mt-4 h-1.5 bg-[#F0F1F3] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rosa-petalo to-satin-copper-light rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* ── Procedimientos del Día ── col-span-8 */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl p-5 shadow-bento">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-display font-medium text-slate-dark tracking-wide">Procedimientos del Día</h3>
            <Link to="/agenda" className="text-[9px] font-medium uppercase tracking-wider text-rosa-petalo hover:text-rosa-petalo-hover transition-colors flex items-center gap-1">
              Ver Agenda <ChevronRight size={12} />
            </Link>
          </div>

          {loadingCitas ? (
            <div className="py-8 text-center text-xs text-slate-light">Cargando agenda del día...</div>
          ) : citasHoy.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#E5E7EB] rounded-xl bg-[#F7F8FA]">
              <Calendar className="mx-auto text-slate-light mb-2 opacity-50" size={28} />
              <p className="text-xs text-slate-medium font-medium">No hay citas programadas para hoy.</p>
              <Link to="/agenda" className="text-[9px] text-rosa-petalo font-medium uppercase tracking-[0.12em] mt-3 inline-block hover:underline">
                Programar una cita ahora
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {citasHoy.map((cita) => (
                <div key={cita.id} className="floating-row rounded-xl p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium shrink-0 ${
                      cita.estado === 'en_sala'
                        ? 'bg-gradient-to-br from-rosa-petalo/12 to-satin-copper-light/10 text-[#A0806C]'
                        : 'bg-[#F7F8FA] text-slate-medium'
                    }`}>
                      {cita.paciente?.nombre?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <Link to={`/pacientes/${cita.paciente_id}`} className="font-sans font-medium text-sm text-slate-dark hover:text-rosa-petalo transition-colors flex items-center gap-2">
                        {cita.paciente?.nombre}
                        {cita.paciente?.es_vip && (
                          <span className="text-[7px] bg-rosa-petalo/10 text-rosa-petalo font-medium px-1.5 py-0.5 rounded uppercase tracking-wider">VIP</span>
                        )}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-slate-light font-medium tracking-wide mt-0.5">
                        <span className="text-slate-medium">{new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-[#E5E7EB]">•</span>
                        <span>{cita.tratamiento?.nombre}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div>{getEstadoBadge(cita.estado)}</div>
                    <div className="flex items-center gap-2">
                      {cita.estado === 'pendiente' && (
                        <button
                          onClick={() => updateEstadoMutation.mutate({ id: cita.id, estado: 'en_sala' })}
                          className="text-[9px] font-medium text-rosa-petalo hover:text-white hover:bg-rosa-petalo border border-rosa-petalo/25 px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider bg-white cursor-pointer"
                        >
                          Llamar
                        </button>
                      )}
                      {cita.estado === 'en_sala' && (
                        <button
                          onClick={() => navigate(`/nueva-entrada?pacienteId=${cita.paciente_id}&citaId=${cita.id}`)}
                          className="text-[9px] font-medium rosa-button px-3 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer"
                        >
                          Atender
                        </button>
                      )}
                      <Link
                        to={`/pacientes/${cita.paciente_id}`}
                        className="text-[9px] font-medium text-slate-medium hover:text-slate-dark border border-[#EEEEF0] hover:border-[#D1D5DB] px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider bg-white"
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

        {/* ── Resumen del Día ── col-span-4 */}
        <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-5">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl p-5 shadow-bento">
            <h3 className="text-sm font-display font-medium text-slate-dark tracking-wide mb-4">Resumen del Día</h3>
            <div className="space-y-0">
              <div className="flex justify-between items-center py-2.5 border-b border-[#F7F8FA]">
                <span className="text-xs text-slate-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Confirmadas
                </span>
                <span className="text-xs font-medium text-emerald-600">{citasHoy.filter(c => c.estado === 'confirmado').length}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-[#F7F8FA]">
                <span className="text-xs text-slate-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rosa-petalo"></span> En Sala
                </span>
                <span className="text-xs font-medium text-[#A0806C]">{citasHoy.filter(c => c.estado === 'en_sala').length}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-[#F7F8FA]">
                <span className="text-xs text-slate-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]"></span> Pendientes
                </span>
                <span className="text-xs font-medium text-slate-dark">{citasHoy.filter(c => c.estado === 'pendiente').length}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs text-slate-medium flex items-center gap-2">
                  <DollarSign size={12} className="text-rosa-petalo" /> Ingresos Hoy
                </span>
                <span className="text-xs font-medium text-slate-dark">
                  {formatCurrency(transacciones.filter(t => t.estado === 'completado' && t.fecha?.startsWith(hoyStr)).reduce((s, t) => s + t.monto, 0))}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-[#F0F1F3] space-y-2">
              <button
                onClick={() => navigate('/agenda')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rosa-petalo/10 to-satin-copper-light/8 text-[#A0806C] text-[10px] font-medium uppercase tracking-wider transition-all hover:from-rosa-petalo/15 hover:to-satin-copper-light/12 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar size={12} /> Ver Agenda Completa
              </button>
            </div>
          </div>

          {/* WhatsApp Automation Card */}
          <div className="bg-white rounded-2xl p-5 shadow-bento">
            <h3 className="text-xs font-sans font-medium uppercase tracking-wider text-slate-dark mb-4 flex items-center gap-2">
              <MessageSquare size={14} className="text-rosa-petalo" />
              Automatizaciones
            </h3>
            <div className="space-y-3 font-sans">
              <div className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-dark">Recordatorios Enviados</p>
                  <p className="text-[10px] text-slate-light mt-0.5">Bot confirmó 4 citas hoy.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#F7F8FA] rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-rosa-petalo/10 text-rosa-petalo flex items-center justify-center shrink-0">
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-dark">Seguimientos Clínicos</p>
                  <p className="text-[10px] text-slate-light mt-0.5">1 mensaje programado (Botox 3 sem).</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
