import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calculator, Copy, Send } from 'lucide-react';
import { dbPacientes } from '../services/db';
import { PRESETS_CALC, PRESET_PERSONALIZADO, type PresetCalc } from '../data/calcPresets';
import { CAPACIDAD_ML, CAPACIDAD_UI, FRECUENCIAS, calcular, formatoNumero, type FrecuenciaId, type Jeringa } from '../lib/reconstitucion';
import { enlaceWa } from '../lib/whatsapp';
import { JeringaGraduada } from '../components/JeringaGraduada';
import { useToast } from '../components/Toast';

const INPUT = 'w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold';
const LABEL = 'block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold';
const JERINGAS: Jeringa[] = ['U-100', 'U-50', 'U-30'];

/** Calculadora de reconstitución y dosificación de péptidos (módulo interno de la doctora). */
export const CalculadoraPeptidos: React.FC = () => {
  const toast = useToast();
  const { data: pacientes = [] } = useQuery({ queryKey: ['pacientes'], queryFn: dbPacientes.listar });

  const [presetId, setPresetId] = useState(PRESETS_CALC[0].id);
  const [vialMg, setVialMg] = useState(PRESETS_CALC[0].vialMg);
  const [aguaMl, setAguaMl] = useState(PRESETS_CALC[0].aguaMl);
  const [dosis, setDosis] = useState(PRESETS_CALC[0].dosis);
  const [unidad, setUnidad] = useState<'mcg' | 'mg'>(PRESETS_CALC[0].unidadDosis);
  const [jeringa, setJeringa] = useState<Jeringa>('U-100');
  const [frecuencia, setFrecuencia] = useState<FrecuenciaId>(PRESETS_CALC[0].frecuencia);
  const [pacienteId, setPacienteId] = useState('');

  const preset: PresetCalc = PRESETS_CALC.find((p) => p.id === presetId) ?? PRESET_PERSONALIZADO;
  const paciente = pacientes.find((p) => p.id === pacienteId);

  const aplicarPreset = (id: string) => {
    const p = PRESETS_CALC.find((x) => x.id === id) ?? PRESET_PERSONALIZADO;
    setPresetId(id); setVialMg(p.vialMg); setAguaMl(p.aguaMl); setDosis(p.dosis); setUnidad(p.unidadDosis); setFrecuencia(p.frecuencia);
  };
  const cambiarUnidad = (u: 'mcg' | 'mg') => {
    if (u === unidad) return;
    setDosis(u === 'mg' ? dosis / 1000 : dosis * 1000);
    setUnidad(u);
  };

  const r = useMemo(() => calcular({ vialMg, aguaMl, dosis, unidadDosis: unidad, jeringa, frecuencia }), [vialMg, aguaMl, dosis, unidad, jeringa, frecuencia]);
  const frecLabel = FRECUENCIAS.find((f) => f.id === frecuencia)?.label ?? '';

  const ficha = r
    ? `FICHA DE RECONSTITUCIÓN — ${preset.nombre}\n\n` +
      `• Vial: ${vialMg} mg + ${aguaMl} mL de agua bacteriostática → ${formatoNumero(r.concMcgMl, 0)} mcg/mL (${formatoNumero(r.mcgPorUi, 2)} mcg por unidad)\n` +
      `• Dosis: ${formatoNumero(dosis, 3)} ${unidad} → aspirar ${formatoNumero(r.ui, 1)} unidades (${formatoNumero(r.ml, 2)} mL) con jeringa de insulina ${jeringa}\n` +
      `• Frecuencia: ${frecLabel}\n` +
      `• El vial rinde ${r.dosisTotales} aplicaciones (≈ ${r.duracionDias} días)\n\n` +
      `Conserve el vial reconstituido en refrigeración (2–8 °C), protegido de la luz, y siga las indicaciones de la Dra. Mayela González.`
    : '';

  const copiar = async () => {
    try { await navigator.clipboard.writeText(ficha); toast.success('Ficha copiada.'); } catch { toast.error('No se pudo copiar.'); }
  };
  const enviar = () => {
    const url = enlaceWa(paciente?.telefono, `Hola ${paciente?.nombre ?? ''}, esta es su ficha de dosificación:\n\n${ficha}`);
    if (!url) { toast.error('Selecciona un paciente con teléfono registrado.'); return; }
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 px-2 max-w-6xl">
      <div>
        <h2 className="text-xl md:text-2xl font-display font-medium text-slate-dark flex items-center gap-2"><Calculator size={22} /> Calculadora de reconstitución</h2>
        <p className="text-xs text-slate-medium mt-1">Calcula las unidades a aspirar, la concentración y la duración del vial. Los valores de partida son de referencia: la dosis final es criterio médico.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-pure-white/40 shadow-luxury space-y-4">
          <div>
            <label className={LABEL}>Péptido</label>
            <select value={presetId} onChange={(e) => aplicarPreset(e.target.value)} className={INPUT}>
              {PRESETS_CALC.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              <option value={PRESET_PERSONALIZADO.id}>{PRESET_PERSONALIZADO.nombre}</option>
            </select>
            {preset.nota && <p className="text-[10px] text-slate-light mt-1">{preset.nota}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Cantidad en el vial (mg)</label>
              <input type="number" min="0" step="0.5" value={vialMg} onChange={(e) => setVialMg(Number(e.target.value))} list="viales" className={INPUT} />
              <datalist id="viales">{[...new Set([2, 5, 10, 15, ...preset.viales])].sort((a, b) => a - b).map((v) => <option key={v} value={v} />)}</datalist>
            </div>
            <div>
              <label className={LABEL}>Agua bacteriostática (mL)</label>
              <input type="number" min="0" step="0.1" value={aguaMl} onChange={(e) => setAguaMl(Number(e.target.value))} className={INPUT} />
              <div className="flex gap-1 mt-1">{[1, 2, 3].map((v) => <button key={v} type="button" onClick={() => setAguaMl(v)} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${aguaMl === v ? 'bg-satin-copper text-pure-white border-satin-copper' : 'border-satin-copper/25 text-satin-copper'}`}>{v} mL</button>)}</div>
            </div>
          </div>
          <div>
            <label className={LABEL}>Jeringa de insulina</label>
            <div className="grid grid-cols-3 gap-2">
              {JERINGAS.map((j) => (
                <button key={j} type="button" onClick={() => setJeringa(j)} className={`py-2 rounded-lg border text-[11px] font-bold cursor-pointer ${jeringa === j ? 'bg-satin-copper text-pure-white border-satin-copper' : 'border-satin-copper/25 text-slate-dark bg-pure-white/50'}`}>
                  {j}<span className="block text-[9px] font-medium opacity-80">{CAPACIDAD_UI[j]} UI · {CAPACIDAD_ML[j]} mL</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Dosis por aplicación</label>
              <div className="flex gap-1.5">
                <input type="number" min="0" step="any" value={Number.isFinite(dosis) ? Number(dosis.toPrecision(6)) : 0} onChange={(e) => setDosis(Number(e.target.value))} className={INPUT} />
                <div className="flex rounded-lg border border-satin-copper/25 overflow-hidden shrink-0">
                  {(['mcg', 'mg'] as const).map((u) => <button key={u} type="button" onClick={() => cambiarUnidad(u)} className={`px-2.5 text-[10px] font-bold cursor-pointer ${unidad === u ? 'bg-satin-copper text-pure-white' : 'text-satin-copper bg-pure-white/50'}`}>{u}</button>)}
                </div>
              </div>
            </div>
            <div>
              <label className={LABEL}>Frecuencia</label>
              <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value as FrecuenciaId)} className={INPUT}>
                {FRECUENCIAS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section className="lg:col-span-3 glass-panel rounded-2xl p-5 border border-pure-white/40 shadow-luxury space-y-5">
          {!r ? (
            <p className="text-xs text-slate-medium py-12 text-center">Completa el vial, el agua y la dosis para calcular.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { k: 'Aspirar', v: `${formatoNumero(r.ui, 1)} UI`, d: `${formatoNumero(r.ml, 2)} mL`, destacado: true },
                  { k: 'Concentración', v: `${formatoNumero(r.concMcgMl, 0)} mcg/mL`, d: `${formatoNumero(r.mcgPorUi, 2)} mcg/UI` },
                  { k: 'Aplicaciones por vial', v: `${r.dosisTotales}`, d: frecLabel },
                  { k: 'Duración del vial', v: `${r.duracionDias} días`, d: `≈ ${formatoNumero(r.duracionDias / 7, 1)} semanas` },
                ].map((c) => (
                  <div key={c.k} className={`rounded-xl p-3 border ${c.destacado ? 'bg-satin-copper/10 border-satin-copper/30' : 'bg-pure-white/40 border-satin-copper/10'}`}>
                    <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold">{c.k}</p>
                    <p className="text-lg font-display font-semibold text-slate-dark leading-tight mt-0.5">{c.v}</p>
                    <p className="text-[10px] text-slate-medium">{c.d}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-pure-white/50 border border-satin-copper/10 p-3"><JeringaGraduada jeringa={jeringa} ui={r.ui} /></div>

              <div className="space-y-2" aria-live="polite">
                {r.excedeJeringa && (
                  <p className="flex items-start gap-2 text-[11px] rounded-xl border border-red-200 bg-red-50 text-red-700 px-3 py-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    La dosis no cabe en una {jeringa}. {r.jeringaSugerida ? `Usa una jeringa ${r.jeringaSugerida} o ` : ''}divídela en {r.inyecciones} aplicaciones, o diluye con menos agua.</p>
                )}
                {r.pocaPrecision && (
                  <p className="flex items-start gap-2 text-[11px] rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    Menos de 2 UI es difícil de medir con precisión. Considera reconstituir con más agua.</p>
                )}
                {!r.excedeJeringa && r.jeringaSugerida && r.jeringaSugerida !== jeringa && (
                  <p className="text-[10px] text-slate-light">Con {formatoNumero(r.ui, 1)} UI también alcanza una jeringa {r.jeringaSugerida}, con graduación más fina.</p>
                )}
              </div>

              <div className="border-t border-satin-copper/10 pt-4 space-y-3">
                <div>
                  <label className={LABEL}>Paciente (opcional, para enviar la ficha o crear su protocolo)</label>
                  <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} className={INPUT}>
                    <option value="">Sin paciente</option>
                    {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido ?? ''}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" onClick={copiar} className="px-4 py-2 border border-satin-copper/40 text-satin-copper rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5"><Copy size={12} /> Copiar ficha</button>
                  <button type="button" onClick={enviar} disabled={!paciente} className="px-4 py-2 border border-muted-olive/40 text-muted-olive rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-40"><Send size={12} /> Enviar por WhatsApp</button>
                  {paciente && <Link to={`/peptides?pacienteId=${paciente.id}`} className="px-4 py-2 bg-satin-copper text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider no-underline">Crear protocolo del paciente</Link>}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
