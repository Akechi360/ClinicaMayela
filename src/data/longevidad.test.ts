import { describe, expect, it } from 'vitest';
import { SECCIONES_LONGEVIDAD, hayDatosLongevidad, limpiarLongevidad, resumenLongevidad, textoValor } from './longevidad';

describe('historia de longevidad', () => {
  it('todos los campos tienen identificador único dentro de su sección y claves válidas para el servidor', () => {
    for (const s of SECCIONES_LONGEVIDAD) {
      expect(s.id).toMatch(/^[a-z0-9_]{1,40}$/);
      const ids = s.campos.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(id).toMatch(/^[a-z0-9_]{1,40}$/);
    }
  });

  it('las opciones tienen valores válidos para el servidor', () => {
    for (const s of SECCIONES_LONGEVIDAD)
      for (const c of s.campos)
        for (const o of c.opciones ?? []) expect(o.valor).toMatch(/^[a-z0-9_]{1,40}$/);
  });

  it('limpia vacíos y secciones sin respuestas', () => {
    const r = limpiarLongevidad({
      perfil: { ocupacion: '', estilo_vida: 'activo' },
      nutricion: { patron: '', digestivos: [] },
      desconocida: { x: 1 },
    });
    expect(r).toEqual({ perfil: { estilo_vida: 'activo' } });
    expect(hayDatosLongevidad({ nutricion: { patron: '' } })).toBe(false);
    expect(hayDatosLongevidad({ sueno_estres: { estres: 7 } })).toBe(true);
  });

  it('conserva el 0 y el false como respuestas válidas', () => {
    expect(limpiarLongevidad({ actividad: { fuerza_dias: 0 }, familiares: { longevidad_familiar: false } }))
      .toEqual({ actividad: { fuerza_dias: 0 }, familiares: { longevidad_familiar: false } });
  });

  it('arma un resumen legible', () => {
    const r = resumenLongevidad({ sueno_estres: { sueno_horas: 6.5, sueno_calidad: 'liviano', practicas: ['meditacion', 'frio'] } });
    expect(r).toHaveLength(1);
    expect(r[0].lineas.map((l) => l.valor)).toEqual(['6.5 horas', 'Liviano', 'Meditación, Exposición al frío']);
    const campo = SECCIONES_LONGEVIDAD[2].campos.find((c) => c.id === 'evacuaciones_regulares')!;
    expect(textoValor(campo, true)).toBe('Sí');
    const hiit = SECCIONES_LONGEVIDAD.find((x) => x.id === 'actividad')!.campos.find((c) => c.id === 'hiit_veces')!;
    expect(textoValor(hiit, 1)).toBe('1 vez por semana');
    expect(textoValor(hiit, 3)).toBe('3 veces por semana');
  });
});
