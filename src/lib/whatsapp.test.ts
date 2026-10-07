import { describe, expect, it } from 'vitest';
import { enlaceWa, telefonoWa } from './whatsapp';

describe('telefonoWa', () => {
  it('normaliza formatos venezolanos', () => {
    expect(telefonoWa('0414-433.4584')).toBe('584144334584');
    expect(telefonoWa('+58 414 4334584')).toBe('584144334584');
    expect(telefonoWa('4144334584')).toBe('584144334584');
    expect(telefonoWa('')).toBe('');
  });
  it('arma el enlace o devuelve null sin teléfono', () => {
    expect(enlaceWa('0414 1112233', 'Hola ñ')).toBe('https://wa.me/584141112233?text=Hola%20%C3%B1');
    expect(enlaceWa(null, 'x')).toBeNull();
  });
});
