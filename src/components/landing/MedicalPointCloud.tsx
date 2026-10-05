import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './headShaders';

interface Props {
  pointCount?: number;
}

// Boca/mentón en el espacio normalizado del modelo (medido sobre LeePerrySmith.glb:
// punta de la nariz ≈ (-0.03, 0.39, 0.91); labios ≈ y 0.0; mentón ≈ y -0.25).
const MOUTH_CENTER = new THREE.Vector3(0.0, -0.08, 0.78);

function buildHeadPointCloud(scene: THREE.Object3D, normalTex: THREE.Texture, pointCount: number) {
  let mesh: THREE.Mesh | null = null;
  scene.updateMatrixWorld(true);
  scene.traverse((child) => {
    if (!mesh && child instanceof THREE.Mesh) mesh = child;
  });

  const pos = new Float32Array(pointCount * 3);
  const rnd = new Float32Array(pointCount * 3);
  const sz = new Float32Array(pointCount);
  const nrm = new Float32Array(pointCount * 3);
  let geom: THREE.BufferGeometry | null = null;

  if (mesh) {
    const m = mesh as THREE.Mesh;
    geom = m.geometry.clone().applyMatrix4(m.matrixWorld);
    geom.center();
    geom.computeBoundingBox();
    const size = new THREE.Vector3();
    geom.boundingBox!.getSize(size);
    const k = 3.0 / Math.max(size.x, size.y, size.z);
    geom.scale(k, k, k);

    // Mapa de normales → bytes RGBA, para perturbar la normal de cada partícula
    const img = normalTex.image as HTMLImageElement;
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const map = ctx.getImageData(0, 0, cv.width, cv.height).data;
    const mw = cv.width;
    const mh = cv.height;

    const posA = geom.attributes.position;
    const nrmA = geom.attributes.normal;
    const uvA = geom.attributes.uv;
    const index = geom.index;
    const triCount = index ? index.count / 3 : posA.count / 3;
    const vi = (t: number, k: number) => (index ? index.getX(t * 3 + k) : t * 3 + k);

    // Muestreo uniforme por área
    const cum = new Float64Array(triCount);
    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    let total = 0;
    for (let t = 0; t < triCount; t++) {
      v0.fromBufferAttribute(posA, vi(t, 0));
      v1.fromBufferAttribute(posA, vi(t, 1));
      v2.fromBufferAttribute(posA, vi(t, 2));
      total += v1.clone().sub(v0).cross(v2.clone().sub(v0)).length() * 0.5;
      cum[t] = total;
    }

    const n = new THREE.Vector3();
    const T = new THREE.Vector3();
    const B = new THREE.Vector3();
    const e1 = new THREE.Vector3();
    const e2 = new THREE.Vector3();
    const nn = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    for (let i = 0; i < pointCount; i++) {
      const r = Math.random() * total;
      let lo = 0;
      let hi = triCount - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      const t = lo;
      const i0 = vi(t, 0);
      const i1 = vi(t, 1);
      const i2 = vi(t, 2);
      let wa = Math.random();
      let wb = Math.random();
      if (wa + wb > 1) {
        wa = 1 - wa;
        wb = 1 - wb;
      }
      const wc = 1 - wa - wb;

      v0.fromBufferAttribute(posA, i0);
      v1.fromBufferAttribute(posA, i1);
      v2.fromBufferAttribute(posA, i2);
      const px = v0.x * wc + v1.x * wa + v2.x * wb;
      const py = v0.y * wc + v1.y * wa + v2.y * wb;
      const pz = v0.z * wc + v1.z * wa + v2.z * wb;

      nn[0].fromBufferAttribute(nrmA, i0);
      nn[1].fromBufferAttribute(nrmA, i1);
      nn[2].fromBufferAttribute(nrmA, i2);
      n.set(0, 0, 0).addScaledVector(nn[0], wc).addScaledVector(nn[1], wa).addScaledVector(nn[2], wb).normalize();

      // UV interpolada (glTF: origen arriba-izquierda, igual que la imagen)
      const u0 = uvA.getX(i0), w0 = uvA.getY(i0);
      const u1 = uvA.getX(i1), w1 = uvA.getY(i1);
      const u2 = uvA.getX(i2), w2 = uvA.getY(i2);
      const u = u0 * wc + u1 * wa + u2 * wb;
      const w = w0 * wc + w1 * wa + w2 * wb;

      // Tangente/bitangente del triángulo (v invertida: las normal maps son OpenGL, Y arriba)
      e1.copy(v1).sub(v0);
      e2.copy(v2).sub(v0);
      const du1 = u1 - u0, dv1 = -(w1 - w0);
      const du2 = u2 - u0, dv2 = -(w2 - w0);
      const det = du1 * dv2 - du2 * dv1;
      if (Math.abs(det) > 1e-12) {
        const f = 1 / det;
        T.copy(e1).multiplyScalar(dv2 * f).addScaledVector(e2, -dv1 * f);
        B.copy(e2).multiplyScalar(du1 * f).addScaledVector(e1, -du2 * f);
        T.addScaledVector(n, -n.dot(T)).normalize();
        const bt = new THREE.Vector3().crossVectors(n, T);
        if (bt.dot(B) < 0) bt.negate();

        const mx = Math.min(mw - 1, Math.max(0, Math.floor((((u % 1) + 1) % 1) * mw)));
        const my = Math.min(mh - 1, Math.max(0, Math.floor((((w % 1) + 1) % 1) * mh)));
        const o = (my * mw + mx) * 4;
        const tx = (map[o] / 255) * 2 - 1;
        const ty = (map[o + 1] / 255) * 2 - 1;
        const tz = (map[o + 2] / 255) * 2 - 1;
        n.multiplyScalar(tz).addScaledVector(T, tx).addScaledVector(bt, ty).normalize();
      }

      nrm[i * 3] = n.x;
      nrm[i * 3 + 1] = n.y;
      nrm[i * 3 + 2] = n.z;
      // Grosor mínimo: la superficie es sólida, no un volumen de gas
      pos[i * 3] = px + (Math.random() - 0.5) * 0.012;
      pos[i * 3 + 1] = py + (Math.random() - 0.5) * 0.012;
      pos[i * 3 + 2] = pz + (Math.random() - 0.5) * 0.012;

      rnd[i * 3] = (Math.random() - 0.5) * 0.6;
      rnd[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      rnd[i * 3 + 2] = Math.random() * 0.8;
      sz[i] = Math.random();
    }
  }
  return { positions: pos, randoms: rnd, sizes: sz, normals: nrm, headGeometry: geom };
}

export const MedicalPointCloud: React.FC<Props> = ({ pointCount = 320000 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const modelUrl = `${import.meta.env.BASE_URL || '/'}models/LeePerrySmith.glb`.replace(/\/+/g, '/');
  const normalMapUrl = `${import.meta.env.BASE_URL || '/'}models/LeePerrySmith_normal.jpg`.replace(/\/+/g, '/');
  const obj = useLoader(GLTFLoader, modelUrl);
  const normalTex = useLoader(THREE.TextureLoader, normalMapUrl);

  const { positions, randoms, sizes, normals, headGeometry } = useMemo(
    () => buildHeadPointCloud(obj.scene, normalTex, pointCount),
    [obj, normalTex, pointCount],
  );

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uMouth: { value: MOUTH_CENTER.clone() } }),
    [],
  );

  useFrame((state) => {
    const group = groupRef.current;
    const points = pointsRef.current;
    if (!group || !points) return;
    (points.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
    group.rotation.y = 0.3 + state.pointer.x * 0.12;
    group.rotation.x = -0.32 - state.pointer.y * 0.08;
  });

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* Oclusor invisible: escribe profundidad pero no color, así las partículas
          de la nuca y del interior de la cabeza quedan tapadas por la cara. */}
      {headGeometry && (
        <mesh geometry={headGeometry} renderOrder={0}>
          <meshBasicMaterial colorWrite={false} polygonOffset polygonOffsetFactor={3} polygonOffsetUnits={3} />
        </mesh>
      )}
      <points ref={pointsRef} renderOrder={1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aRandom" args={[randoms, 3]} />
          <bufferAttribute attach="attributes-aNormal" args={[normals, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthTest
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};
