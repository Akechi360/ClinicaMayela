import React from 'react';
import type { CampoLongevidad, DatosSeccion, SeccionLongevidad, ValorCampo } from '../data/longevidad';

const entrada = 'w-full rounded-xl border border-lilac-soft bg-white px-3.5 py-3 text-base text-ink placeholder:text-lilac-muted/60 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50';
const etiqueta = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-lilac-muted';
const pill = (activo: boolean) =>
  `cursor-pointer rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
    activo ? 'border-lilac-deep bg-lilac-deep text-white' : 'border-lilac-soft bg-white text-ink hover:bg-lilac-blush/60'
  }`;

interface CampoProps { campo: CampoLongevidad; valor: ValorCampo; onChange: (v: ValorCampo) => void }

const Campo: React.FC<CampoProps> = ({ campo, valor, onChange }) => {
  switch (campo.tipo) {
    case 'texto':
      return <input className={entrada} value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={campo.placeholder} />;
    case 'textarea':
      return <textarea className={entrada} rows={3} value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={campo.placeholder} />;
    case 'numero':
      return (
        <div className="flex items-center gap-2">
          <input
            className={entrada}
            type="number"
            inputMode="decimal"
            min={campo.min}
            max={campo.max}
            step={campo.paso ?? 1}
            value={valor === undefined || valor === null || valor === '' ? '' : String(valor)}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          />
          {campo.unidad && <span className="shrink-0 text-xs text-lilac-muted">{campo.unidad}</span>}
        </div>
      );
    case 'escala': {
      const n = (campo.max ?? 10) - (campo.min ?? 1) + 1;
      return (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: n }, (_, i) => (campo.min ?? 1) + i).map((v) => (
            <button key={v} type="button" onClick={() => onChange(valor === v ? '' : v)} className={pill(valor === v) + ' text-center'}>{v}</button>
          ))}
        </div>
      );
    }
    case 'opcion':
      return (
        <div className="flex flex-wrap gap-2">
          {campo.opciones?.map((o) => (
            <button key={o.valor} type="button" onClick={() => onChange(valor === o.valor ? '' : o.valor)} className={pill(valor === o.valor)}>{o.label}</button>
          ))}
        </div>
      );
    case 'sino':
      return (
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange(valor === true ? '' : true)} className={pill(valor === true)}>Sí</button>
          <button type="button" onClick={() => onChange(valor === false ? '' : false)} className={pill(valor === false)}>No</button>
        </div>
      );
    case 'multi': {
      const sel = Array.isArray(valor) ? valor : [];
      const alternar = (v: string) => onChange(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v]);
      return (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {campo.opciones?.map((o) => (
            <label key={o.valor} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1.5 text-sm text-ink">
              <input type="checkbox" checked={sel.includes(o.valor)} onChange={() => alternar(o.valor)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#A891AA]" />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
  }
};

interface Props {
  seccion: SeccionLongevidad;
  valor: DatosSeccion | undefined;
  /** Recibe solo el campo que cambió; quien llama lo combina con el estado más reciente. */
  onChange: (parche: DatosSeccion) => void;
}

/** Campos de una sección de la historia de longevidad (toque en vez de teclado cuando es posible). */
export const LongevidadSeccion: React.FC<Props> = ({ seccion, valor, onChange }) => {
  const v = valor ?? {};
  return (
    <div className="space-y-4">
      {seccion.descripcion && <p className="text-xs text-lilac-muted">{seccion.descripcion}</p>}
      {seccion.campos.map((c) => (
        <div key={c.id}>
          <label className={etiqueta}>{c.label}</label>
          <Campo campo={c} valor={v[c.id]} onChange={(nuevo) => onChange({ [c.id]: nuevo })} />
          {c.ayuda && <p className="mt-1 text-[11px] text-lilac-muted">{c.ayuda}</p>}
        </div>
      ))}
    </div>
  );
};
