import { describe, expect, it } from 'vitest';
import { calcular, type EntradaCalc } from './reconstitucion';

const base: EntradaCalc = { vialMg: 5, aguaMl: 2, dosis: 250, unidadDosis: 'mcg', jeringa: 'U-100', frecuencia: 'diaria' };

describe('calcular reconstitución', () => {
  it('vial de 5 mg en 2 mL con dosis de 250 mcg = 10 UI', () => {
    const r = calcular(base)!;
    expect(r.concMcgMl).toBe(2500);
    expect(r.mcgPorUi).toBe(25);
    expect(r.ui).toBe(10);
    expect(r.ml).toBe(0.1);
    expect(r.dosisTotales).toBe(20);
    expect(r.duracionDias).toBe(20);
  });
  it('acepta la dosis en mg y calcula la duración según la frecuencia', () => {
    const r = calcular({ ...base, vialMg: 10, dosis: 2.5, unidadDosis: 'mg', frecuencia: 'semanal' })!;
    expect(r.dosisMcg).toBe(2500);
    expect(r.dosisTotales).toBe(4);
    expect(r.duracionDias).toBe(28);
  });
  it('avisa cuando la dosis no cabe en la jeringa y sugiere otra', () => {
    const r = calcular({ ...base, aguaMl: 1, dosis: 250, jeringa: 'U-30', vialMg: 1 })!; // 1000 mcg/mL → 10 mcg/UI → 25 UI
    expect(r.ui).toBe(25);
    expect(r.excedeJeringa).toBe(false);
    const g = calcular({ ...base, vialMg: 1, aguaMl: 1, dosis: 500, jeringa: 'U-30' })!; // 50 UI
    expect(g.excedeJeringa).toBe(true);
    expect(g.jeringaSugerida).toBe('U-50');
    expect(g.inyecciones).toBe(2);
  });
  it('detecta dosis difíciles de medir y entradas inválidas', () => {
    expect(calcular({ ...base, dosis: 25 })!.pocaPrecision).toBe(true);
    expect(calcular({ ...base, aguaMl: 0 })).toBeNull();
    expect(calcular({ ...base, dosis: 0 })).toBeNull();
  });
});
