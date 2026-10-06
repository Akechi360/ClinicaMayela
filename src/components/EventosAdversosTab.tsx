import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Plus, Trash2, X } from 'lucide-react';
import { dbEventosAdversos } from '../services/db';
import { CONDUCTAS_SUGERIDAS, ESTADOS_EVENTO, SEVERIDADES, TIPOS_EVENTO, etiquetaEvento } from '../data/eventosAdversos';
import type { EventoAdverso } from '../types/database.types';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const SEV_COLOR: Record<string, string> = {
  leve: 'bg-satin-copper/10 text-satin-copper border-satin-copper/25',
  moderada: 'bg-amber-50 text-amber-700 border-amber-200',
  severa: 'bg-red-50 text-red-600 border-red-200',
};
const INPUT = 'w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold';
const LABEL = 'block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold';
const hoy = () => new Date().toISOString().split('T')[0];

/** Registro de efectos adversos post-tratamiento y su seguimiento. */
export const EventosAdversosTab: React.FC<{ pacienteId: string }> = ({ pacienteId }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState('hematoma');
  const [severidad, setSeveridad] = useState<EventoAdverso['severidad']>('leve');
  const [fecha, setFecha] = useState(hoy());
  const [conducta, setConducta] = useState('');
  const [notas, setNotas] = useState('');

  const { data: eventos = [], isLoading } = useQuery({ queryKey: ['eventos-adversos', pacienteId], queryFn: () => dbEventosAdversos.listarPorPaciente(pacienteId) });
  const refrescar = () => qc.invalidateQueries({ queryKey: ['eventos-adversos', pacienteId] });

  const crear = useMutation({
    mutationFn: dbEventosAdversos.insertar,
    onSuccess: () => { refrescar(); setAbierto(false); setConducta(''); setNotas(''); toast.success('Evento registrado.'); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
  const cambiar = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Partial<EventoAdverso> }) => dbEventosAdversos.actualizar(id, cambios),
    onSuccess: refrescar,
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
  const borrar = useMutation({ mutationFn: dbEventosAdversos.eliminar, onSuccess: refrescar, onError: (e: Error) => toast.error(`Error: ${e.message}`) });

  const activos = eventos.filter((e) => e.estado !== 'resuelto').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-base font-display font-medium text-slate-dark">Efectos adversos y seguimiento</h3>
          <p className="text-[10px] text-slate-light mt-0.5">
            {activos > 0 ? <span className="text-red-500 font-bold">{activos} evento{activos > 1 ? 's' : ''} requiere{activos > 1 ? 'n' : ''} seguimiento</span> : 'Sin eventos activos'}
          </p>
        </div>
        <button onClick={() => setAbierto(true)} className="rosa-button py-2 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
          <Plus size={13} /> Registrar evento
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-slate-light py-8 text-center">Cargando…</p>
      ) : eventos.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-satin-copper/25 rounded-2xl bg-pure-white/15">
          <CheckCircle2 className="mx-auto text-slate-light mb-2 opacity-50" size={30} />
          <p className="text-xs text-slate-medium font-semibold">No hay efectos adversos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventos.map((e) => (
            <div key={e.id} className={`p-4 rounded-2xl border space-y-3 ${e.estado === 'resuelto' ? 'bg-pure-white/10 border-satin-copper/10 opacity-80' : 'bg-pure-white/20 border-satin-copper/20'}`}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-sm font-display font-medium text-slate-dark flex items-center gap-1.5">
                    {e.estado !== 'resuelto' && <AlertTriangle size={14} className="text-red-500" />}
                    {etiquetaEvento(e.tipo)}
                  </p>
                  <p className="text-[10px] text-slate-light mt-0.5">Desde {new Date(e.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${SEV_COLOR[e.severidad]}`}>{e.severidad}</span>
              </div>
              {e.conducta && <p className="text-[11px] text-slate-medium"><b>Conducta:</b> {e.conducta}</p>}
              {e.notas && <p className="text-[11px] text-slate-medium italic">&ldquo;{e.notas}&rdquo;</p>}
              <div className="flex items-center justify-between gap-2">
                <select
                  value={e.estado}
                  onChange={(ev) => cambiar.mutate({ id: e.id, cambios: { estado: ev.target.value as EventoAdverso['estado'], resuelto_en: ev.target.value === 'resuelto' ? hoy() : null } })}
                  className="bg-pure-white/60 border border-satin-copper/15 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-dark"
                  aria-label="Estado de resolución"
                >
                  {ESTADOS_EVENTO.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button
                  onClick={async () => { if (await confirm({ title: 'Eliminar evento', message: '¿Eliminar este registro?', severity: 'danger' })) borrar.mutate(e.id); }}
                  className="text-red-400 hover:text-red-600 p-1 rounded cursor-pointer" aria-label="Eliminar evento"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <form
            role="dialog" aria-modal="true" aria-label="Registrar evento adverso"
            onSubmit={(ev) => { ev.preventDefault(); crear.mutate({ paciente_id: pacienteId, tipo, severidad, fecha_inicio: fecha, estado: 'activo', conducta: conducta || null, notas: notas || null }); }}
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <h4 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Registrar evento adverso</h4>
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-slate-light hover:text-slate-dark cursor-pointer border-none bg-transparent"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3.5">
              <div><label className={LABEL}>Tipo de evento</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={INPUT}>{TIPOS_EVENTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL}>Severidad</label>
                  <select value={severidad} onChange={(e) => setSeveridad(e.target.value as EventoAdverso['severidad'])} className={INPUT}>{SEVERIDADES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
                <div><label className={LABEL}>Fecha de inicio</label><input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={INPUT} /></div>
              </div>
              <div><label className={LABEL}>Conducta médica</label>
                <input list="conductas" value={conducta} onChange={(e) => setConducta(e.target.value)} placeholder="ej. Hialuronidasa, corticoides…" className={INPUT} />
                <datalist id="conductas">{CONDUCTAS_SUGERIDAS.map((c) => <option key={c} value={c} />)}</datalist></div>
              <div><label className={LABEL}>Notas</label><textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} className={INPUT + ' resize-none'} /></div>
            </div>
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex justify-end gap-2.5">
              <button type="button" onClick={() => setAbierto(false)} className="px-4 py-2 border border-slate-medium/20 text-slate-medium rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">Cancelar</button>
              <button type="submit" disabled={crear.isPending} className="px-4 py-2 bg-satin-copper hover:bg-satin-copper-hover disabled:opacity-50 text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
