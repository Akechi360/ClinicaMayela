import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Plus, Send, Trash2, X } from 'lucide-react';
import { dbSeguimientos } from '../services/db';
import { PLANTILLAS_CUIDADO, categoriaPorTratamiento, mensajeCuidados, plantillaDe, type CategoriaCuidado } from '../data/cuidadosPostTratamiento';
import { FRECUENCIAS, type FrecuenciaId } from '../lib/reconstitucion';
import { planCuidados, planDosis, type EscaladoDosis } from '../lib/seguimientos';
import { enlaceWa } from '../lib/whatsapp';
import { fechaHoraCaracas } from '../lib/fechas';
import type { Paciente } from '../types/database.types';
import type { PeptideProtocol } from '../types/peptides';
import { useToast } from './Toast';

const INPUT = 'w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold';
const LABEL = 'block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold';

const Modal: React.FC<{ titulo: string; onClose: () => void; children: React.ReactNode; pie: React.ReactNode }> = ({ titulo, onClose, children, pie }) => (
  <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
    <div role="dialog" aria-modal="true" aria-label={titulo} className="glass-panel w-full max-w-lg rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col max-h-[92vh]">
      <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
        <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider flex items-center gap-2"><BellRing size={15} /> {titulo}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-light hover:text-slate-dark cursor-pointer border-none bg-transparent"><X size={16} /></button>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto text-xs">{children}</div>
      <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex flex-wrap justify-end gap-2.5">{pie}</div>
    </div>
  </div>
);

const Check: React.FC<{ checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }> = ({ checked, onChange, children }) => (
  <label className="flex items-center gap-2 text-[11px] text-slate-dark cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-3.5 h-3.5 accent-[#A891AA]" />
    {children}
  </label>
);

/** Cuidados post-tratamiento: se envían ahora por WhatsApp o los envía el bot, con recordatorios a las 24 h, 72 h y control. */
export const CuidadosPostModal: React.FC<{ paciente: Paciente; tratamiento?: string | null; citaId?: string | null; onClose: () => void }> = ({ paciente, tratamiento, citaId, onClose }) => {
  const toast = useToast();
  const qc = useQueryClient();
  const inicial = categoriaPorTratamiento(tratamiento);
  const [cat, setCat] = useState<CategoriaCuidado>(inicial);
  const [mensaje, setMensaje] = useState(mensajeCuidados(paciente.nombre, inicial));
  const [r24, setR24] = useState(true);
  const [r72, setR72] = useState(true);
  const [control, setControl] = useState(plantillaDe(inicial).controlDias !== null);
  const [controlDias, setControlDias] = useState(plantillaDe(inicial).controlDias ?? 15);

  const cambiarCategoria = (c: CategoriaCuidado) => {
    setCat(c);
    setMensaje(mensajeCuidados(paciente.nombre, c));
    const d = plantillaDe(c).controlDias;
    setControl(d !== null);
    if (d) setControlDias(d);
  };

  const programar = useMutation({
    mutationFn: async (porBot: boolean) => {
      const items = planCuidados({ pacienteId: paciente.id, nombre: paciente.nombre, categoria: cat, citaId, mensajeCuidados: mensaje, ahora: new Date(), r24, r72, controlDias: control ? controlDias : null, incluirCuidadosAhora: porBot });
      if (items.length) await dbSeguimientos.programar(items);
      return items.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seguimientos', paciente.id] }),
  });

  const enviarAhora = async () => {
    const url = enlaceWa(paciente.telefono, mensaje);
    if (!url) { toast.error('El paciente no tiene teléfono registrado.'); return; }
    try {
      const n = await programar.mutateAsync(false);
      window.open(url, '_blank');
      toast.success(n ? `Cuidados enviados. ${n} recordatorio${n > 1 ? 's' : ''} programado${n > 1 ? 's' : ''}.` : 'Cuidados enviados.');
      onClose();
    } catch (e) { toast.error(`Error: ${(e as Error).message}`); }
  };
  const porBot = async () => {
    try {
      const n = await programar.mutateAsync(true);
      toast.success(`${n} mensaje${n > 1 ? 's' : ''} en la cola del bot de WhatsApp.`);
      onClose();
    } catch (e) { toast.error(`Error: ${(e as Error).message}`); }
  };

  return (
    <Modal titulo="Cuidados post-tratamiento" onClose={onClose} pie={
      <>
        <button type="button" onClick={porBot} disabled={programar.isPending} className="px-4 py-2 border border-satin-copper/40 text-satin-copper rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50">Que lo envíe el bot</button>
        <button type="button" onClick={enviarAhora} disabled={programar.isPending} className="px-4 py-2 bg-muted-olive text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-50"><Send size={12} /> Enviar ahora por WhatsApp</button>
      </>
    }>
      <p className="text-[11px] text-slate-medium">Para <b>{paciente.nombre} {paciente.apellido ?? ''}</b>{tratamiento ? <> · {tratamiento}</> : null}</p>
      <div>
        <label className={LABEL}>Tipo de tratamiento</label>
        <select value={cat} onChange={(e) => cambiarCategoria(e.target.value as CategoriaCuidado)} className={INPUT}>
          {PLANTILLAS_CUIDADO.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL}>Mensaje (editable)</label>
        <textarea rows={9} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className={INPUT + ' resize-y font-normal'} />
      </div>
      <div className="space-y-2">
        <p className={LABEL}>Seguimiento automático (lo envía el bot)</p>
        <Check checked={r24} onChange={setR24}>Preguntar cómo amaneció a las 24 horas</Check>
        <Check checked={r72} onChange={setR72}>Chequeo de evolución a las 72 horas</Check>
        <div className="flex items-center gap-2">
          <Check checked={control} onChange={setControl}>Recordar cita de control a los</Check>
          <input type="number" min="1" max="365" value={controlDias} onChange={(e) => setControlDias(Number(e.target.value))} disabled={!control} className="w-16 bg-pure-white/60 border border-satin-copper/15 rounded-lg px-2 py-1 text-[11px] font-semibold disabled:opacity-40" />
          <span className="text-[11px] text-slate-dark">días</span>
        </div>
      </div>
    </Modal>
  );
};

const ETIQUETAS: Record<string, string> = { cuidados_post: 'Cuidados', recordatorio_24h: 'Chequeo 24 h', recordatorio_72h: 'Chequeo 72 h', control_estetico: 'Control', dosis_peptido: 'Dosis', escalado_dosis: 'Cambio de dosis' };
const ESTADO_CLASE: Record<string, string> = { pendiente: 'bg-amber-50 text-amber-700 border-amber-200', enviado: 'bg-satin-copper/10 text-satin-copper border-satin-copper/25', cancelado: 'bg-slate-medium/10 text-slate-medium border-slate-medium/20', error: 'bg-red-50 text-red-600 border-red-200' };

/** Mensajes programados para el paciente (cola del bot). */
export const SeguimientosLista: React.FC<{ pacienteId: string }> = ({ pacienteId }) => {
  const toast = useToast();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['seguimientos', pacienteId], queryFn: () => dbSeguimientos.listarPorPaciente(pacienteId) });
  const cancelar = useMutation({
    mutationFn: dbSeguimientos.cancelar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seguimientos', pacienteId] }),
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
  if (!data.length) return null;
  const pendientes = data.filter((s) => s.estado === 'pendiente').length;
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-display font-medium text-slate-dark">Mensajes programados por WhatsApp</h4>
        <p className="text-[10px] text-slate-light">{pendientes} pendiente{pendientes !== 1 ? 's' : ''} · el bot los envía entre las 7:00 y las 21:00 (hora de Caracas).</p>
      </div>
      <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {data.map((s) => (
          <li key={s.id} className="flex items-start gap-3 rounded-xl bg-pure-white/20 border border-satin-copper/10 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-dark">{ETIQUETAS[s.tipo] ?? s.tipo} <span className="font-normal text-slate-light">· {fechaHoraCaracas(s.fecha_programada)}</span></p>
              <p className="text-[11px] text-slate-medium truncate">{s.mensaje}</p>
              {s.error && <p className="text-[10px] text-red-500">{s.error}</p>}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${ESTADO_CLASE[s.estado]}`}>{s.estado}</span>
            {s.estado === 'pendiente' && (
              <button onClick={() => cancelar.mutate(s.id)} aria-label="Cancelar mensaje" className="text-red-400 hover:text-red-600 cursor-pointer border-none bg-transparent p-0.5"><Trash2 size={13} /></button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Programa los recordatorios de aplicación de un protocolo de péptidos y los avisos de escalado de dosis. */
export const RecordatoriosDosisModal: React.FC<{ paciente: Paciente; protocolo: PeptideProtocol; onClose: () => void }> = ({ paciente, protocolo, onClose }) => {
  const toast = useToast();
  const qc = useQueryClient();
  const opciones = protocolo.peptidos_seleccionados;
  const hoy = new Date().toISOString().split('T')[0];
  const [idx, setIdx] = useState(0);
  const sel = opciones[idx];
  const dosisDe = (i: number) => { const s = opciones[i]; return s?.customDose ? `${s.customDose} ${s.peptide.doses.unit}` : s?.peptide.doses.standard ?? ''; };
  const [dosis, setDosis] = useState(dosisDe(0));
  const [frecuencia, setFrecuencia] = useState<FrecuenciaId>('diaria');
  const [hora, setHora] = useState('08:00');
  const [inicio, setInicio] = useState(protocolo.fecha_inicio >= hoy ? protocolo.fecha_inicio : hoy);
  const [semanas, setSemanas] = useState(protocolo.duracion_semanas || 4);
  const [escalado, setEscalado] = useState<EscaladoDosis[]>([]);

  const items = sel ? planDosis({ pacienteId: paciente.id, protocoloId: protocolo.id, nombre: paciente.nombre, peptido: sel.peptide.name, dosis, inicio, semanas, frecuencia, hora, escalado }) : [];

  const guardar = useMutation({
    mutationFn: async () => {
      await dbSeguimientos.cancelarPendientesProtocolo(protocolo.id, ['dosis_peptido', 'escalado_dosis']);
      await dbSeguimientos.programar(items);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seguimientos', paciente.id] }); toast.success(`${items.length} recordatorios programados.`); onClose(); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  return (
    <Modal titulo="Recordatorios de dosis" onClose={onClose} pie={
      <button type="button" disabled={!items.length || guardar.isPending} onClick={() => guardar.mutate()} className="px-4 py-2 bg-satin-copper hover:bg-satin-copper-hover text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50">Programar {items.length} mensajes</button>
    }>
      <p className="text-[11px] text-slate-medium">Los recordatorios previos pendientes de este protocolo se reemplazan.</p>
      {opciones.length > 1 && (
        <div><label className={LABEL}>Péptido</label>
          <select value={idx} onChange={(e) => { const i = Number(e.target.value); setIdx(i); setDosis(dosisDe(i)); }} className={INPUT}>{opciones.map((o, i) => <option key={o.peptide.id} value={i}>{o.peptide.name}</option>)}</select></div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Dosis inicial</label><input value={dosis} onChange={(e) => setDosis(e.target.value)} className={INPUT} placeholder="ej. 0.25 mg" /></div>
        <div><label className={LABEL}>Frecuencia</label>
          <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as FrecuenciaId)} className={INPUT}>{FRECUENCIAS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
        <div><label className={LABEL}>Primer día</label><input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className={INPUT} /></div>
        <div><label className={LABEL}>Hora (Caracas)</label><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={INPUT} /></div>
        <div><label className={LABEL}>Duración (semanas)</label><input type="number" min="1" max="52" value={semanas} onChange={(e) => setSemanas(Number(e.target.value))} className={INPUT} /></div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><p className={LABEL + ' mb-0'}>Escalado de dosis</p>
          <button type="button" onClick={() => setEscalado((e) => [...e, { semana: 5, dosis: '' }])} className="text-[10px] font-bold text-satin-copper flex items-center gap-1 cursor-pointer border-none bg-transparent"><Plus size={11} /> Agregar</button></div>
        {escalado.map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-medium">Desde la semana</span>
            <input type="number" min="2" max={semanas} value={e.semana} onChange={(ev) => setEscalado((l) => l.map((x, j) => (j === i ? { ...x, semana: Number(ev.target.value) } : x)))} className="w-16 bg-pure-white/60 border border-satin-copper/15 rounded-lg px-2 py-1 text-[11px] font-semibold" />
            <input value={e.dosis} placeholder="nueva dosis, ej. 0.5 mg" onChange={(ev) => setEscalado((l) => l.map((x, j) => (j === i ? { ...x, dosis: ev.target.value } : x)))} className="flex-1 bg-pure-white/60 border border-satin-copper/15 rounded-lg px-2 py-1 text-[11px] font-semibold" />
            <button type="button" onClick={() => setEscalado((l) => l.filter((_, j) => j !== i))} aria-label="Quitar" className="text-red-400 cursor-pointer border-none bg-transparent"><Trash2 size={13} /></button>
          </div>
        ))}
        {!escalado.length && <p className="text-[10px] text-slate-light">Ej.: semana 5 → 0.5 mg. Cada cambio genera además un aviso especial al paciente.</p>}
      </div>
    </Modal>
  );
};
