import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbCitas, dbPacientes, dbTratamientos } from '../services/db';
import type { Paciente, Tratamiento } from '../types/database.types';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  UserCheck,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

type EstadoCita = 'pendiente' | 'confirmado' | 'en_sala' | 'completado' | 'cancelado';

interface Cita {
  id: string;
  paciente_id: string;
  tratamiento_id: string;
  fecha_hora: string;
  notas?: string;
  estado: EstadoCita;
  paciente?: Paciente;
  tratamiento?: Tratamiento;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 – 18:00

const ESTADO_STYLES: Record<EstadoCita, string> = {
  pendiente:   'bg-slate-light/15 text-slate-medium border-slate-light/20',
  confirmado:  'bg-satin-copper/10 text-satin-copper border-satin-copper/20',
  en_sala:     'bg-rose-champagne/40 text-slate-dark border-satin-copper/25 animate-pulse',
  completado:  'bg-muted-olive/10 text-muted-olive border-muted-olive/20',
  cancelado:   'bg-red-500/10 text-red-500 border-red-500/20',
};

const ESTADO_LABEL: Record<EstadoCita, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  en_sala:    'En Sala',
  completado: 'Completado',
  cancelado:  'Cancelado',
};

export const Agenda: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  // Nueva cita
  const [newPacienteId, setNewPacienteId]     = useState('');
  const [newTratamientoId, setNewTratamientoId] = useState('');
  const [newFecha, setNewFecha]               = useState(new Date().toISOString().split('T')[0]);
  const [newHora, setNewHora]                 = useState('09:00');
  const [newNotas, setNewNotas]               = useState('');

  const { data: citas = [], isLoading } = useQuery<Cita[]>({
    queryKey: ['citas'],
    queryFn: dbCitas.listar
  });

  const { data: pacientes = [] } = useQuery<Paciente[]>({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar
  });

  const { data: tratamientos = [] } = useQuery<Tratamiento[]>({
    queryKey: ['tratamientos'],
    queryFn: dbTratamientos.listar
  });

  const crearMutation = useMutation<Cita, Error, Partial<Cita>>({
    mutationFn: (datos) => dbCitas.insertar(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      setShowModal(false);
      resetForm();
      toast.success('Cita agendada correctamente.');
    },
    onError: (err) => toast.error(`Error al agendar cita: ${err.message}`)
  });

  const actualizarEstadoMutation = useMutation<Cita, Error, { id: string; estado: EstadoCita }>({
    mutationFn: ({ id, estado }) => dbCitas.actualizarEstado(id, estado),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      toast.success(`Estado actualizado a “${ESTADO_LABEL[vars.estado]}”.`);
      setSelectedCita(null);
    },
    onError: (err) => toast.error(`Error al actualizar estado: ${err.message}`)
  });

  const eliminarMutation = useMutation<void, Error, string>({
    mutationFn: (id) => dbCitas.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      toast.success('Cita eliminada.');
      setSelectedCita(null);
    },
    onError: (err) => toast.error(`Error al eliminar cita: ${err.message}`)
  });

  const resetForm = () => {
    setNewPacienteId('');
    setNewTratamientoId('');
    setNewFecha(new Date().toISOString().split('T')[0]);
    setNewHora('09:00');
    setNewNotas('');
  };

  // Semana actual
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const citasDeHoy = useMemo(() => {
    const hoy = new Date().toDateString();
    return citas.filter(c => new Date(c.fecha_hora).toDateString() === hoy);
  }, [citas]);

  const getCitasForSlot = (day: Date, hour: number) =>
    citas.filter(c => {
      const d = new Date(c.fecha_hora);
      return (
        d.toDateString() === day.toDateString() &&
        d.getHours() === hour
      );
    });

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6 px-2 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-slate-dark mb-1">Agenda</h2>
          <p className="text-sm text-slate-medium">Calendario semanal de citas y procedimientos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="satin-button text-pure-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
        >
          + Nueva Cita
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Citas Hoy', value: citasDeHoy.length, color: 'text-satin-copper' },
          { label: 'Pendientes', value: citas.filter(c => c.estado === 'pendiente').length, color: 'text-slate-medium' },
          { label: 'En Sala', value: citas.filter(c => c.estado === 'en_sala').length, color: 'text-satin-copper-light' },
          { label: 'Completadas', value: citas.filter(c => c.estado === 'completado').length, color: 'text-muted-olive' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel rounded-2xl p-4 border border-pure-white/40 shadow-luxury text-center">
            <p className={`text-2xl font-display font-medium ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="glass-panel rounded-3xl border border-pure-white/40 shadow-luxury overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-4 border-b border-satin-copper/10 bg-pure-white/20">
          <button onClick={prevWeek} className="w-8 h-8 rounded-full hover:bg-satin-copper/10 flex items-center justify-center transition-all cursor-pointer shrink-0">
            <ChevronLeft size={16} className="text-slate-medium" />
          </button>
          <h3 className="text-xs sm:text-sm font-display font-medium text-slate-dark tracking-wide text-center truncate px-2">
            {weekDays[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </h3>
          <button onClick={nextWeek} className="w-8 h-8 rounded-full hover:bg-satin-copper/10 flex items-center justify-center transition-all cursor-pointer shrink-0">
            <ChevronRight size={16} className="text-slate-medium" />
          </button>
        </div>

        {/* Scrollable Container for Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-satin-copper/10">
              <div className="py-3 px-2 text-center">
                <Clock size={12} className="mx-auto text-slate-light" />
              </div>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`py-3 text-center border-l border-satin-copper/8 ${isToday ? 'bg-satin-copper/5' : ''}`}>
                    <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">{dayNames[i]}</p>
                    <p className={`text-lg font-display font-medium mt-0.5 ${
                      isToday ? 'text-satin-copper' : 'text-slate-dark'
                    }`}>{day.getDate()}</p>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="overflow-y-auto max-h-[520px]">
              {isLoading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-xs text-slate-light">
                  <Loader2 size={16} className="animate-spin text-satin-copper" /> Cargando agenda...
                </div>
              ) : (
                HOURS.map(hour => (
                  <div key={hour} className="grid grid-cols-8 border-b border-satin-copper/6 min-h-[64px] hover:bg-pure-white/10 transition-colors">
                    <div className="py-2 px-3 text-right">
                      <span className="text-[10px] text-slate-light font-bold">{String(hour).padStart(2, '0')}:00</span>
                    </div>
                    {weekDays.map((day, di) => {
                      const slotCitas = getCitasForSlot(day, hour);
                      return (
                        <div key={di} className="py-1 px-1 border-l border-satin-copper/6 space-y-1">
                          {slotCitas.map(cita => (
                            <button
                              key={cita.id}
                              onClick={() => setSelectedCita(cita)}
                              className={`w-full text-left px-2 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide transition-all hover:scale-[1.02] cursor-pointer leading-tight ${ESTADO_STYLES[cita.estado]}`}
                            >
                              <span className="block truncate">{cita.paciente?.nombre?.split(' ')[0]}</span>
                              <span className="block truncate font-normal normal-case text-[8px] opacity-80">{cita.tratamiento?.nombre}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Nueva Cita */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              crearMutation.mutate({
                paciente_id: newPacienteId,
                tratamiento_id: newTratamientoId,
                fecha_hora: `${newFecha}T${newHora}:00`,
                notas: newNotas,
                estado: 'pendiente'
              });
            }}
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Nueva Cita</h3>
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-light hover:text-slate-dark cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Paciente</label>
                <select required value={newPacienteId} onChange={e => setNewPacienteId(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold">
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Tratamiento</label>
                <select required value={newTratamientoId} onChange={e => setNewTratamientoId(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold">
                  <option value="">Seleccionar tratamiento...</option>
                  {tratamientos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Fecha</label>
                  <input type="date" required value={newFecha} onChange={e => setNewFecha(e.target.value)}
                    className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Hora</label>
                  <input type="time" required value={newHora} onChange={e => setNewHora(e.target.value)}
                    className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Notas (opcional)</label>
                <textarea value={newNotas} onChange={e => setNewNotas(e.target.value)} rows={2} placeholder="Observaciones previas..."
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold resize-none" />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex justify-end gap-2.5">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={crearMutation.isPending}
                className="px-4 py-2 satin-button text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50">
                {crearMutation.isPending ? 'Agendando...' : 'Confirmar Cita'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Detalle / Estado Cita */}
      {selectedCita && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Detalle de Cita</h3>
              <button onClick={() => setSelectedCita(null)} className="text-slate-light hover:text-slate-dark cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold">Paciente</p>
                <p className="font-display font-medium text-slate-dark text-sm">{[selectedCita.paciente?.nombre, selectedCita.paciente?.apellido].filter(Boolean).join(' ')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold">Tratamiento</p>
                <p className="font-semibold text-slate-dark">{selectedCita.tratamiento?.nombre}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold">Fecha y Hora</p>
                <p className="font-semibold text-slate-dark">
                  {new Date(selectedCita.fecha_hora).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} &mdash; {new Date(selectedCita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {selectedCita.notas && (
                <div className="bg-rose-champagne-light/50 p-3 rounded-xl border border-satin-copper/10">
                  <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold mb-1">Notas</p>
                  <p className="italic text-slate-medium text-[11px]">&ldquo;{selectedCita.notas}&rdquo;</p>
                </div>
              )}
              <div className="pt-2">
                <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold mb-2">Cambiar Estado</p>
                <div className="flex flex-wrap gap-2">
                  {(['confirmado', 'en_sala', 'completado', 'cancelado'] as EstadoCita[]).map(est => (
                    <button
                      key={est}
                      onClick={() => actualizarEstadoMutation.mutate({ id: selectedCita.id, estado: est })}
                      disabled={actualizarEstadoMutation.isPending || selectedCita.estado === est}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 ${
                        selectedCita.estado === est ? 'opacity-40 cursor-default' : 'hover:scale-105'
                      } ${ESTADO_STYLES[est]}`}
                    >
                      {est === 'confirmado' && <UserCheck size={10} className="inline mr-1" />}
                      {est === 'completado' && <CheckCircle size={10} className="inline mr-1" />}
                      {est === 'cancelado'  && <XCircle size={10} className="inline mr-1" />}
                      {ESTADO_LABEL[est]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex justify-between items-center">
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: '¿Eliminar Cita?',
                    message: '¿Estás seguro de que deseas eliminar esta cita permanentemente?',
                    confirmLabel: 'Sí, eliminar',
                    cancelLabel: 'Cancelar',
                    severity: 'danger'
                  });
                  if (ok) {
                    eliminarMutation.mutate(selectedCita.id);
                  }
                }}
                disabled={eliminarMutation.isPending}
                className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <XCircle size={13} /> Eliminar Cita
              </button>
              <button onClick={() => setSelectedCita(null)}
                className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
