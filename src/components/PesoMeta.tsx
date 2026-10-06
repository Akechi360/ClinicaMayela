import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { Target } from 'lucide-react';
import { dbPacientes } from '../services/db';
import { calcularImc, categoriaImc, progresoHaciaMeta } from '../lib/imc';
import type { ComposicionCorporal } from '../types/database.types';
import { useToast } from './Toast';

const INPUT = 'w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold';
const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

/** IMC con categoría OMS, estatura, peso meta y barra de progreso. Montar con `key` para reiniciar al cambiar los datos. */
export const PesoMetaCard: React.FC<{ pacienteId: string; estaturaCm?: number | null; pesoMetaKg?: number | null; mediciones: ComposicionCorporal[] }> = ({ pacienteId, estaturaCm, pesoMetaKg, mediciones }) => {
  const toast = useToast();
  const qc = useQueryClient();
  const [estatura, setEstatura] = useState(estaturaCm?.toString() ?? '');
  const [meta, setMeta] = useState(pesoMetaKg?.toString() ?? '');

  const guardar = useMutation({
    mutationFn: () => dbPacientes.actualizar(pacienteId, { estatura_cm: num(estatura), peso_meta_kg: num(meta) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['paciente', pacienteId] }); toast.success('Datos guardados.'); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const primera = mediciones[0];
  const ultima = mediciones[mediciones.length - 1];
  const imc = calcularImc(ultima?.peso_kg, estaturaCm);
  const cat = categoriaImc(imc);
  const progreso = progresoHaciaMeta(primera?.peso_kg, ultima?.peso_kg, pesoMetaKg);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-pure-white/40 shadow-luxury space-y-4">
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-slate-light font-bold"><Target size={12} /> IMC y meta de peso</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
        <div>
          <p className="text-2xl font-display font-semibold text-slate-dark leading-none">{imc ?? '—'}</p>
          <p className={`text-[10px] font-bold mt-1 ${cat?.tono === 'normal' ? 'text-muted-olive' : cat ? 'text-amber-600' : 'text-slate-light'}`}>{cat?.label ?? 'Falta estatura o peso'}</p>
        </div>
        <label className="text-[8px] uppercase tracking-wider text-slate-medium font-bold">Estatura (cm)
          <input type="number" step="0.5" min="50" max="250" value={estatura} onChange={(e) => setEstatura(e.target.value)} className={INPUT + ' mt-1'} />
        </label>
        <label className="text-[8px] uppercase tracking-wider text-slate-medium font-bold">Peso meta (kg)
          <input type="number" step="0.5" min="20" max="400" value={meta} onChange={(e) => setMeta(e.target.value)} className={INPUT + ' mt-1'} />
        </label>
        <button onClick={() => guardar.mutate()} disabled={guardar.isPending} className="rosa-button py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50">Guardar</button>
      </div>
      {progreso !== null && pesoMetaKg ? (
        <div>
          <div className="flex justify-between text-[10px] text-slate-medium mb-1">
            <span>{primera.peso_kg} kg (inicio)</span><span className="font-bold text-slate-dark">{progreso}% de la meta</span><span>{pesoMetaKg} kg (meta)</span>
          </div>
          <div className="h-2.5 rounded-full bg-pure-white/50 border border-satin-copper/15 overflow-hidden" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-gradient-to-r from-satin-copper to-satin-copper-light transition-all" style={{ width: `${progreso}%` }} />
          </div>
          <p className="text-[9px] text-slate-light mt-1">Peso actual: {ultima.peso_kg} kg</p>
        </div>
      ) : (
        <p className="text-[10px] text-slate-light">Define un peso meta (y registra al menos una medición) para ver el progreso.</p>
      )}
    </div>
  );
};

/** Peso al iniciar el protocolo vs. actual, con mini-gráfica del ciclo. */
export const PesoProtocolo: React.FC<{ mediciones: ComposicionCorporal[]; fechaInicio: string }> = ({ mediciones, fechaInicio }) => {
  if (!mediciones.length) return null;
  const antes = [...mediciones].filter((m) => m.fecha <= fechaInicio).pop() ?? mediciones.find((m) => m.fecha >= fechaInicio);
  const ciclo = mediciones.filter((m) => m.fecha >= fechaInicio);
  const actual = mediciones[mediciones.length - 1];
  if (!antes) return null;
  const delta = Math.round((actual.peso_kg - antes.peso_kg) * 10) / 10;
  const puntos = (ciclo.length ? ciclo : [antes]).map((m) => ({ f: m.fecha, p: Number(m.peso_kg) }));
  return (
    <div className="flex items-center gap-3 rounded-xl bg-pure-white/30 border border-satin-copper/10 px-3 py-2">
      <div className="text-[10px] leading-tight text-slate-medium">
        <p className="uppercase tracking-wider text-[8px] text-slate-light font-bold">Peso en este protocolo</p>
        <p><b className="text-slate-dark">{antes.peso_kg}</b> → <b className="text-slate-dark">{actual.peso_kg} kg</b> <span className={delta <= 0 ? 'text-muted-olive font-bold' : 'text-amber-600 font-bold'}>({delta > 0 ? '+' : ''}{delta})</span></p>
      </div>
      {puntos.length > 1 && (
        <div className="h-8 w-24 ml-auto" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={puntos}><YAxis hide domain={['dataMin - 1', 'dataMax + 1']} /><Line type="monotone" dataKey="p" stroke="#A891AA" strokeWidth={2} dot={false} /></LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
