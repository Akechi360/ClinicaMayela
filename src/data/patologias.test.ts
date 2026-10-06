import { describe, expect, it } from 'vitest';
import { alertasPara, esAlertaMayor } from './patologias';

describe('alertasPara', () => {
  it('péptidos: oncológicas dan alerta roja', () => {
    const a = alertasPara(['neoplasia_activa'], 'peptidos');
    expect(a).toHaveLength(1);
    expect(a[0].nivel).toBe('roja');
  });
  it('inyectables: anticoagulantes dan precaución y no alerta roja', () => {
    const a = alertasPara(['anticoagulantes'], 'inyectable');
    expect(a.map((x) => x.nivel)).toEqual(['precaucion']);
  });
  it('ordena primero las rojas', () => {
    const a = alertasPara(['queloides', 'embarazo_lactancia'], 'inyectable');
    expect(a[0].nivel).toBe('roja');
  });
  it('sin patologías no hay alertas', () => {
    expect(alertasPara([], 'peptidos')).toEqual([]);
    expect(alertasPara(null, 'inyectable')).toEqual([]);
  });
  it('marca como mayor lo oncológico y el embarazo', () => {
    expect(esAlertaMayor('tumor_hipofisario')).toBe(true);
    expect(esAlertaMayor('hipertension')).toBe(false);
  });
});
