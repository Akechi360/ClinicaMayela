import { describe, expect, it } from 'vitest';
import { PERFIL_FEMENINO, PERFIL_MASCULINO, perfilDeGenero } from './laboratorios';

describe('laboratorios por sexo', () => {
  it('hombres: 13 estudios; mujeres: los mismos más el panel de estrógeno/progesterona/prolactina', () => {
    expect(PERFIL_MASCULINO).toHaveLength(13);
    expect(PERFIL_FEMENINO).toHaveLength(14);
    expect(PERFIL_FEMENINO).toContain('Estrógeno, progesterona y prolactina');
    expect(PERFIL_MASCULINO).not.toContain('Estrógeno, progesterona y prolactina');
    expect(PERFIL_MASCULINO.every((e) => PERFIL_FEMENINO.includes(e))).toBe(true);
  });
  it('deduce el perfil del género registrado', () => {
    expect(perfilDeGenero('Femenino')).toBe('Femenino');
    expect(perfilDeGenero('masculino')).toBe('Masculino');
    expect(perfilDeGenero('Mujer')).toBe('Femenino');
    expect(perfilDeGenero('')).toBeNull();
    expect(perfilDeGenero(undefined)).toBeNull();
  });
});
