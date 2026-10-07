import { describe, expect, it } from 'vitest';
import { sanitizarBusqueda } from './busqueda';

describe('sanitizarBusqueda', () => {
  it('quita la sintaxis del filtro PostgREST', () => {
    expect(sanitizarBusqueda('ana),activo.eq.false,(x')).toBe('ana activo.eq.false x');
    expect(sanitizarBusqueda('100%_ok')).toBe('100 ok');
  });
  it('conserva nombres con acentos y números de cédula o teléfono', () => {
    expect(sanitizarBusqueda('  María  José ')).toBe('María José');
    expect(sanitizarBusqueda('V-12.345.678')).toBe('V-12.345.678');
  });
  it('limita el largo', () => {
    expect(sanitizarBusqueda('a'.repeat(200))).toHaveLength(60);
  });
});
