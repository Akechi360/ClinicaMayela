import { PEPTIDES_CATALOG } from './peptidesData';
import type { FrecuenciaId } from '../lib/reconstitucion';

/** Valores de partida de la calculadora (siempre editables; la dosis final es criterio de la médica). */
export interface PresetCalc {
  id: string;
  nombre: string;
  viales: number[];
  vialMg: number;
  aguaMl: number;
  dosis: number;
  unidadDosis: 'mcg' | 'mg';
  frecuencia: FrecuenciaId;
  nota?: string;
}

/** Los péptidos del catálogo clínico reutilizan sus datos de reconstitución (una sola fuente de verdad). */
const DEL_CATALOGO: PresetCalc[] = PEPTIDES_CATALOG.filter((p) => p.reconstitution).map((p) => {
  const r = p.reconstitution!;
  const mg = p.doses.unit === 'mg';
  return {
    id: p.id,
    nombre: p.name,
    viales: r.vialMgOptions,
    vialMg: r.defaultVialMg,
    aguaMl: r.defaultDilutionMl,
    dosis: mg ? r.defaultDoseMcg / 1000 : r.defaultDoseMcg,
    unidadDosis: mg ? 'mg' : 'mcg',
    frecuencia: 'diaria',
  };
});

/** Terapias de uso frecuente que no están en el catálogo de protocolos (valores orientativos). */
const ADICIONALES: PresetCalc[] = [
  { id: 'semaglutida', nombre: 'Semaglutida', viales: [2, 5, 10], vialMg: 5, aguaMl: 2, dosis: 0.25, unidadDosis: 'mg', frecuencia: 'semanal', nota: 'Escalado habitual: 0.25 mg las primeras 4 semanas y luego 0.5 mg.' },
  { id: 'tirzepatida', nombre: 'Tirzepatida', viales: [5, 10, 15], vialMg: 10, aguaMl: 2, dosis: 2.5, unidadDosis: 'mg', frecuencia: 'semanal', nota: 'Valores orientativos; confirmar con la ficha del fabricante.' },
  { id: 'nad', nombre: 'NAD+', viales: [500], vialMg: 500, aguaMl: 5, dosis: 50, unidadDosis: 'mg', frecuencia: 'tres_veces_semana', nota: 'Valores orientativos; confirmar con la ficha del fabricante.' },
];

export const PRESETS_CALC: PresetCalc[] = [...DEL_CATALOGO, ...ADICIONALES];
export const PRESET_PERSONALIZADO: PresetCalc = { id: 'otro', nombre: 'Otro (personalizado)', viales: [], vialMg: 5, aguaMl: 2, dosis: 250, unidadDosis: 'mcg', frecuencia: 'diaria' };
