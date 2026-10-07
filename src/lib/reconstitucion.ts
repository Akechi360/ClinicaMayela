/** Matemática de reconstitución de péptidos. Las jeringas de insulina U-100, U-50 y U-30 tienen 100 UI por mL
 *  (solo cambia su capacidad: 1, 0.5 y 0.3 mL), así que mcg/UI no depende de la jeringa. */
export type Jeringa = 'U-100' | 'U-50' | 'U-30';
export const CAPACIDAD_UI: Record<Jeringa, number> = { 'U-100': 100, 'U-50': 50, 'U-30': 30 };
export const CAPACIDAD_ML: Record<Jeringa, number> = { 'U-100': 1, 'U-50': 0.5, 'U-30': 0.3 };

export const FRECUENCIAS = [
  { id: 'diaria', label: 'Diaria', porDia: 1 },
  { id: 'dos_veces_dia', label: '2 veces al día', porDia: 2 },
  { id: 'cada_2_dias', label: 'Día por medio', porDia: 1 / 2 },
  { id: 'tres_veces_semana', label: '3 veces por semana', porDia: 3 / 7 },
  { id: 'dos_veces_semana', label: '2 veces por semana', porDia: 2 / 7 },
  { id: 'semanal', label: 'Semanal', porDia: 1 / 7 },
  { id: 'quincenal', label: 'Cada 2 semanas', porDia: 1 / 14 },
] as const;
export type FrecuenciaId = (typeof FRECUENCIAS)[number]['id'];

export interface EntradaCalc {
  vialMg: number;
  aguaMl: number;
  dosis: number;
  unidadDosis: 'mcg' | 'mg';
  jeringa: Jeringa;
  frecuencia: FrecuenciaId;
}

export interface ResultadoCalc {
  dosisMcg: number;
  concMcgMl: number;
  mcgPorUi: number;
  ui: number;
  ml: number;
  dosisTotales: number;
  duracionDias: number;
  excedeJeringa: boolean;
  /** Jeringa más pequeña que alcanza para la dosis en una sola aplicación (null si ninguna) */
  jeringaSugerida: Jeringa | null;
  /** Aplicaciones necesarias si la dosis no cabe en la jeringa elegida */
  inyecciones: number;
  /** Menos de 2 UI es difícil de medir con precisión */
  pocaPrecision: boolean;
}

export function calcular(e: EntradaCalc): ResultadoCalc | null {
  const dosisMcg = e.unidadDosis === 'mg' ? e.dosis * 1000 : e.dosis;
  if (!(e.vialMg > 0) || !(e.aguaMl > 0) || !(dosisMcg > 0)) return null;
  const concMcgMl = (e.vialMg * 1000) / e.aguaMl;
  const mcgPorUi = concMcgMl / 100;
  const ui = dosisMcg / mcgPorUi;
  const dosisTotales = Math.floor((e.vialMg * 1000) / dosisMcg + 1e-9);
  const porDia = FRECUENCIAS.find((f) => f.id === e.frecuencia)?.porDia ?? 1;
  const cap = CAPACIDAD_UI[e.jeringa];
  return {
    dosisMcg,
    concMcgMl,
    mcgPorUi,
    ui,
    ml: ui / 100,
    dosisTotales,
    duracionDias: Math.floor(dosisTotales / porDia + 1e-9),
    excedeJeringa: ui > cap + 1e-9,
    jeringaSugerida: (['U-30', 'U-50', 'U-100'] as const).find((j) => ui <= CAPACIDAD_UI[j] + 1e-9) ?? null,
    inyecciones: Math.max(1, Math.ceil(ui / cap - 1e-9)),
    pocaPrecision: ui < 2,
  };
}

export const formatoNumero = (n: number, dec = 1) => (Math.round(n * 10 ** dec) / 10 ** dec).toLocaleString('es-VE', { maximumFractionDigits: dec });
