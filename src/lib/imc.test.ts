import { describe, expect, it } from 'vitest';
import { calcularImc, categoriaImc, progresoHaciaMeta } from './imc';

describe('imc', () => {
  it('calcula el IMC con un decimal', () => {
    expect(calcularImc(70, 170)).toBe(24.2);
    expect(calcularImc(null, 170)).toBeNull();
  });
  it('clasifica según la OMS', () => {
    expect(categoriaImc(17)?.label).toBe('Bajo peso');
    expect(categoriaImc(24.9)?.label).toBe('Normal');
    expect(categoriaImc(27)?.label).toBe('Sobrepeso');
    expect(categoriaImc(31)?.label).toBe('Obesidad grado I');
    expect(categoriaImc(36)?.label).toBe('Obesidad grado II');
    expect(categoriaImc(41)?.label).toBe('Obesidad grado III');
  });
  it('progreso hacia la meta al bajar o subir de peso', () => {
    expect(progresoHaciaMeta(90, 80, 70)).toBe(50);
    expect(progresoHaciaMeta(50, 55, 60)).toBe(50);
    expect(progresoHaciaMeta(90, 95, 70)).toBe(0);
    expect(progresoHaciaMeta(90, 60, 70)).toBe(100);
  });
});
