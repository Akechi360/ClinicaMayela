/** Utilidades de calendario: enlace de Google Calendar y archivos .ics (RFC 5545). */
export interface EventoCal {
  id: string;
  titulo: string;
  inicio: Date;
  duracionMin: number;
  detalle?: string;
  lugar?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** 20261007T150000Z */
export const fechaCal = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const fin = (e: EventoCal) => new Date(e.inicio.getTime() + e.duracionMin * 60_000);

/** Enlace "Añadir a Google Calendar" (sirve para la doctora y para el paciente). */
export function googleCalendarUrl(e: EventoCal): string {
  const p = new URLSearchParams({ action: 'TEMPLATE', text: e.titulo, dates: `${fechaCal(e.inicio)}/${fechaCal(fin(e))}` });
  if (e.detalle) p.set('details', e.detalle);
  if (e.lugar) p.set('location', e.lugar);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Pliega líneas largas a 75 octetos como exige el estándar. */
function plegar(linea: string): string {
  const enc = new TextEncoder();
  if (enc.encode(linea).length <= 75) return linea;
  const partes: string[] = [];
  let actual = '';
  let largo = 0;
  for (const ch of linea) {
    const l = enc.encode(ch).length;
    if (largo + l > (partes.length ? 74 : 75)) { partes.push(actual); actual = ''; largo = 0; }
    actual += ch;
    largo += l;
  }
  partes.push(actual);
  return partes.join('\r\n ');
}

export function icsCalendario(eventos: EventoCal[], nombre = 'Clínica Dra. Mayela González', ahora = new Date()): string {
  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Clinica Dra. Mayela Gonzalez//Agenda//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${escapar(nombre)}`];
  for (const e of eventos) {
    lineas.push('BEGIN:VEVENT', `UID:${e.id}@clinica-mayela`, `DTSTAMP:${fechaCal(ahora)}`, `DTSTART:${fechaCal(e.inicio)}`, `DTEND:${fechaCal(fin(e))}`, `SUMMARY:${escapar(e.titulo)}`);
    if (e.detalle) lineas.push(`DESCRIPTION:${escapar(e.detalle)}`);
    if (e.lugar) lineas.push(`LOCATION:${escapar(e.lugar)}`);
    lineas.push('END:VEVENT');
  }
  lineas.push('END:VCALENDAR');
  return lineas.map(plegar).join('\r\n') + '\r\n';
}

export function descargarIcs(e: EventoCal, nombreArchivo = 'cita.ics') {
  const blob = new Blob([icsCalendario([e])], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
