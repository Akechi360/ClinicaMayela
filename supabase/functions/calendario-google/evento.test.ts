import { describe, expect, it } from 'vitest';
import { accionPara, construirEvento, duracionMinutos, iguales, leerCuentaServicio } from './evento';

const base = {
  id: 'c1',
  fecha_hora: '2026-10-16T14:00:00.000Z',
  estado: 'confirmado',
  paciente: { nombre: 'Ana', apellido: 'Pérez', telefono: '0414-1234567' },
  tratamiento: { nombre: 'Toxina botulínica', duracion_minutos: 45 },
};

describe('construirEvento', () => {
  it('arma título, horario y color', () => {
    const e = construirEvento(base);
    expect(e.summary).toBe('Toxina botulínica · Ana Pérez');
    expect(e.start.dateTime).toBe('2026-10-16T14:00:00.000Z');
    expect(e.end.dateTime).toBe('2026-10-16T14:45:00.000Z');
    expect(e.start.timeZone).toBe('America/Caracas');
    expect(e.colorId).toBe('10');
    expect(e.extendedProperties.private.citaId).toBe('c1');
    expect(e.description).toContain('Teléfono: 0414-1234567');
  });
  it('usa valores por defecto sin paciente ni tratamiento', () => {
    const e = construirEvento({ id: 'c2', fecha_hora: '2026-10-16T14:00:00Z' });
    expect(e.summary).toBe('Cita · Paciente');
    expect(e.end.dateTime).toBe('2026-10-16T14:30:00.000Z');
    expect(e.colorId).toBeUndefined();
  });
  it('rechaza fechas inválidas', () => {
    expect(() => construirEvento({ id: 'x', fecha_hora: 'no-es-fecha' })).toThrow();
  });
});

describe('duracionMinutos', () => {
  it('prioriza la cita, luego el tratamiento, y acota', () => {
    expect(duracionMinutos({ ...base, duracion_minutos: 20 })).toBe(20);
    expect(duracionMinutos(base)).toBe(45);
    expect(duracionMinutos({ id: 'x', fecha_hora: 'x', duracion_minutos: 99999 })).toBe(480);
    expect(duracionMinutos({ id: 'x', fecha_hora: 'x', duracion_minutos: 1 })).toBe(5);
  });
});

describe('accionPara', () => {
  it('decide crear, actualizar, eliminar o nada', () => {
    expect(accionPara('pendiente', null)).toBe('crear');
    expect(accionPara('confirmado', 'ev1')).toBe('actualizar');
    expect(accionPara('cancelado', 'ev1')).toBe('eliminar');
    expect(accionPara('cancelado', null)).toBe('nada');
  });
});

describe('seguridad', () => {
  it('compara tokens en tiempo constante', () => {
    expect(iguales('abc', 'abc')).toBe(true);
    expect(iguales('abc', 'abd')).toBe(false);
    expect(iguales('abc', 'abcd')).toBe(false);
  });
  it('valida el JSON de la cuenta de servicio', () => {
    expect(leerCuentaServicio(undefined)).toBeNull();
    expect(leerCuentaServicio('no json')).toBeNull();
    expect(leerCuentaServicio('{"client_email":"a@b.iam.gserviceaccount.com","private_key":"x"}')).toBeNull();
    const valida = JSON.stringify({ client_email: 'a@b.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----' + String.fromCharCode(10) + 'abc' });
    expect(leerCuentaServicio(valida)?.client_email).toBe('a@b.iam.gserviceaccount.com');
  });
});
