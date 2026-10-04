import { useState } from 'react';

export interface PeptideCalculatorInput {
  vialMg: number;
  dilucionMl: number;
  dosisMcg: number;
}

/** Matemática de reconstitución de péptidos: mg de vial + ml de dilución → UI en jeringa de insulina U-100. */
export function usePeptideCalculator(initial: PeptideCalculatorInput) {
  const [vialMg, setVialMg] = useState(initial.vialMg);
  const [dilucionMl, setDilucionMl] = useState(initial.dilucionMl);
  const [dosisMcg, setDosisMcg] = useState(initial.dosisMcg);

  const concMcgMl = (vialMg * 1000) / (dilucionMl || 1);
  const mcgPorUi = concMcgMl / 100;
  const unidadesJeringa = mcgPorUi > 0 ? dosisMcg / mcgPorUi : 0;
  const dosisTotales = (vialMg * 1000) / (dosisMcg || 1);

  return {
    vialMg, setVialMg,
    dilucionMl, setDilucionMl,
    dosisMcg, setDosisMcg,
    concMcgMl, mcgPorUi, unidadesJeringa, dosisTotales,
  };
}
