---
name: ui-motion-scrollytelling
description: >-
  Aplica estándares de alta gama para UI/UX, micro-interacciones de resorte estilo Emil Kowalski,
  animaciones de scroll complejas con GSAP ScrollTrigger, Lenis y escenas 3D con React Three Fiber.
---

# Antigravity UI/Motion Skill: "Impeccable Taste & Scrollytelling"

## Core Stack
- React + Vite (SPA), TypeScript, Tailwind CSS.
- Animaciones complejas de Scroll: GSAP (ScrollTrigger, SplitText, DrawSVG).
- Micro-interacciones y UI fluida: Framer Motion.
- Scroll Suave: @studio-freight/lenis (Requerido para todo proyecto de scrollytelling).
- 3D: React Three Fiber (@react-three/fiber, @react-three/drei).

## Reglas de Implementación de Efectos

### 1. Físicas, Micro-interacciones y UI (Emil Kowalski Style)
- **Físicas de Resorte:** NUNCA usar transiciones CSS `ease-in-out` estándar para UI. Usar Framer Motion con físicas de resorte. Valores por defecto: `type: "spring", stiffness: 400, damping: 30, mass: 1`.
- **Magnetic Button:** Utilizar Framer Motion (`useMotionValue`, `useSpring`) atados a `onMouseMove` para calcular la distancia del cursor al centro del bounding box del elemento, creando un efecto magnético sutil.
- **Clip Path Transitions:** Animar la propiedad `clip-path` (ej. de `circle(0% at 50% 50%)` a `circle(100% at 50% 50%)`) usando Framer Motion para transiciones de layout fluidas.

### 2. Scrollytelling y Manipulación de DOM (GSAP ScrollTrigger)
- **Scroll-scrub con pin:** Usar `ScrollTrigger` con `pin: true`, `scrub: 1` para suavidad. Envolver el contenido en un contenedor con `overflow-x: hidden`.
- **Scroll horizontal fijado:** Fijar un contenedor padre verticalmente y mover un contenedor hijo en el eje X (`x: "-100%"`) equivalente a la altura del scroll.
- **Parallax:** Utilizar transformaciones Y basadas en el progreso del scroll con `useScroll` y `useTransform` de Framer Motion para evitar saturar el hilo principal.
- **Sticky media swap:** Usar un contenedor `position: sticky; top: 0; h-screen`. Cambiar la opacidad o el `src` del elemento multimedia interpolando el progreso del scroll actual.
- **Skew por velocidad:** Usar `ScrollTrigger.normalizeScroll()` y atar el valor `skewY` al delta de velocidad (`ScrollTrigger.getVelocity()`).
- **Image sequence (Scrubbing):** Pre-cargar la secuencia de imágenes en un `<canvas>`. Usar GSAP para animar un objeto desde `{ frame: 0 }` hasta el total de frames.
- **Marquee (Texto infinito):** Para alto rendimiento, usar el helper de GSAP `horizontalLoop` o animaciones CSS con `transform: translateX`.

### 3. Revelado de Datos y SVG
- **Scroll trigger reveal:** Configurar elementos con opacidad 0 y desplazamiento Y inicial. Revelar con `stagger` usando `ScrollTrigger`.
- **Line mask reveal / Split text:** Usar `SplitText` de GSAP. Animar los caracteres/palabras de `y: "100%"` a `y: "0%"` dentro de contenedores con `overflow: hidden`.
- **Count up / Number ticker:** Usar `useMotionValue` y `useSpring` de Framer Motion, pasando el valor directo a un componente animado.
- **Line draw / Stroke draw:** Utilizar atributos SVG `stroke-dasharray` y `stroke-dashoffset`. Interpolar el offset del 100% al 0% con GSAP DrawSVG o Framer Motion.
- **Grayscale to color / Fill wrap:** Superponer una imagen/elemento a color sobre su versión en grises (position absolute). Animar el `clip-path: inset(0 100% 0 0)` a `inset(0 0% 0 0)`.

### 4. Entornos 3D (React Three Fiber)
- Integrar armónicamente con implementaciones existentes (como el mapa facial 3D actual).
- **Vista explosionada:** Animar la propiedad `position` de múltiples `<mesh>` desde el centro geométrico hacia coordenadas predefinidas usando `useFrame` y `MathUtils.lerp`.
- **Wireframe 3D generativo:** Asignar `<meshStandardMaterial wireframe={true} />` a geometrías complejas, animando su rotación global en el canvas.
- **Zoom through:** Atar la posición `z` de la cámara (`state.camera.position.z`) al progreso del scroll.

## Estándares Obligatorios
- Aislar toda la lógica GSAP dentro del hook `@gsap/react` (`useGSAP()`) para asegurar el cleanup automático y prevenir memory leaks.
- Mantener estricta compatibilidad con Vite (no usar directivas de servidor de Next.js).
