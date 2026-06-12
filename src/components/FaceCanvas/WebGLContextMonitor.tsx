import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export const WebGLContextMonitor: React.FC<{ onError: () => void }> = ({ onError }) => {
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
