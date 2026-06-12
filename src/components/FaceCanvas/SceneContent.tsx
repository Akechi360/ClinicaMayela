import React, { useRef, useMemo, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { MapaFacialCoordenada } from '../../types/database.types';
import { ZONE_NAMES, getMarkerColorHex } from './sharedData';
import { CameraController } from './CameraController';
import { InjectionMarker } from './InjectionMarker';

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

export const SceneContent: React.FC<SceneContentProps> = ({
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
      // eslint-disable-next-line react-hooks/purity
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
        // eslint-disable-next-line react-hooks/immutability
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
