import { describe, expect, it } from 'vitest';
import { fechaCal, googleCalendarUrl, icsCalendario } from './calendario';

const ev = { id: 'abc', titulo: 'Ana, Botox; control', inicio: new Date('2026-10-07T15:00:00Z'), duracionMin: 45, detalle: 'Línea 1\nLínea 2', lugar: 'Caracas' };

describe('calendario', () => {
  it('formatea fechas UTC', () => {
    expect(fechaCal(new Date('2026-10-07T15:05:09Z'))).toBe('20261007T150509Z');
  });
  it('arma el enlace de Google Calendar con inicio y fin', () => {
    const u = new URL(googleCalendarUrl(ev));
    expect(u.searchParams.get('action')).toBe('TEMPLATE');
    expect(u.searchParams.get('dates')).toBe('20261007T150000Z/20261007T154500Z');
    expect(u.searchParams.get('text')).toBe('Ana, Botox; control');
  });
  it('genera un .ics válido y escapa caracteres especiales', () => {
    const ics = icsCalendario([ev], 'Clínica', new Date('2026-10-01T00:00:00Z'));
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:abc@clinica-mayela');
    expect(ics).toContain('DTSTART:20261007T150000Z');
    expect(ics).toContain('DTEND:20261007T154500Z');
    expect(ics).toContain('SUMMARY:Ana\\, Botox\\; control');
    expect(ics).toContain('DESCRIPTION:Línea 1\\nLínea 2');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
  it('pliega las líneas largas', () => {
    const largo = icsCalendario([{ ...ev, detalle: 'x'.repeat(200) }]);
    expect(largo.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
    expect(largo.replace(/\r\n /g, '')).toContain('DESCRIPTION:' + 'x'.repeat(200));
  });
});
