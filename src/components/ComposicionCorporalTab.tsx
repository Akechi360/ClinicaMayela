import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbComposicionCorporal } from '../services/db';
import type { ComposicionCorporal } from '../types/database.types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Plus, Trash2, X, Activity } from 'lucide-react';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  pacienteId: string;
}

const ROSA     = '#E0A2A2';
const ROSA_OSC = '#CC8A8A';
const SLATE    = '#3A434D';
const OLIVE    = '#6B7A5E';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel border border-pure-white/50 rounded-xl px-4 py-3 shadow-luxury text-xs font-sans">
      <p className="font-bold text-slate-dark mb-1.5 text-[10px] uppercase tracking-wider">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export const ComposicionCorporalTab: React.FC<Props> = ({ pacienteId }) => {
  const toast        = useToast();
  const confirm      = useConfirm();
  const queryClient  = useQueryClient();

  const handleEliminar = async (id: string) => {
    const ok = await confirm({
      title: '¿Eliminar Medición?',
      message: '¿Estás seguro de que deseas eliminar esta medición de composición corporal permanentemente?',
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
      severity: 'danger'
    });
    if (ok) eliminarMutation.mutate(id);
  };
  const [showModal, setShowModal] = useState(false);

  const [formFecha,   setFormFecha]   = useState(new Date().toISOString().split('T')[0]);
  const [formPeso,    setFormPeso]    = useState('');
  const [formGrasa,   setFormGrasa]   = useState('');
  const [formNotas,   setFormNotas]   = useState('');

  const { data: mediciones = [], isLoading } = useQuery<ComposicionCorporal[]>({
    queryKey: ['composicion', pacienteId],
    queryFn:  () => dbComposicionCorporal.listarPorPaciente(pacienteId)
  });

  const insertarMutation = useMutation({
    mutationFn: dbComposicionCorporal.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicion', pacienteId] });
      setShowModal(false);
      resetForm();
      toast.success('Medición registrada correctamente.');
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`)
  });

  const eliminarMutation = useMutation({
    mutationFn: dbComposicionCorporal.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['composicion', pacienteId] });
      toast.success('Medición eliminada.');
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`)
  });

  const resetForm = () => {
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFormPeso('');
    setFormGrasa('');
    setFormNotas('');
  };

  const chartData = mediciones.map((m, i) => ({
    sesion: `S${i + 1}`,
    fecha:  new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    'Peso (kg)':           Number(m.peso_kg),
    '% Grasa':             Number(m.grasa_pct),
    'Masa Magra (kg)':     Number(m.masa_magra_kg),
    'Kg Grasa':            Number((m.peso_kg * m.grasa_pct / 100).toFixed(2))
  }));

  // KPIs: última vs primera medición
  const primera  = mediciones[0];
  const ultima   = mediciones[mediciones.length - 1];
  const deltaPeso   = primera && ultima ? (ultima.peso_kg    - primera.peso_kg).toFixed(1)    : null;
  const deltaGrasa  = primera && ultima ? (ultima.grasa_pct  - primera.grasa_pct).toFixed(1)   : null;
  const deltaMagra  = primera && ultima ? (ultima.masa_magra_kg - primera.masa_magra_kg).toFixed(1) : null;

  const kpiColor = (val: string | null, invertido = false) => {
    if (!val) return 'text-slate-medium';
    const n = parseFloat(val);
    if (n === 0) return 'text-slate-medium';
    const positivo = n > 0;
    return (positivo !== invertido) ? 'text-muted-olive' : 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-display font-medium text-slate-dark">Composición Corporal</h3>
          <p className="text-[10px] text-slate-light mt-0.5 font-sans">{mediciones.length} medición{mediciones.length !== 1 ? 'es' : ''} registrada{mediciones.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rosa-button py-2 px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={13} /> Nueva Medición
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-light">Cargando mediciones...</div>
      ) : mediciones.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-rosa-petalo/25 rounded-2xl bg-pure-white/15">
          <Activity className="mx-auto text-slate-light mb-2 opacity-40" size={36} />
          <p className="text-xs text-slate-medium font-semibold">Sin mediciones registradas</p>
          <p className="text-[10px] text-slate-light mt-1">Registra la primera medición con el botón superior.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          {mediciones.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Δ Peso',       val: deltaPeso,  unit: 'kg',  invertido: true },
                { label: 'Δ % Grasa',    val: deltaGrasa, unit: '%',   invertido: true },
                { label: 'Δ Masa Magra', val: deltaMagra, unit: 'kg',  invertido: false }
              ].map(kpi => (
                <div key={kpi.label} className="glass-panel rounded-2xl p-4 border border-pure-white/40 shadow-luxury text-center">
                  <p className={`text-xl font-display font-semibold ${kpiColor(kpi.val, kpi.invertido)}`}>
                    {kpi.val !== null && parseFloat(kpi.val) > 0 ? '+' : ''}{kpi.val ?? '—'} {kpi.val !== null ? kpi.unit : ''}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mt-1">{kpi.label}</p>
                  <p className="text-[8px] text-slate-light/60 mt-0.5">primera → última</p>
                </div>
              ))}
            </div>
          )}

          {/* Gráfica líneas: Peso */}
          <div className="glass-panel rounded-2xl p-5 border border-pure-white/40 shadow-luxury">
            <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-4">Evolución del Peso (kg)</p>
            <ErrorBoundary fallbackText="Error al cargar gráfica de peso">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,67,77,0.06)" />
                  <XAxis dataKey="sesion" tick={{ fontSize: 9, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 9, fill: SLATE }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Peso (kg)" stroke={SLATE} strokeWidth={2} dot={{ r: 4, fill: SLATE }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>

          {/* Gráfica líneas: % Grasa */}
          <div className="glass-panel rounded-2xl p-5 border border-pure-white/40 shadow-luxury">
            <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-4">% Grasa Corporal</p>
            <ErrorBoundary fallbackText="Error al cargar gráfica de grasa corporal">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,67,77,0.06)" />
                  <XAxis dataKey="sesion" tick={{ fontSize: 9, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 9, fill: SLATE }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="% Grasa" stroke={ROSA_OSC} strokeWidth={2} dot={{ r: 4, fill: ROSA_OSC }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>

          {/* Gráfica líneas: Masa Magra */}
          <div className="glass-panel rounded-2xl p-5 border border-pure-white/40 shadow-luxury">
            <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-4">Masa Magra (kg)</p>
            <ErrorBoundary fallbackText="Error al cargar gráfica de masa magra">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,67,77,0.06)" />
                  <XAxis dataKey="sesion" tick={{ fontSize: 9, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 9, fill: SLATE }} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Masa Magra (kg)" stroke={OLIVE} strokeWidth={2} dot={{ r: 4, fill: OLIVE }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>

          {/* Gráfica barras apiladas */}
          <div className="glass-panel rounded-2xl p-5 border border-pure-white/40 shadow-luxury">
            <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-4">Composición por Sesión</p>
            <ErrorBoundary fallbackText="Error al cargar gráfica de barras de composición">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(58,67,77,0.06)" />
                  <XAxis dataKey="sesion" tick={{ fontSize: 9, fill: SLATE }} />
                  <YAxis tick={{ fontSize: 9, fill: SLATE }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'Inter, sans-serif' }} />
                  <Bar dataKey="Masa Magra (kg)" stackId="a" fill={OLIVE} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Kg Grasa"        stackId="a" fill={ROSA}  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>

          {/* Tabla de registros */}
          <div className="glass-panel rounded-2xl border border-pure-white/40 shadow-luxury overflow-hidden">
            <div className="px-5 py-3.5 border-b border-rosa-petalo/10 bg-pure-white/20">
              <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Registro de Mediciones</p>
            </div>
            <div className="divide-y divide-rosa-petalo/8">
              {mediciones.map((m, i) => (
                <div key={m.id} className="px-5 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-pure-white/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-rosa-petalo/10 text-rosa-petalo text-[9px] font-bold flex items-center justify-center border border-rosa-petalo/20">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-dark">
                        {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {m.notas && <p className="text-[9px] text-slate-light italic mt-0.5">{m.notas}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 text-[10px] font-bold w-full sm:w-auto">
                    <div className="text-center">
                      <p className="text-slate-dark">{m.peso_kg} kg</p>
                      <p className="text-[8px] text-slate-light font-normal">Peso</p>
                    </div>
                    <div className="text-center">
                      <p className="text-rosa-petalo">{m.grasa_pct}%</p>
                      <p className="text-[8px] text-slate-light font-normal">Grasa</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-olive">{m.masa_magra_kg} kg</p>
                      <p className="text-[8px] text-slate-light font-normal">Magra</p>
                    </div>
                    <button
                      onClick={() => handleEliminar(m.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal nueva medición */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              insertarMutation.mutate({
                paciente_id: pacienteId,
                fecha:       formFecha,
                peso_kg:     parseFloat(formPeso),
                grasa_pct:   parseFloat(formGrasa),
                notas:       formNotas || undefined
              });
            }}
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-rosa-petalo/10 flex justify-between items-center bg-pure-white/20">
              <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Nueva Medición</h3>
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-light hover:text-slate-dark cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Fecha</label>
                <input type="date" required value={formFecha} onChange={e => setFormFecha(e.target.value)}
                  className="w-full bg-pure-white/60 border border-rosa-petalo/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-rosa-petalo font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Peso (kg)</label>
                  <input type="number" required step="0.01" min="1" max="300" placeholder="ej. 72.5" value={formPeso} onChange={e => setFormPeso(e.target.value)}
                    className="w-full bg-pure-white/60 border border-rosa-petalo/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-rosa-petalo font-semibold" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">% Grasa Corporal</label>
                  <input type="number" required step="0.01" min="1" max="60" placeholder="ej. 22.5" value={formGrasa} onChange={e => setFormGrasa(e.target.value)}
                    className="w-full bg-pure-white/60 border border-rosa-petalo/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-rosa-petalo font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Notas (opcional)</label>
                <textarea value={formNotas} onChange={e => setFormNotas(e.target.value)} rows={2} placeholder="Observaciones de la sesión..."
                  className="w-full bg-pure-white/60 border border-rosa-petalo/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-rosa-petalo font-semibold resize-none" />
              </div>
              <div className="bg-rosa-petalo/5 border border-rosa-petalo/15 rounded-xl p-3">
                <p className="text-[9px] text-slate-light font-bold uppercase tracking-wider mb-1">Masa Magra (calculada automáticamente)</p>
                <p className="text-sm font-display font-semibold text-slate-dark">
                  {formPeso && formGrasa
                    ? `${(parseFloat(formPeso) * (1 - parseFloat(formGrasa) / 100)).toFixed(2)} kg`
                    : '— kg'}
                </p>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-rosa-petalo/10 flex justify-end gap-2.5">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={insertarMutation.isPending}
                className="px-4 py-2 rosa-button rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50">
                {insertarMutation.isPending ? 'Guardando...' : 'Guardar Medición'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
