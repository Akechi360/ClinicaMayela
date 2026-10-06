import { describe, expect, it } from 'vitest';
import { estructurarDictado } from './dictado';

describe('estructurarDictado', () => {
  it('estructura medicamento, dosis, frecuencia y duración', () => {
    expect(estructurarDictado('amoxicilina 500 mg cada 8 horas por 7 días')).toBe('1. Amoxicilina — 500 mg — cada 8 horas — por 7 días');
  });
  it('separa varios medicamentos', () => {
    const out = estructurarDictado('ibuprofeno 400 mg dos veces al día luego loratadina 10 mg una vez al día por diez días');
    expect(out.split('\n')).toEqual(['1. Ibuprofeno — 400 mg — 2 veces al día', '2. Loratadina — 10 mg — una vez al día — por 10 días']);
  });
  it('deja el texto libre si no hay dosis', () => {
    expect(estructurarDictado('reposo relativo')).toBe('1. Reposo relativo');
  });
});
