import React from 'react';
import type { MapaFacialCoordenada } from '../../types/database.types';
import { ZONE_NAMES } from './sharedData';

interface FallbackCanvas2DProps {
  coordinates: MapaFacialCoordenada[];
  readOnly: boolean;
  selectedPoint: number | null;
  setSelectedPoint: (idx: number | null) => void;
  onAddPoint2D: (coords: { x: number; y: number; z: number; zona: string }) => void;
}

export const FallbackCanvas2D: React.FC<FallbackCanvas2DProps> = ({
  coordinates,
  readOnly,
  selectedPoint,
  setSelectedPoint,
  onAddPoint2D
}) => {
  const handleCanvasClick2D = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pctX = ((e.clientX - rect.left) / rect.width) * 100;
    const pctY = ((e.clientY - rect.top) / rect.height) * 100;

    const x3D = (pctX / 50) - 1;
    const y3D = 1 - (pctY / 50);

    let zoneIdx = 5;
    const normX = pctX / 100;
    const normY = 1 - (pctY / 100);

    if (normY > 0.68) {
      if (normY < 0.82 && Math.abs(normX - 0.5) < 0.12) zoneIdx = 1; // Glabela
      else zoneIdx = 0; // Frontal
    } else if (normY > 0.46) {
      if (Math.abs(normX - 0.5) < 0.12) zoneIdx = 1;
      else zoneIdx = 2; // Periorbital
    } else if (normY > 0.28) {
      zoneIdx = 3; // Zigomático
    } else if (normY > 0.15) {
      zoneIdx = 4; // Peribucal
    } else {
      zoneIdx = 5; // Mentón
    }
    const zoneName = ZONE_NAMES[zoneIdx];

    onAddPoint2D({
      x: x3D,
      y: y3D,
      z: 0.1,
      zona: zoneName
    });
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      <div
        onClick={handleCanvasClick2D}
        className="relative w-full max-w-xs h-96 sm:w-80 bg-rose-champagne-light rounded-xl border border-rose-champagne shadow-inner overflow-hidden flex items-center justify-center cursor-crosshair"
      >
        {/* Silueta de Rostro en SVG con estilo Premium */}
        <svg className="w-56 h-72 text-satin-copper/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M 50 15 C 32 15 28 35 28 55 C 28 75 38 88 50 88 C 62 88 72 75 72 55 C 72 35 68 15 50 15 Z" strokeWidth="1.2" />
          <path d="M 28 45 C 24 45 24 58 28 58" />
          <path d="M 72 45 C 76 45 76 58 72 58" />
          <ellipse cx="40" cy="45" rx="5" ry="2" />
          <ellipse cx="60" cy="45" rx="5" ry="2" />
          <path d="M 36 42 Q 40 40 44 42" strokeWidth="0.8" />
          <path d="M 56 42 Q 60 40 64 42" strokeWidth="0.8" />
          <path d="M 50 45 L 50 60 Q 50 62 48 62 M 50 62 Q 52 62 52 60" />
          <path d="M 42 70 Q 50 74 58 70" />
          <path d="M 44 70 Q 50 68 56 70" strokeWidth="0.5" />
        </svg>

        {/* Marcadores 2D */}
        {coordinates.map((pt, idx) => {
          const pctX = pt.z !== undefined ? (pt.x + 1) * 50 : pt.x;
          const pctY = pt.z !== undefined ? (1 - pt.y) * 50 : pt.y;

          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPoint(selectedPoint === idx ? null : idx);
              }}
              style={{ left: `${pctX}%`, top: `${pctY}%` }}
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 bg-satin-copper text-pure-white border-pure-white flex items-center justify-center text-[9px] font-sans font-bold shadow-lg transition-transform hover:scale-110 active:scale-95"
            >
              {idx + 1}
            </button>
          );
        })}

        {!readOnly && coordinates.length === 0 && (
          <div className="absolute bottom-3 left-3 right-3 bg-pure-white/45 backdrop-blur-md text-[9px] text-slate-medium text-center py-1.5 px-3 rounded-xl border border-satin-copper/15 font-sans select-none pointer-events-none shadow-sm uppercase tracking-wider font-semibold animate-pulse">
            Haz clic en el rostro para registrar una inyección
          </div>
        )}
      </div>
    </div>
  );
};
