import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import type { MapaFacialCoordenada } from '../../types/database.types';
import {
  ZONE_NAMES,
  ZONE_COLORS,
  verticesArrayForFallback,
  vZoneForFallback
} from './sharedData';
import { DOMWebGLErrorBoundary, CanvasErrorBoundary } from './DOMWebGLErrorBoundary';
import { WebGLContextMonitor } from './WebGLContextMonitor';
import { SceneContent } from './SceneContent';
import { FallbackCanvas2D } from './FallbackCanvas2D';

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
  const [view, setView] = useState<'frontal' | 'perfil' | '3/4'>('frontal');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const [webglAvailable, setWebglAvailable] = useState(true);
  const [hasCrash, setHasCrash] = useState(false);

  // Formulario temporal
  const [showModal, setShowModal] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number; z: number; zona: string } | null>(null);
  const [producto, setProducto] = useState('Toxina Botulínica (Botox)');
  const [dosis, setDosis] = useState(10);

  // Comprobar la disponibilidad de WebGL al montar
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const available = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') ||
          canvas.getContext('experimental-webgl') ||
          canvas.getContext('webgl2'))
      );
      Promise.resolve().then(() => {
        setWebglAvailable(available);
      });
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  // Calcular dosis acumulada por zona en base a los datos actuales
  const zoneDoses = useMemo(() => {
    const doses = [0, 0, 0, 0, 0, 0];
    coordinates.forEach((pt) => {
      if (pt.zona && ZONE_NAMES.includes(pt.zona)) {
        const zoneIdx = ZONE_NAMES.indexOf(pt.zona);
        doses[zoneIdx] += pt.dosis;
      } else {
        const targetX = (pt.x / 50) - 1;
        const targetY = 1 - (pt.y / 50);

        let closestDistance = Infinity;
        let closestIndex = 0;

        for (let i = 0; i < 36; i++) {
          const vx = verticesArrayForFallback[i * 3];
          const vy = verticesArrayForFallback[i * 3 + 1];
          const dx = vx - targetX;
          const dy = vy - targetY;
          const dist = dx * dx + dy * dy;
          if (dist < closestDistance) {
            closestDistance = dist;
            closestIndex = i;
          }
        }
        const zoneIdx = vZoneForFallback[closestIndex];
        doses[zoneIdx] += pt.dosis;
      }
    });
    return doses;
  }, [coordinates]);

  const handleAddPoint = () => {
    if (!tempCoords || !onChange) return;

    const nuevoPunto: MapaFacialCoordenada = {
      x: tempCoords.x,
      y: tempCoords.y,
      z: tempCoords.z,
      zona: tempCoords.zona,
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

  const handleAddPoint2D = (coords: { x: number; y: number; z: number; zona: string }) => {
    setTempCoords(coords);
    setProducto(coords.zona.includes('Frontal') || coords.zona.includes('Glabela') ? 'Toxina Botulínica (Botox)' : 'Restylane Kysse (Labios)');
    setDosis(coords.zona.includes('Frontal') || coords.zona.includes('Glabela') ? 10 : 1.0);
    setShowModal(true);
    setSelectedPoint(null);
  };

  const show3D = webglAvailable && !hasCrash;

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto glass-panel p-6 rounded-3xl border border-pure-white/40 shadow-luxury font-sans select-none">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-satin-copper/10 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-display font-medium text-slate-dark uppercase tracking-wider">Mapeo Facial 3D</h3>
          {show3D ? (
            <span className="text-[8px] bg-satin-copper/10 text-satin-copper border border-satin-copper/25 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Interactivo 3D</span>
          ) : (
            <span className="text-[8px] bg-amber-500/10 text-amber-600 border border-amber-500/25 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
              <AlertTriangle size={10} /> Fallback 2D
            </span>
          )}
        </div>

        {/* Controles de vista y Heatmap (solo visibles en modo 3D) */}
        {show3D && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Vistas 3D */}
            <div className="flex bg-rose-champagne/45 p-0.5 rounded-full border border-rose-champagne/80 shadow-sm">
              {(['frontal', 'perfil', '3/4'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    view === v
                      ? 'bg-slate-dark text-pure-white shadow-sm font-bold'
                      : 'text-slate-medium hover:text-slate-dark font-medium'
                  }`}
                >
                  {v === '3/4' ? '3/4' : v}
                </button>
              ))}
            </div>

            {/* Toggle Heatmap */}
            <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-medium cursor-pointer bg-pure-white/35 border border-satin-copper/15 px-3 py-1 rounded-full hover:bg-pure-white/55 transition-all shadow-sm">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="rounded text-satin-copper focus:ring-satin-copper border-satin-copper/25 w-3.5 h-3.5 cursor-pointer"
              />
              Mapa de Calor
            </label>
          </div>
        )}
      </div>

      {/* Área Central de Visualización y Leyendas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Contenedor del Canvas de R3F o Fallback 2D */}
        <div className="md:col-span-8 relative w-full h-[380px] bg-gradient-to-b from-rose-champagne-light/35 to-rose-champagne-light/70 rounded-2xl border border-rose-champagne shadow-inner overflow-hidden flex items-center justify-center">
          {show3D ? (
            <DOMWebGLErrorBoundary fallback={
              <FallbackCanvas2D
                coordinates={coordinates}
                readOnly={readOnly}
                selectedPoint={selectedPoint}
                setSelectedPoint={setSelectedPoint}
                onAddPoint2D={handleAddPoint2D}
              />
            }>
              <Canvas
                camera={{ position: [0, 0, 2.5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0);
                }}
              >
                <CanvasErrorBoundary onError={(err) => {
                  console.warn("Error capturado dentro del Canvas de R3F, activando fallback en DOM:", err);
                  setHasCrash(true);
                }}>
                  <WebGLContextMonitor onError={() => setHasCrash(true)} />
                  <ambientLight intensity={0.65} />
                  <directionalLight position={[5, 5, 5]} intensity={1.2} />
                  <directionalLight position={[-5, 5, 5]} intensity={0.8} />
                  <directionalLight position={[0, -5, 5]} intensity={0.4} />
                  <pointLight position={[0, 0, 3]} intensity={0.6} />
                  
                  <Suspense fallback={
                    <Html center>
                      <div className="text-xs font-semibold text-slate-medium font-sans animate-pulse bg-pure-white/85 py-2 px-4 rounded-xl border border-satin-copper/15 shadow-sm text-center">
                        Cargando modelo...
                      </div>
                    </Html>
                  }>
                    <SceneContent
                      coordinates={coordinates}
                      readOnly={readOnly}
                      view={view}
                      showHeatmap={showHeatmap}
                      zoneDoses={zoneDoses}
                      selectedPoint={selectedPoint}
                      setSelectedPoint={setSelectedPoint}
                      setTempCoords={setTempCoords}
                      setProducto={setProducto}
                      setDosis={setDosis}
                      setShowModal={setShowModal}
                    />
                  </Suspense>

                  <OrbitControls
                    enablePan={true}
                    minDistance={0.4}
                    maxDistance={3.5}
                    makeDefault
                  />
                </CanvasErrorBoundary>
              </Canvas>
            </DOMWebGLErrorBoundary>
          ) : (
            <FallbackCanvas2D
              coordinates={coordinates}
              readOnly={readOnly}
              selectedPoint={selectedPoint}
              setSelectedPoint={setSelectedPoint}
              onAddPoint2D={handleAddPoint2D}
            />
          )}

          {/* Cartel flotante instructivo de ayuda (solo 3D) */}
          {show3D && !readOnly && coordinates.length === 0 && (
            <div className="absolute bottom-3 left-3 right-3 bg-pure-white/45 backdrop-blur-md text-[9px] text-slate-medium text-center py-1.5 px-3 rounded-xl border border-satin-copper/15 font-sans select-none pointer-events-none shadow-sm uppercase tracking-wider font-semibold">
              Haz clic en el rostro 3D para registrar una inyección
            </div>
          )}

          {/* Modal flotante de Formulario (Compartido entre 3D y 2D, 100% estable y proporcional) */}
          {showModal && tempCoords && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel rounded-xl shadow-2xl p-5 w-56 border border-pure-white/45 text-slate-dark font-sans select-none z-50">
              <div className="flex justify-between items-center mb-3 border-b border-satin-copper/15 pb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-satin-copper">Zona: {tempCoords.zona}</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setTempCoords(null);
                  }}
                  className="text-slate-medium hover:text-slate-dark cursor-pointer border-none bg-transparent"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Producto</label>
                  <select
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-2 py-1.5 text-[10px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold cursor-pointer"
                  >
                    <option value="Toxina Botulínica (Botox)">Botox (Frente/Cejas)</option>
                    <option value="Juvéderm Volux XC (Mentón/Mandíbula)">Juvéderm Volux (Mentón)</option>
                    <option value="Restylane Kysse (Labios)">Restylane Kysse (Labios)</option>
                    <option value="Juvéderm Voluma (Pómulos)">Juvéderm Voluma (Pómulos)</option>
                    <option value="Radiesse (Bioestimulador)">Radiesse (Cheeks)</option>
                    <option value="Belotero Balance (Ojeras)">Belotero (Ojeras)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Dosis</label>
                  <input
                    type="number"
                    step={producto.toLowerCase().includes('botox') ? 1 : 0.1}
                    min={0.1}
                    value={dosis}
                    onChange={(e) => setDosis(parseFloat(e.target.value) || 0)}
                    className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-2 py-1 text-[10px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="w-full satin-button text-pure-white text-[9px] font-bold uppercase tracking-wider py-1.5 rounded-lg cursor-pointer"
                >
                  Registrar Punto
                </button>
              </div>
            </div>
          )}

          {/* Popover Detalle de Inyección (Compartido entre 3D y 2D, 100% estable) */}
          {selectedPoint !== null && coordinates[selectedPoint] && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-dark/95 backdrop-blur-md text-pure-white text-[10px] rounded-xl p-3.5 shadow-2xl border border-satin-copper/30 w-44 font-sans z-50 select-none">
              <div className="flex justify-between items-center mb-1.5 border-b border-pure-white/15 pb-1">
                <span className="font-bold text-satin-copper-light text-[9px] uppercase tracking-wider">Inyección #{selectedPoint + 1}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(selectedPoint)}
                    className="text-slate-light hover:text-red-400 cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <p className="font-semibold text-pure-white truncate">{coordinates[selectedPoint].producto}</p>
              <p className="text-slate-light mt-0.5 font-sans">
                Dosis: <span className="text-pure-white font-bold">{coordinates[selectedPoint].dosis} {coordinates[selectedPoint].producto.toLowerCase().includes('botox') ? 'U' : 'ml'}</span>
              </p>
              {coordinates[selectedPoint].zona && (
                <p className="text-slate-light font-sans text-[8px] uppercase tracking-widest mt-0.5">Zona: <span className="text-pure-white font-bold">{coordinates[selectedPoint].zona}</span></p>
              )}
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="mt-2 w-full text-center py-1 bg-pure-white/10 hover:bg-pure-white/25 text-[8px] font-bold uppercase tracking-wider rounded transition-colors text-pure-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Panel lateral: Leyenda de Zonas */}
        <div className="md:col-span-4 glass-panel p-5 rounded-2xl border border-satin-copper/10 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.15em] text-slate-light font-bold border-b border-satin-copper/10 pb-2.5 mb-3">Zonas Anatómicas</h4>
            <div className="space-y-3">
              {ZONE_NAMES.map((name, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                  <span className="flex items-center gap-2 text-slate-dark font-semibold">
                    <span className={`w-2.5 h-2.5 rounded-full ${ZONE_COLORS[idx]} border border-pure-white/40 shadow-sm`}></span>
                    {name}
                  </span>
                  <span className="font-bold text-slate-medium bg-pure-white/40 border border-satin-copper/10 px-2 py-0.5 rounded text-[10px]">
                    {zoneDoses[idx]} {name === 'Frontal' || name === 'Glabela' ? 'U' : 'ml'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-pure-white/20 p-3 rounded-xl border border-satin-copper/10 text-[9px] text-slate-medium leading-relaxed font-sans mt-4">
            <span className="font-bold text-slate-dark block mb-0.5 uppercase tracking-widest text-[8px]">Modelo de Interacción</span>
            {show3D ? (
              <span>Arrastra el ratón para rotar el modelo facial. Utiliza la rueda del ratón para hacer zoom. Haz clic para posicionar puntos clínicos.</span>
            ) : (
              <span>Haz clic sobre el rostro bidimensional para ubicar y registrar el punto exacto de la inyección aplicada.</span>
            )}
          </div>
        </div>

      </div>

      {/* Pie del lienzo: Leyenda y Métricas */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-satin-copper/10">
        {/* Leyenda Degradado Mapa Calor */}
        {showHeatmap && show3D ? (
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-light">
            <span>Sin dosis</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-[#ebdcd5] via-[#f4a050] to-[#c0302a] border border-satin-copper/10"></div>
            <span>Dosis Máxima</span>
          </div>
        ) : (
          <div className="text-[9px] text-slate-light font-bold uppercase tracking-wider">
            Leyenda de mapa de calor oculta
          </div>
        )}

        {/* Contador de Puntos */}
        <div className="text-[9px] text-slate-light font-bold uppercase tracking-wider">
          {coordinates.length} puntos registrados en sesión
        </div>
      </div>

    </div>
  );
};
