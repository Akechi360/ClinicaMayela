import { describe, expect, it } from 'vitest';
import { estadoInactividad } from './inactividad';

describe('estadoInactividad', () => {
  const LIM = 20 * 60_000;
  const AVISO = 60_000;
  it('activo mientras no se acerque al límite', () => {
    expect(estadoInactividad(0, 5 * 60_000, LIM, AVISO)).toBe('activo');
  });
  it('avisa durante el último minuto', () => {
    expect(estadoInactividad(0, LIM - AVISO, LIM, AVISO)).toBe('aviso');
    expect(estadoInactividad(0, LIM - 1, LIM, AVISO)).toBe('aviso');
  });
  it('expira al llegar al límite (incluso si el equipo estuvo suspendido)', () => {
    expect(estadoInactividad(0, LIM, LIM, AVISO)).toBe('expirado');
    expect(estadoInactividad(0, 3 * 60 * 60_000, LIM, AVISO)).toBe('expirado');
  });
});
