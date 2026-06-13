// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbCitas, dbPacientes, dbTratamientos } from '../services/db';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Sparkles, 
  Plus, 
  Trash2, 
  X, 
  ListFilter
} from 'lucide-react';

export const Agenda: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Focus trap y control de teclado (Escape para cerrar, Tab circular) para el modal
  useEffect(() => {
    if (!showAddModal || !modalRef.current) return;
    const modal = modalRef.current;
    
    const previouslyFocused = document.activeElement as HTMLElement;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        return;
      }
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [showAddModal]);

  // Estados del formulario de nueva cita
  const [pacienteId, setPacienteId] = useState('');
  const [tratamientoId, setTratamientoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');

  // Consultar datos
  const { data: citas = [], isLoading: loadingCitas } = useQuery({
    queryKey: ['citas'],
    queryFn: dbCitas.listar
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: dbTratamientos.listar
  });

  // Mutación para agregar cita
  const addCitaMutation = useMutation({
    mutationFn: dbCitas.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      setShowAddModal(false);
      resetForm();
    }
  });

  // Mutación para actualizar el estado
  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'confirmado' | 'en_sala' | 'pendiente' | 'cancelado' }) => 
      dbCitas.actualizarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    }
  });

  // Mutación para eliminar cita
  const deleteCitaMutation = useMutation({
    mutationFn: dbCitas.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citas'] });
    }
  });

  const resetForm = () => {
    setPacienteId('');
    setTratamientoId('');
    setFecha('');
    setHora('');
    setNotas('');
  };

  const handleAddCita = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId || !tratamientoId || !fecha || !hora) return;
    
    const fechaHora = new Date(`${fecha}T${hora}`).toISOString();
    
    addCitaMutation.mutate({
      paciente_id: pacienteId,
      tratamiento_id: tratamientoId,
      fecha_hora: fechaHora,
      estado: 'pendiente',
      notas
    });
  };

  const citasFiltradas = citas.filter(cita => {
    if (filtroEstado === 'todos') return true;
    return cita.estado === filtroEstado;
  });

  const formatFecha = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Agrupar citas por día para mostrarlas ordenadas
  const citasAgrupadas = citasFiltradas.reduce((groups: { [key: string]: typeof citas }, cita) => {
    const dia = cita.fecha_hora.split('T')[0];
    if (!groups[dia]) {
      groups[dia] = [];
    }
    groups[dia].push(cita);
    return groups;
  }, {});

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'confirmado': return 'bg-muted-olive text-pure-white';
      case 'en_sala': return 'bg-satin-copper text-pure-white';
      case 'pendiente': return 'bg-slate-light text-slate-dark';
      default: return 'bg-red-400 text-pure-white';
    }
  };

  return (
    <div className="space-y-8 px-2 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-light text-slate-dark tracking-wide">
            Agenda de <span className="italic font-normal text-satin-copper">Citas</span>
          </h2>
          <p className="text-xs text-slate-light mt-0.5">Planifica y gestiona las visitas clínicas diarias de forma visual.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-[10px] font-bold tracking-[0.15em] uppercase py-3 px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-satin-copper/10"
        >
          <Plus size={13} /> Programar Cita
        </button>
      </div>

      {/* Filters (Glassmorphic) */}
      <div className="flex flex-wrap gap-2 items-center glass-panel p-4 rounded-2xl shadow-luxury border border-pure-white/40 w-full">
        <span className="text-xs text-slate-medium flex items-center gap-1 mr-2"><ListFilter size={13} className="text-satin-copper" /> Filtrar por estado:</span>
        {['todos', 'pendiente', 'confirmado', 'en_sala', 'cancelado'].map(est => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
              filtroEstado === est
                ? 'sidebar-active-item border-slate-medium text-pure-white shadow-sm'
                : 'bg-pure-white/20 border-satin-copper/15 text-slate-medium hover:text-slate-dark'
            }`}
          >
            {est}
          </button>
        ))}
      </div>

      {/* Agenda list */}
      <div className="space-y-8">
        {loadingCitas ? (
          <div className="text-center py-12 text-xs text-slate-light">Cargando agenda...</div>
        ) : Object.keys(citasAgrupadas).length === 0 ? (
          <div className="glass-panel py-16 text-center rounded-3xl border border-pure-white/40 shadow-luxury">
            <CalendarIcon className="mx-auto text-satin-copper-light mb-3 opacity-60" size={30} />
            <p className="text-sm font-semibold text-slate-dark mb-1 font-display">No hay citas en la agenda</p>
            <p className="text-xs text-slate-medium">Empieza programando una cita con el botón superior.</p>
          </div>
        ) : (
          Object.keys(citasAgrupadas).sort().map((dia) => (
            <div key={dia} className="space-y-4">
              {/* Encabezado del día (Editorial) */}
              <h3 className="text-xs font-semibold text-slate-dark uppercase tracking-[0.2em] border-b border-rose-champagne pb-2.5 capitalize font-sans">
                {formatFecha(citasAgrupadas[dia][0].fecha_hora)}
              </h3>
              
              {/* Citas del día */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {citasAgrupadas[dia].map((cita) => (
                  <div 
                    key={cita.id} 
                    className="glass-panel p-5 rounded-2xl luxury-shadow flex justify-between items-start hover:shadow-xl transition-all duration-500 relative group"
                  >
                    <div className="space-y-3.5">
                      {/* Hora y Paciente */}
                      <div className="space-y-1">
                        <p className="text-xs text-satin-copper font-semibold flex items-center gap-1.5">
                          <Clock size={12} />
                          {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm font-semibold text-slate-dark flex items-center gap-1.5">
                          <User size={14} className="text-slate-light" />
                          {cita.paciente?.nombre}
                          {cita.paciente?.es_vip && (
                            <span className="text-[8px] bg-satin-copper/10 text-satin-copper font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">VIP</span>
                          )}
                        </p>
                      </div>

                      {/* Tratamiento y Notas */}
                      <div className="space-y-1.5">
                        <p className="text-xs text-slate-medium flex items-center gap-1.5">
                          <Sparkles size={13} className="text-slate-light" />
                          {cita.tratamiento?.nombre} (${cita.tratamiento?.precio})
                        </p>
                        {cita.notas && (
                          <p className="text-[10px] text-slate-medium italic bg-rose-champagne-light/50 p-2.5 rounded-xl border border-rose-champagne/40 leading-relaxed max-w-xs">
                            "{cita.notas}"
                          </p>
                        )}
                      </div>

                      {/* Botones rápidos de Estado */}
                      <div className="flex gap-1.5 pt-1.5">
                        {['pendiente', 'confirmado', 'en_sala'].map((est) => {
                          const isCurrent = cita.estado === est;
                          return (
                            <button
                              key={est}
                              onClick={() => updateEstadoMutation.mutate({ id: cita.id, estado: est as any })}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                isCurrent
                                  ? getEstadoColor(est)
                                  : 'bg-pure-white/50 border-rose-champagne text-slate-light hover:text-slate-dark hover:border-slate-medium'
                              }`}
                            >
                              {est === 'en_sala' ? 'En Sala' : est}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Botón de eliminación y Estado */}
                    <div className="flex flex-col justify-between items-end h-full min-h-[90px] pt-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getEstadoColor(cita.estado)}`}>
                        {cita.estado}
                      </span>
                      
                      <button
                        onClick={() => {
                          if (confirm('¿Deseas cancelar y eliminar esta cita de la agenda?')) {
                            deleteCitaMutation.mutate(cita.id);
                          }
                        }}
                        className="text-slate-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-red-500/10"
                        title="Eliminar cita"
                        aria-label="Eliminar cita"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para programar cita */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-dark/45 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="glass-panel rounded-2xl shadow-2xl p-6 w-full max-w-md font-sans border border-pure-white/45"
          >
            <div className="flex justify-between items-center mb-4 border-b border-satin-copper/15 pb-3">
              <h3 id="modal-title" className="text-base font-medium text-slate-dark font-display">Programar Nueva Cita</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-medium hover:text-slate-dark cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCita} className="space-y-4">
              {/* Paciente */}
              <div className="flex flex-col space-y-1">
                <label htmlFor="paciente" className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Paciente</label>
                <select
                  id="paciente"
                  required
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
                >
                  <option value="" className="bg-rose-champagne-light text-slate-dark">Selecciona un paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id} className="bg-rose-champagne-light text-slate-dark">{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tratamiento */}
              <div className="flex flex-col space-y-1">
                <label htmlFor="tratamiento" className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Procedimiento sugerido</label>
                <select
                  id="tratamiento"
                  required
                  value={tratamientoId}
                  onChange={(e) => setTratamientoId(e.target.value)}
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
                >
                  <option value="" className="bg-rose-champagne-light text-slate-dark">Selecciona un tratamiento</option>
                  {tratamientos.map(t => (
                    <option key={t.id} value={t.id} className="bg-rose-champagne-light text-slate-dark">{t.nombre} (${t.precio})</option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="fecha" className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Fecha</label>
                  <input
                    id="fecha"
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label htmlFor="hora" className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Hora</label>
                  <input
                    id="hora"
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="flex flex-col space-y-1">
                <label htmlFor="notas" className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Notas de la Cita</label>
                <textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Recordar traer ficha firmada / Paciente solicita anestesia tópica"
                  rows={3}
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none placeholder:text-slate-light/60 font-sans"
                />
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-satin-copper/15 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-satin-copper/25 text-[10px] font-bold uppercase tracking-wider text-slate-dark hover:bg-pure-white/40 transition-all cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="satin-button text-pure-white text-[10px] font-bold tracking-wider uppercase py-2.5 px-6 rounded-xl cursor-pointer font-sans"
                >
                  Programar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
