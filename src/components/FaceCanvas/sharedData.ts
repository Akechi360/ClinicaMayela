export const ZONE_NAMES = ['Frontal', 'Glabela', 'Periorb.', 'Zigomático', 'Peribucal', 'Mentón'];

export const ZONE_COLORS = [
  'bg-sky-400',
  'bg-emerald-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-orange-600',
  'bg-violet-400'
];

export const getMarkerColorHex = (prod: string) => {
  const p = prod.toLowerCase();
  if (p.includes('botox') || p.includes('toxina') || p.includes('xeomin')) {
    return '#3A434D'; // Slate dark
  }
  if (p.includes('hialur') || p.includes('juvederm') || p.includes('restylane')) {
    return '#A66E53'; // Satin copper
  }
  return '#7A8068'; // Muted olive
};

// Vértices y zonas auxiliares para fallback de compatibilidad antes de la carga del OBJ
export const verticesArrayForFallback = [
  -0.7, 0.8, 0.0,   -0.35, 0.85, 0.1,  0.0, 0.88, 0.12,  0.35, 0.85, 0.1,  0.7, 0.8, 0.0,
  -0.65, 0.55, 0.1,  -0.3, 0.6, 0.18,  0.0, 0.63, 0.2,   0.3, 0.6, 0.18,  0.65, 0.55, 0.1,
  -0.58, 0.3, 0.15,  -0.2, 0.33, 0.25, 0.0, 0.35, 0.3,   0.2, 0.33, 0.25, 0.58, 0.3, 0.15,
  -0.6, 0.05, 0.1,   -0.18, 0.05, 0.22, 0.0, 0.08, 0.38,  0.18, 0.05, 0.22, 0.6, 0.05, 0.1,
  -0.68, -0.25, 0.0,  -0.3, -0.2, 0.25, 0.0, -0.15, 0.48,  0.3, -0.2, 0.25, 0.68, -0.25, 0.0,
  -0.45, -0.5, 0.08,  -0.18, -0.52, 0.26, 0.0, -0.5, 0.32,  0.18, -0.52, 0.26, 0.45, -0.5, 0.08,
  -0.35, -0.74, 0.05, -0.15, -0.76, 0.22, 0.0, -0.78, 0.26,  0.15, -0.76, 0.22, 0.35, -0.74, 0.05,
  0.0, -0.92, 0.15
];

export const vZoneForFallback = [
  0, 0, 0, 0, 0,
  0, 0, 0, 0, 0,
  2, 1, 1, 1, 2,
  2, 2, 3, 2, 2,
  3, 3, 3, 3, 3,
  4, 4, 4, 4, 4,
  5, 5, 5, 5, 5,
  5
];
