import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  view: 'frontal' | 'perfil' | '3/4';
}

export const CameraController: React.FC<CameraControllerProps> = ({ view }) => {
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
