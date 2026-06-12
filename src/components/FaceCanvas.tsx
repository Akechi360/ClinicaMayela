import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import type { MapaFacialCoordenada } from '../types/database.types';

// Definición de Props del Componente
interface FaceCanvasProps {
  coordinates: MapaFacialCoordenada[];
  onChange?: (coordinates: MapaFacialCoordenada[]) => void;
  readOnly?: boolean;
}

// 1. ErrorBoundary para capturar errores de DOM en la inicialización del Canvas
class DOMWebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("DOMWebGLErrorBoundary capturó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 2. ErrorBoundary interno para capturar fallos dentro del reconcilador R3F
class CanvasErrorBoundary extends React.Component<
  { onError: (error: any) => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // No renderizar nada en 3D
    }
    return this.props.children;
  }
}

// Nombres y Colores Clínicos de las Zonas
const ZONE_NAMES = ['Frontal', 'Glabela', 'Periorb.', 'Zigomático', 'Peribucal', 'Mentón'];

const ZONE_COLORS = [
  'bg-sky-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-orange-600',
  'bg-violet-400'
];

// Mapeo Hexadecimal para los Marcadores de Inyección
const getMarkerColorHex = (prod: string) => {
  const p = prod.toLowerCase();
  if (p.includes('botox') || p.includes('toxina') || p.includes('xeomin')) {
    return '#3A434D'; // Slate dark
  }
  if (p.includes('hialur') || p.includes('juvederm') || p.includes('restylane')) {
    return '#A66E53'; // Satin copper
  }
  return '#7A8068'; // Muted olive
};

// 3. Controlador de Cámara Suave (Transiciones de Vistas)
const CameraController: React.FC<{ view: 'frontal' | 'perfil' | '3/4' }> = ({ view }) => {
  const { camera, controls } = useThree();

  useEffect(() => {
    const targetPos = new THREE.Vector3(0, 0, 2.5);
    if (view === 'perfil') {
      targetPos.set(2.5, 0, 0);
    } else if (view === '3/4') {
      targetPos.set(1.8, 0.5, 1.8);
    }

    // Resetear el foco/objetivo si el usuario había hecho panning
    if (controls) {
      (controls as any).target.set(0, 0, 0);
      (controls as any).update();
    }

    let count = 0;
    const interval = setInterval(() => {
      camera.position.lerp(targetPos, 0.15);
      camera.lookAt(0, 0, 0);
      count++;
      if (count > 25) {
        clearInterval(interval);
        if (controls) {
          (controls as any).update();
        }
      }
    }, 16);

    return () => clearInterval(interval);
  }, [view, camera, controls]);

  return null;
};

// 4. Marcador de Inyección Tridimensional y Pulsante
interface InjectionMarkerProps {
  position: [number, number, number];
  color: string;
  index: number;
  onClick: (e: any) => void;
}

const InjectionMarker: React.FC<InjectionMarkerProps> = ({ position, color, index, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 0.9 + 0.15 * Math.sin(time * 3.5 + index);
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <sphereGeometry args={[0.038, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.15}
        metalness={0.15}
      />
    </mesh>
  );
};

// 5. Contenido Principal de la Escena 3D
interface SceneContentProps {
  coordinates: MapaFacialCoordenada[];
  onChange?: (coordinates: MapaFacialCoordenada[]) => void;
  readOnly: boolean;
  view: 'frontal' | 'perfil' | '3/4';
  showHeatmap: boolean;
  zoneDoses: number[];
  selectedPoint: number | null;
  setSelectedPoint: (idx: number | null) => void;
  setTempCoords: (coords: { x: number; y: number; z: number; zona: string } | null) => void;
  setProducto: (p: string) => void;
  setDosis: (d: number) => void;
  setShowModal: (show: boolean) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({
  coordinates,
  readOnly,
  view,
  showHeatmap,
  zoneDoses,
  selectedPoint,
  setSelectedPoint,
  setTempCoords,
  setProducto,
  setDosis,
  setShowModal
}) => {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: any) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  // Resolver el path del OBJ usando BASE_URL de Vite
  const modelUrl = `${import.meta.env.BASE_URL || '/'}models/face.obj`.replace(/\/+/g, '/');

  // Cargar modelo
  const obj = useLoader(OBJLoader, modelUrl);

  // Procesamiento, centrado, escalado y segmentación
  const geometry = useMemo(() => {
    let meshGeom: THREE.BufferGeometry | null = null;
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshGeom = child.geometry.clone();
      }
    });

    if (!meshGeom) return new THREE.BufferGeometry();

    const geom = meshGeom as THREE.BufferGeometry;

    // 1. Centrar la geometría en [0, 0, 0] para una rotación perfecta
    geom.center();

    // 2. Re-calcular normales limpias apuntando hacia afuera
    geom.deleteAttribute('normal');
    geom.computeVertexNormals();

    // 3. Escalar a un tamaño uniforme de visualización (ajuste de escala)
    geom.computeBoundingBox();
    const bbox = geom.boundingBox;
    if (!bbox) return geom;

    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      // Escalar de forma que la dimensión máxima sea 1.2 unidades
      geom.scale(1.2 / maxDim, 1.2 / maxDim, 1.2 / maxDim);
    }

    // 4. Re-calcular bounding box y segmentar en zonas anatómicas
    geom.computeBoundingBox();
    const bboxScaled = geom.boundingBox;
    if (!bboxScaled) return geom;

    const min = bboxScaled.min;
    const max = bboxScaled.max;
    const rangeX = max.x - min.x;
    const rangeY = max.y - min.y;

    const posAttr = geom.getAttribute('position');
    if (!posAttr) return geom;
    const count = posAttr.count;

    const zones = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);

      // Normalizar coordenadas a [0, 1] para la clasificación
      const normX = rangeX > 0 ? (x - min.x) / rangeX : 0.5;
      const normY = rangeY > 0 ? (y - min.y) / rangeY : 0.5;

      // Clasificación espacial
      let zoneIdx = 5;
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
      zones[i] = zoneIdx;
    }

    (geom as any).vertexZones = zones;
    return geom;
  }, [obj]);

  // Colores para el Heatmap
  const colors = useMemo(() => {
    const posAttr = geometry.getAttribute('position');
    if (!posAttr) return new Float32Array();

    const count = posAttr.count;
    const cols = new Float32Array(count * 3);
    const zones = (geometry as any).vertexZones;

    const skinColor = new THREE.Color('#ebdcd5');
    const coldColor = new THREE.Color('#c8e8f4');
    const warmColor = new THREE.Color('#f4a050');
    const hotColor = new THREE.Color('#c0302a');

    const maxDose = Math.max(...zoneDoses, 1);

    for (let i = 0; i < count; i++) {
      const zone = zones ? zones[i] : 5;
      const dose = zoneDoses[zone];
      let col = skinColor;

      if (showHeatmap && dose > 0) {
        const t = Math.min(dose / maxDose, 1);
        col = new THREE.Color();
        if (t < 0.5) {
          col.copy(coldColor).lerp(warmColor, t * 2);
        } else {
          col.copy(warmColor).lerp(hotColor, (t - 0.5) * 2);
        }
      }
      cols[i * 3] = col.r;
      cols[i * 3 + 1] = col.g;
      cols[i * 3 + 2] = col.b;
    }
    return cols;
  }, [geometry, zoneDoses, showHeatmap]);

  // Procedural skin pore texture
  const skinNoiseTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      data[i]     = Math.min(255, Math.max(0, 128 + noise));
      data[i + 1] = Math.min(255, Math.max(0, 128 + noise));
      data[i + 2] = Math.min(255, Math.max(0, 128 + noise));
      data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40); // 40 repetitions for very fine micro-pores
    return texture;
  }, []);

  // Asignar colores a la geometría de forma reactiva
  useEffect(() => {
    if (geometry && colors.length > 0) {
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      if (geometry.attributes.color) {
        geometry.attributes.color.needsUpdate = true;
      }
    }
  }, [geometry, colors]);

  const getMarkerPosition = (pt: MapaFacialCoordenada): [number, number, number] => {
    if (pt.z !== undefined) {
      return [pt.x, pt.y, pt.z];
    }

    const targetX = (pt.x / 50) - 1;
    const targetY = 1 - (pt.y / 50);

    const posAttr = geometry.getAttribute('position');
    if (!posAttr) return [targetX, targetY, 0];

    let closestDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const dx = vx - targetX;
      const dy = vy - targetY;
      const dist = dx * dx + dy * dy;
      if (dist < closestDistance) {
        closestDistance = dist;
        closestIndex = i;
      }
    }

    return [
      posAttr.getX(closestIndex),
      posAttr.getY(closestIndex),
      posAttr.getZ(closestIndex)
    ];
  };

  const handleFaceClick = (e: any) => {
    if (readOnly) return;
    e.stopPropagation();

    // Evitar registrar puntos al arrastrar/rotar la cámara
    if (pointerStartRef.current) {
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        return; // Fue un arrastre, ignorar el clic
      }
    }

    if (e.object.type === 'Mesh' && e.object.geometry.type === 'SphereGeometry') return;

    const point = e.point;
    const posAttr = geometry.getAttribute('position');
    if (!posAttr) return;

    let closestDistance = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);

      const dx = vx - point.x;
      const dy = vy - point.y;
      const dz = vz - point.z;
      const dist = dx * dx + dy * dy + dz * dz;
      if (dist < closestDistance) {
        closestDistance = dist;
        closestIndex = i;
      }
    }

    const zones = (geometry as any).vertexZones;
    const zoneIdx = zones ? zones[closestIndex] : 5;
    const zoneName = ZONE_NAMES[zoneIdx];

    setTempCoords({
      x: point.x,
      y: point.y,
      z: point.z,
      zona: zoneName
    });
    setProducto(zoneName.includes('Frontal') || zoneName.includes('Glabela') ? 'Toxina Botulínica (Botox)' : 'Restylane Kysse (Labios)');
    setDosis(zoneName.includes('Frontal') || zoneName.includes('Glabela') ? 10 : 1.0);
    setShowModal(true);
    setSelectedPoint(null);
  };

  return (
    <group>
      <CameraController view={view} />

      {/* Rostro 3D */}
      <mesh onClick={handleFaceClick} onPointerDown={handlePointerDown} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.7}
          metalness={0.02}
          emissive="#26130d"
          emissiveIntensity={1.0}
          bumpMap={skinNoiseTexture || undefined}
          bumpScale={0.003}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe Fino */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          wireframe
          color="#A66E53"
          opacity={0.12}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Marcadores */}
      {coordinates.map((pt, idx) => (
        <InjectionMarker
          key={idx}
          position={getMarkerPosition(pt)}
          color={getMarkerColorHex(pt.producto)}
          index={idx}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPoint(selectedPoint === idx ? null : idx);
          }}
        />
      ))}

    </group>
  );
};

// 6. Monitor de Contexto WebGL para detectar caídas/bloqueos asíncronos en el navegador
const WebGLContextMonitor: React.FC<{ onError: () => void }> = ({ onError }) => {
  const { gl } = useThree();

  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL Context Lost detectado por el monitor de Canvas!");
      onError();
    };

    const canvasEl = gl.domElement;
    if (canvasEl) {
      canvasEl.addEventListener('webglcontextlost', handleContextLost);
    }
    return () => {
      if (canvasEl) {
        canvasEl.removeEventListener('webglcontextlost', handleContextLost);
      }
    };
  }, [gl, onError]);

  return null;
};

// Componente Principal Exportado
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
      setWebglAvailable(available);
    } catch (e) {
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

  // Manejar click 2D de contingencia
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

    setTempCoords({
      x: x3D,
      y: y3D,
      z: 0.1,
      zona: zoneName
    });
    setProducto(zoneName.includes('Frontal') || zoneName.includes('Glabela') ? 'Toxina Botulínica (Botox)' : 'Restylane Kysse (Labios)');
    setDosis(zoneName.includes('Frontal') || zoneName.includes('Glabela') ? 10 : 1.0);
    setShowModal(true);
    setSelectedPoint(null);
  };

  // Renderizador del Fallback Plano (2D SVG)
  const renderFallback2D = () => {
    return (
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        <div
          onClick={handleCanvasClick2D}
          className="relative w-80 h-96 bg-rose-champagne-light rounded-xl border border-rose-champagne shadow-inner overflow-hidden flex items-center justify-center cursor-crosshair"
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
            <DOMWebGLErrorBoundary fallback={renderFallback2D()}>
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
            renderFallback2D()
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

// Vértices y zonas auxiliares para fallback de compatibilidad antes de la carga del OBJ
const verticesArrayForFallback = [
  -0.7, 0.8, 0.0,   -0.35, 0.85, 0.1,  0.0, 0.88, 0.12,  0.35, 0.85, 0.1,  0.7, 0.8, 0.0,
  -0.65, 0.55, 0.1,  -0.3, 0.6, 0.18,  0.0, 0.63, 0.2,   0.3, 0.6, 0.18,  0.65, 0.55, 0.1,
  -0.58, 0.3, 0.15,  -0.2, 0.33, 0.25, 0.0, 0.35, 0.3,   0.2, 0.33, 0.25, 0.58, 0.3, 0.15,
  -0.6, 0.05, 0.1,   -0.18, 0.05, 0.22, 0.0, 0.08, 0.38,  0.18, 0.05, 0.22, 0.6, 0.05, 0.1,
  -0.68, -0.25, 0.0,  -0.3, -0.2, 0.25, 0.0, -0.15, 0.48,  0.3, -0.2, 0.25, 0.68, -0.25, 0.0,
  -0.45, -0.5, 0.08,  -0.18, -0.52, 0.26, 0.0, -0.5, 0.32,  0.18, -0.52, 0.26, 0.45, -0.5, 0.08,
  -0.35, -0.74, 0.05, -0.15, -0.76, 0.22, 0.0, -0.78, 0.26,  0.15, -0.76, 0.22, 0.35, -0.74, 0.05,
  0.0, -0.92, 0.15
];

const vZoneForFallback = [
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  2, 1, 1, 1, 2,
  2, 2, 3, 2, 2,
  3, 3, 3, 3, 3,
  4, 4, 4, 4, 4,
  5, 5, 5, 5, 5,
  5
];
