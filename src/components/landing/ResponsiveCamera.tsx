import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface Props {
  baseZ: number;
}

/** En pantallas verticales aleja la cámara para que el rostro entre entre el título y el pie sin solaparlos. */
export const ResponsiveCamera: React.FC<Props> = ({ baseZ }) => {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const camera = get().camera;
    const aspect = size.width / size.height;
    const portrait = Math.max(0, 1 - aspect);
    camera.position.z = baseZ + portrait * 5;
    // La cámara sube un poco para bajar el busto y dejar aire bajo el título
    camera.position.y = portrait * 0.9;
    camera.updateProjectionMatrix();
  }, [get, size.width, size.height, baseZ]);

  return null;
};
