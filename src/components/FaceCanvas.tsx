import React, { useState, useRef } from 'react';
import type { MapaFacialCoordenada } from '../types/database.types';
import { Trash2, X } from 'lucide-react';

interface FaceCanvasProps {
  coordinates: MapaFacialCoordenada[];
  onChange?: (coordinates: MapaFacialCoordenada[]) => void;
  readOnly?: boolean;
}

export const FaceCanvas: React.FC<FaceCanvasProps> = ({
  coordinates,
  onChange,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'frente' | 'perfil'>('frente');
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  
  // Estado para el punto que se está editando o creando
  const [showModal, setShowModal] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);
  const [producto, setProducto] = useState('Juvéderm Voluma');
  const [dosis, setDosis] = useState(1.0);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (!containerRef.current) return;

    // Si hicimos clic en un punto existente, no crear uno nuevo
    const target = e.target as HTMLElement;
    if (target.closest('.marker-point')) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setTempCoords({ x, y });
    setProducto('Toxina Botulínica (Botox)');
    setDosis(10);
    setShowModal(true);
    setSelectedPoint(null);
  };

  const handleAddPoint = () => {
    if (!tempCoords || !onChange) return;
    const nuevoPunto: MapaFacialCoordenada = {
      x: tempCoords.x,
      y: tempCoords.y,
      producto,
      dosis
    };
    onChange([...coordinates, nuevoPunto]);
    setShowModal(false);
    setTempCoords(null);
  };

  const handleRemovePoint = (index: number) => {
    if (readOnly || !onChange) return;
    const nuevas = [...coordinates];
    nuevas.splice(index, 1);
    onChange(nuevas);
    setSelectedPoint(null);
  };

  // Retorna el color del marcador según el tipo de producto
  const getMarkerColor = (prod: string) => {
    const p = prod.toLowerCase();
    if (p.includes('botox') || p.includes('toxina') || p.includes('xeomin')) {
      return 'bg-slate-dark text-pure-white border-pure-white';
    }
    if (p.includes('hialur') || p.includes('juvederm') || p.includes('restylane')) {
      return 'bg-satin-copper text-pure-white border-pure-white';
    }
    return 'bg-muted-olive text-pure-white border-pure-white';
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Selector de vistas */}
      <div className="flex gap-2 mb-4 bg-rose-champagne/40 p-1 rounded-full border border-rose-champagne/80">
        <button
          type="button"
          onClick={() => setActiveTab('frente')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium font-sans transition-all ${
            activeTab === 'frente'
              ? 'bg-slate-dark text-pure-white shadow-sm'
              : 'text-slate-medium hover:text-slate-dark'
          }`}
        >
          Vista Frontal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('perfil')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium font-sans transition-all ${
            activeTab === 'perfil'
              ? 'bg-slate-dark text-pure-white shadow-sm'
              : 'text-slate-medium hover:text-slate-dark'
          }`}
        >
          Vista Perfil
        </button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className={`relative w-80 h-96 bg-rose-champagne-light rounded-xl border border-rose-champagne shadow-inner overflow-hidden flex items-center justify-center ${
          readOnly ? 'cursor-default' : 'cursor-crosshair'
        }`}
      >
        {/* Silueta de Rostro en SVG con estilo Premium (Líneas satin-copper/slate) */}
        {activeTab === 'frente' ? (
          <svg className="w-56 h-72 text-satin-copper/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
            {/* Contorno de cara */}
            <path d="M 50 15 C 32 15 28 35 28 55 C 28 75 38 88 50 88 C 62 88 72 75 72 55 C 72 35 68 15 50 15 Z" strokeWidth="1.2" />
            {/* Orejas */}
            <path d="M 28 45 C 24 45 24 58 28 58" />
            <path d="M 72 45 C 76 45 76 58 72 58" />
            {/* Ojos */}
            <ellipse cx="40" cy="45" rx="5" ry="2" />
            <ellipse cx="60" cy="45" rx="5" ry="2" />
            <path d="M 36 42 Q 40 40 44 42" strokeWidth="0.8" />
            <path d="M 56 42 Q 60 40 64 42" strokeWidth="0.8" />
            {/* Nariz */}
            <path d="M 50 45 L 50 60 Q 50 62 48 62 M 50 62 Q 52 62 52 60" />
            {/* Boca */}
            <path d="M 42 70 Q 50 74 58 70" />
            <path d="M 44 70 Q 50 68 56 70" strokeWidth="0.5" />
            {/* Líneas guía de zonas */}
            <path d="M 28 35 L 72 35" strokeDasharray="2 2" strokeWidth="0.5" className="text-satin-copper/10" />
            <path d="M 28 50 L 72 50" strokeDasharray="2 2" strokeWidth="0.5" className="text-satin-copper/10" />
            <path d="M 28 65 L 72 65" strokeDasharray="2 2" strokeWidth="0.5" className="text-satin-copper/10" />
          </svg>
        ) : (
          <svg className="w-56 h-72 text-satin-copper/20" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
            {/* Silueta de perfil */}
            <path d="M 30 15 C 45 12 55 18 58 25 C 60 30 58 36 58 40 C 58 43 62 43 63 45 C 64 47 62 49 60 50 C 58 51 61 54 62 56 C 63 58 60 60 56 61 C 52 62 54 66 54 68 C 54 70 56 72 56 74 C 56 80 46 88 35 88 Z" strokeWidth="1.2" />
            {/* Ojo de perfil */}
            <path d="M 50 40 L 54 42 L 50 44 Z" />
            {/* Oreja de perfil */}
            <path d="M 38 46 C 33 46 33 56 38 56" />
          </svg>
        )}

        {/* Puntos registrados */}
        {coordinates.map((pt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPoint(selectedPoint === idx ? null : idx);
            }}
            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            className={`marker-point absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center text-[9px] font-sans font-bold shadow-lg transition-transform hover:scale-110 active:scale-95 ${getMarkerColor(
              pt.producto
            )}`}
            title={`${pt.producto}: ${pt.dosis}`}
          >
            {idx + 1}
          </button>
        ))}

        {/* Popover flotante del punto seleccionado */}
        {selectedPoint !== null && (
          <div
            style={{
              left: `${coordinates[selectedPoint].x}%`,
              top: `${coordinates[selectedPoint].y - 12}%`
            }}
            className="absolute z-30 -translate-x-1/2 -translate-y-full bg-slate-dark text-pure-white text-xs rounded-lg p-3 shadow-xl border border-satin-copper/30 w-44 font-sans"
          >
            <div className="flex justify-between items-start mb-1.5">
              <span className="font-semibold text-satin-copper-light">Punto #{selectedPoint + 1}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemovePoint(selectedPoint)}
                  className="text-slate-light hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
            <p className="font-medium text-pure-white truncate">{coordinates[selectedPoint].producto}</p>
            <p className="text-[10px] text-slate-light mt-0.5">Dosis: <span className="text-pure-white font-medium">{coordinates[selectedPoint].dosis} {coordinates[selectedPoint].producto.toLowerCase().includes('botox') ? 'U' : 'ml'}</span></p>
            <button
              type="button"
              onClick={() => setSelectedPoint(null)}
              className="mt-2 w-full text-center py-1 bg-slate-medium/40 hover:bg-slate-medium/60 text-[10px] rounded transition-colors text-pure-white"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Instrucciones cuando está vacío */}
        {!readOnly && coordinates.length === 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-pure-white/40 backdrop-blur-md text-[10px] text-slate-medium text-center py-1.5 px-3 rounded-xl border border-satin-copper/15 font-sans select-none pointer-events-none shadow-sm">
            Haz clic en el rostro para marcar las inyecciones
          </div>
        )}
      </div>

      {/* Modal para añadir punto */}
      {showModal && tempCoords && (
        <div className="fixed inset-0 bg-slate-dark/45 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-xl shadow-2xl p-6 w-full max-w-sm font-sans border border-pure-white/45">
            <div className="flex justify-between items-center mb-4 border-b border-satin-copper/15 pb-3">
              <h3 className="text-sm font-medium text-slate-dark font-display">Registrar Inyección</h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setTempCoords(null);
                }}
                className="text-slate-medium hover:text-slate-dark cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Selección de Producto */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-medium mb-1.5 font-semibold">Producto</label>
                <select
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
                >
                  <option value="Toxina Botulínica (Botox)" className="bg-rose-champagne-light text-slate-dark">Toxina Botulínica (Botox)</option>
                  <option value="Juvéderm Volux XC (Mentón/Mandíbula)" className="bg-rose-champagne-light text-slate-dark">Juvéderm Volux XC (Mentón/Mandíbula)</option>
                  <option value="Restylane Kysse (Labios)" className="bg-rose-champagne-light text-slate-dark">Restylane Kysse (Labios)</option>
                  <option value="Juvéderm Voluma (Pómulos)" className="bg-rose-champagne-light text-slate-dark">Juvéderm Voluma (Pómulos)</option>
                  <option value="Radiesse (Bioestimulador)" className="bg-rose-champagne-light text-slate-dark">Radiesse (Bioestimulador)</option>
                  <option value="Belotero Balance (Ojeras)" className="bg-rose-champagne-light text-slate-dark">Belotero Balance (Ojeras)</option>
                </select>
              </div>

              {/* Dosis */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-medium mb-1.5 font-semibold">
                  Dosis ({producto.toLowerCase().includes('botox') ? 'Unidades' : 'Mililitros ml'})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step={producto.toLowerCase().includes('botox') ? 1 : 0.1}
                    min={0.1}
                    value={dosis}
                    onChange={(e) => setDosis(parseFloat(e.target.value) || 0)}
                    className="w-full bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
                  />
                </div>
              </div>

              {/* Guardar */}
              <button
                type="button"
                onClick={handleAddPoint}
                className="w-full satin-button text-pure-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl cursor-pointer"
              >
                Registrar Punto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
