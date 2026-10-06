import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { CATEGORIAS_PATOLOGIA, PATOLOGIAS, esAlertaMayor, etiquetaPatologia, type AlertaClinica } from '../data/patologias';

/** Selector de patologías previas agrupado por categoría. */
export const PatologiasSelector: React.FC<{ value: string[]; onChange: (v: string[]) => void }> = ({ value, onChange }) => {
  const toggle = (codigo: string) =>
    onChange(value.includes(codigo) ? value.filter((c) => c !== codigo) : [...value, codigo]);
  return (
    <div className="space-y-3">
      {CATEGORIAS_PATOLOGIA.map((cat) => (
        <fieldset key={cat.id} className="border border-satin-copper/15 rounded-xl px-3 pb-2.5 pt-1.5">
          <legend className="px-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-medium">{cat.label}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
            {PATOLOGIAS.filter((p) => p.categoria === cat.id).map((p) => (
              <label key={p.codigo} className="flex items-start gap-2 text-[11px] text-slate-dark cursor-pointer py-0.5">
                <input
                  type="checkbox"
                  checked={value.includes(p.codigo)}
                  onChange={() => toggle(p.codigo)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-satin-copper/40 accent-[#A891AA]"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
};

/** Etiquetas rápidas de patologías para la cabecera de la ficha (rojo = alerta mayor). */
export const EtiquetasPatologia: React.FC<{ patologias?: string[] | null }> = ({ patologias }) => {
  if (!patologias?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Patologías previas">
      {patologias.map((c) => (
        <span
          key={c}
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
            esAlertaMayor(c) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-satin-copper/10 text-satin-copper border-satin-copper/25'
          }`}
        >
          {esAlertaMayor(c) && <ShieldAlert size={9} className="inline -mt-0.5 mr-0.5" />}
          {etiquetaPatologia(c)}
        </span>
      ))}
    </div>
  );
};

/** Alertas automáticas de contraindicación / precaución. */
export const AlertasClinicas: React.FC<{ alertas: AlertaClinica[]; titulo?: string }> = ({ alertas, titulo = 'Alertas clínicas' }) => {
  if (!alertas.length) return null;
  return (
    <div className="space-y-2" role="alert">
      <p className="text-[9px] uppercase tracking-wider font-bold text-slate-medium">{titulo}</p>
      {alertas.map((a) => (
        <div
          key={a.codigo}
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${
            a.nivel === 'roja' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {a.nivel === 'roja' ? <ShieldAlert size={14} className="shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="shrink-0 mt-0.5" />}
          <span>{a.mensaje}</span>
        </div>
      ))}
    </div>
  );
};
