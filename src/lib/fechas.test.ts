import { describe, expect, it } from 'vitest';
import { fechaHoraCaracas } from './fechas';

describe('fechaHoraCaracas', () => {
  it('convierte UTC a hora de Caracas (UTC-4)', () => {
    expect(fechaHoraCaracas('2026-10-06T19:42:00Z')).toBe('6 de octubre de 2026, 15:42');
  });
  it('tolera vacíos y valores inválidos', () => {
    expect(fechaHoraCaracas(null)).toBe('');
    expect(fechaHoraCaracas('no es fecha')).toBe('');
  });
});
