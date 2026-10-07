import { describe, expect, it } from 'vitest';
import { caracasAUtc, planCuidados, planDosis, sumarDias } from './seguimientos';
import { categoriaPorTratamiento } from '../data/cuidadosPostTratamiento';

describe('fechas de seguimiento', () => {
  it('convierte hora de Caracas a UTC y suma días', () => {
    expect(caracasAUtc('2026-10-07', '09:00')).toBe('2026-10-07T13:00:00.000Z');
    expect(sumarDias('2026-10-28', 5)).toBe('2026-11-02');
  });
});

describe('categoriaPorTratamiento', () => {
  it('deduce la categoría desde el nombre', () => {
    expect(categoriaPorTratamiento('Botox frente')).toBe('toxina');
    expect(categoriaPorTratamiento('Relleno de labios con ácido hialurónico')).toBe('hialuronico');
    expect(categoriaPorTratamiento('Sculptra')).toBe('bioestimulador');
    expect(categoriaPorTratamiento('Protocolo BPC-157')).toBe('peptidos');
    expect(categoriaPorTratamiento('Algo desconocido')).toBe('general');
  });
});

describe('planCuidados', () => {
  const ahora = new Date('2026-10-07T15:00:00Z');
  const base = { pacienteId: 'p1', nombre: 'Ana López', categoria: 'toxina' as const, ahora, r24: true, r72: true, controlDias: 15, incluirCuidadosAhora: true };
  it('programa cuidados, 24 h, 72 h y el control a las 10:00 de Caracas', () => {
    const r = planCuidados(base);
    expect(r.map((x) => x.tipo)).toEqual(['cuidados_post', 'recordatorio_24h', 'recordatorio_72h', 'control_estetico']);
    expect(r[1].fecha_programada).toBe('2026-10-08T15:00:00.000Z');
    expect(r[2].fecha_programada).toBe('2026-10-10T15:00:00.000Z');
    expect(r[3].fecha_programada).toBe('2026-10-22T14:00:00.000Z');
    expect(r[0].mensaje).toContain('Hola Ana');
  });
  it('omite lo que no se pidió', () => {
    expect(planCuidados({ ...base, incluirCuidadosAhora: false, r72: false, controlDias: null }).map((x) => x.tipo)).toEqual(['recordatorio_24h']);
  });
});

describe('planDosis', () => {
  const o = { pacienteId: 'p1', protocoloId: 'pr1', nombre: 'Ana', peptido: 'Semaglutida', dosis: '0.25 mg', inicio: '2026-10-05', semanas: 6, frecuencia: 'semanal' as const, hora: '08:00', escalado: [{ semana: 5, dosis: '0.5 mg' }] };
  it('semanal: una aplicación por semana con la dosis de cada tramo y un aviso de escalado', () => {
    const r = planDosis(o);
    const dosis = r.filter((x) => x.tipo === 'dosis_peptido');
    expect(dosis).toHaveLength(6);
    expect(dosis[0].mensaje).toContain('0.25 mg');
    expect(dosis[4].mensaje).toContain('0.5 mg');
    const esc = r.filter((x) => x.tipo === 'escalado_dosis');
    expect(esc).toHaveLength(1);
    expect(esc[0].fecha_programada).toBe('2026-11-02T12:00:00.000Z');
  });
  it('diaria genera una por día y semanas inválidas no generan nada', () => {
    expect(planDosis({ ...o, frecuencia: 'diaria', semanas: 2, escalado: [] })).toHaveLength(14);
    expect(planDosis({ ...o, semanas: 0 })).toEqual([]);
  });
});
