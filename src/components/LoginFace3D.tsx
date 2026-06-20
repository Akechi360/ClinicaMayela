import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const FaceModel: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const modelUrl = `${import.meta.env.BASE_URL || '/'}models/face.obj`.replace(/\/+/g, '/');
  const obj = useLoader(OBJLoader, modelUrl);

  const geometry = useMemo(() => {
    let meshGeom: THREE.BufferGeometry | null = null;
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshGeom = child.geometry.clone();
      }
    });
    if (!meshGeom) return new THREE.BufferGeometry();
    const geom = meshGeom as THREE.BufferGeometry;
    geom.center();
    geom.deleteAttribute('normal');
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    const bbox = geom.boundingBox;
    if (bbox) {
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) geom.scale(1.8 / maxDim, 1.8 / maxDim, 1.8 / maxDim);
    }
    return geom;
  }, [obj]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.3}>
      <group position={[0, -0.1, 0]}>
        {/* Solid face - pearlescent rose gold */}
        <mesh ref={meshRef} geometry={geometry}>
          <meshPhysicalMaterial
            color="#F0DDD4"
            metalness={0.25}
            roughness={0.35}
            clearcoat={0.8}
            clearcoatRoughness={0.2}
            envMapIntensity={0.6}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Wireframe overlay */}
        <mesh ref={glowRef} geometry={geometry} scale={1.002}>
          <meshBasicMaterial
            color="#E0BAA8"
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>

        {/* Glow rim - slightly larger */}
        <mesh geometry={geometry} scale={1.015}>
          <meshBasicMaterial
            color="#E2CCA3"
            transparent
            opacity={0.04}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    </Float>
  );
};

const Scene: React.FC = () => (
  <>
    <ambientLight intensity={0.6} />
    <directionalLight position={[3, 4, 5]} intensity={0.8} color="#FFFFFF" />
    <directionalLight position={[-2, 2, -3]} intensity={0.3} color="#E0BAA8" />
    <pointLight position={[0, 0, 3]} intensity={0.4} color="#E2CCA3" distance={8} />
    <Suspense fallback={null}>
      <FaceModel />
    </Suspense>
  </>
);

const LoadingFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rosa-petalo to-satin-copper-light flex items-center justify-center animate-pulse">
        <span className="material-symbols-outlined text-white text-lg">spa</span>
      </div>
      <p className="text-[9px] text-slate-light uppercase tracking-[0.15em] font-medium">Cargando...</p>
    </div>
  </div>
);

export const LoginFace3D: React.FC = () => {
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const ok = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('webgl2'))
      );
      setWebglOk(ok);
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (!webglOk) return <StaticFallback />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </Suspense>
  );
};

const StaticFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 260" fill="none" className="w-48 h-56 opacity-40">
      <ellipse cx="100" cy="120" rx="65" ry="82" stroke="#E0BAA8" strokeWidth="1" />
      <path d="M55 90 Q 70 82, 85 88" stroke="#E0BAA8" strokeWidth="0.8" />
      <path d="M115 88 Q 130 82, 145 90" stroke="#E0BAA8" strokeWidth="0.8" />
      <path d="M100 95 L 96 130 Q 100 136, 104 130 L 100 95" stroke="#E0BAA8" strokeWidth="0.8" />
      <path d="M82 150 Q 92 144, 100 146 Q 108 144, 118 150" stroke="#E0BAA8" strokeWidth="0.8" />
      <ellipse cx="75" cy="100" rx="10" ry="5" stroke="#E0BAA8" strokeWidth="0.8" />
      <ellipse cx="125" cy="100" rx="10" ry="5" stroke="#E0BAA8" strokeWidth="0.8" />
      <circle cx="65" cy="86" r="2" fill="#E0BAA8" opacity="0.3" />
      <circle cx="135" cy="86" r="2" fill="#E0BAA8" opacity="0.3" />
      <circle cx="100" cy="160" r="2" fill="#E0BAA8" opacity="0.3" />
    </svg>
  </div>
);
