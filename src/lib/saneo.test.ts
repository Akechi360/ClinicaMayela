import { describe, expect, it } from 'vitest';
import { fechasVaciasANull } from './saneo';

describe('fechasVaciasANull', () => {
  it('convierte la fecha vacía en null y respeta lo demás', () => {
    const r = fechasVaciasANull({ nombre: 'Ana', fecha_nacimiento: '', notas: '' }, ['fecha_nacimiento']);
    expect(r).toEqual({ nombre: 'Ana', fecha_nacimiento: null, notas: '' });
  });
  it('no toca una fecha válida ni una clave ausente', () => {
    expect(fechasVaciasANull({ fecha_nacimiento: '1990-05-01' }, ['fecha_nacimiento'])).toEqual({ fecha_nacimiento: '1990-05-01' });
    expect(fechasVaciasANull({ nombre: 'x' } as { nombre: string; fecha_nacimiento?: string }, ['fecha_nacimiento'])).toEqual({ nombre: 'x' });
  });
});
