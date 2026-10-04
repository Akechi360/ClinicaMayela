import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InjectionMarkerProps {
  position: [number, number, number];
  color: string;
  index: number;
  onClick: (e: any) => void;
}

export const InjectionMarker: React.FC<InjectionMarkerProps> = ({ position, color, index, onClick }) => {
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
