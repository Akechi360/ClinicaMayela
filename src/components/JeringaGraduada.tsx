import React from 'react';
import { CAPACIDAD_UI, type Jeringa } from '../lib/reconstitucion';

const X0 = 60; // inicio del barril
const LARGO = 520; // longitud útil del barril

/** Jeringa de insulina con graduación; el líquido llega hasta la marca de las unidades a aspirar. */
export const JeringaGraduada: React.FC<{ jeringa: Jeringa; ui: number }> = ({ jeringa, ui }) => {
  const cap = CAPACIDAD_UI[jeringa];
  const excede = ui > cap;
  const llenado = Math.max(0, Math.min(ui, cap));
  const xl = X0 + (llenado / cap) * LARGO;
  const cada = cap <= 30 ? 5 : 10; // etiqueta numérica
  const ticks = Array.from({ length: cap + 1 }, (_, i) => i);
  const color = excede ? '#EF4444' : '#A891AA';

  return (
    <svg viewBox="0 0 700 150" className="w-full" role="img" aria-label={`Jeringa ${jeringa} marcada en ${ui.toFixed(1)} unidades`}>
      <defs>
        <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F3D9E6" /><stop offset="1" stopColor={color} /></linearGradient>
      </defs>
      {/* aguja */}
      <polygon points="2,78 38,76 38,80" fill="#9E8B9F" />
      <rect x="38" y="66" width="22" height="24" rx="3" fill="#D0AFC6" opacity="0.7" />
      {/* barril */}
      <rect x={X0} y="58" width={LARGO} height="40" rx="6" fill="#FAF6F9" stroke="#6D5572" strokeWidth="2" />
      <rect x={X0 + 1} y="59" width={Math.max(0, xl - X0 - 1)} height="38" rx="5" fill="url(#liq)" opacity="0.9" />
      {/* émbolo */}
      <rect x={xl} y="62" width="10" height="32" rx="2" fill="#4A354E" />
      <rect x={xl + 10} y="75" width={X0 + LARGO + 20 - xl} height="6" fill="#9E8B9F" />
      <rect x={X0 + LARGO + 28} y="66" width="8" height="24" rx="3" fill="#6D5572" />
      {/* graduación */}
      {ticks.map((i) => {
        const x = X0 + (i / cap) * LARGO;
        const mayor = i % cada === 0;
        const medio = !mayor && i % (cada / 2) === 0;
        return (
          <g key={i}>
            <line x1={x} x2={x} y1="98" y2={mayor ? 114 : medio ? 108 : 104} stroke="#4A354E" strokeWidth={mayor ? 1.6 : 1} />
            {mayor && <text x={x} y="130" textAnchor="middle" fontSize="12" fill="#4A354E" fontFamily="Inter, sans-serif">{i}</text>}
          </g>
        );
      })}
      {/* marcador */}
      {!excede && ui > 0 && (
        <g>
          <line x1={xl} x2={xl} y1="30" y2="58" stroke="#4A354E" strokeWidth="2" />
          <polygon points={`${xl - 6},24 ${xl + 6},24 ${xl},34`} fill="#4A354E" />
          <text x={xl} y="16" textAnchor="middle" fontSize="14" fontWeight="700" fill="#4A354E" fontFamily="Inter, sans-serif">{ui.toFixed(1)} UI</text>
        </g>
      )}
      {excede && <text x={X0 + LARGO / 2} y="30" textAnchor="middle" fontSize="14" fontWeight="700" fill="#EF4444" fontFamily="Inter, sans-serif">La dosis ({ui.toFixed(1)} UI) excede la jeringa {jeringa}</text>}
    </svg>
  );
};
