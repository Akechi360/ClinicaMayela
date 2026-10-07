// Edge Function "calendario": publica la agenda como calendario iCal (.ics) para suscribirse desde Google Calendar,
// Apple Calendar u Outlook ("Agregar calendario → Desde URL"). Acceso por token secreto (clinic_settings.calendar_token).
// Despliegue: sin verificación de JWT (Google no puede enviarlo); la seguridad es el token de 192 bits, que se puede rotar.
import { createClient } from 'npm:@supabase/supabase-js@2';

const pad = (n: number) => String(n).padStart(2, '0');
const fechaCal = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const escapar = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

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

/** Comparación en tiempo constante para no filtrar el token por diferencias de tiempo. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: ajustes } = await sb.from('clinic_settings').select('calendar_token').limit(1).maybeSingle();
  const guardado = ajustes?.calendar_token as string | null | undefined;
  if (!token || !guardado || !iguales(token, guardado)) return new Response('No autorizado', { status: 401 });

  const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data: citas, error } = await sb
    .from('citas')
    .select('id, fecha_hora, estado, notas, duracion_minutos, paciente:pacientes(nombre, apellido), tratamiento:tratamientos(nombre, duracion_minutos)')
    .gte('fecha_hora', desde)
    .neq('estado', 'cancelado')
    .order('fecha_hora', { ascending: true })
    .limit(1000);
  if (error) return new Response('Error al leer la agenda', { status: 500 });

  const ahora = new Date();
  const L = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Clinica Dra. Mayela Gonzalez//Agenda//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Agenda · Clínica Dra. Mayela González', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H',
  ];
  for (const c of citas ?? []) {
    // deno-lint-ignore no-explicit-any
    const p = (Array.isArray(c.paciente) ? c.paciente[0] : c.paciente) as any;
    // deno-lint-ignore no-explicit-any
    const t = (Array.isArray(c.tratamiento) ? c.tratamiento[0] : c.tratamiento) as any;
    const inicio = new Date(c.fecha_hora);
    const dur = t?.duracion_minutos ?? c.duracion_minutos ?? 30;
    const nombre = [p?.nombre, p?.apellido].filter(Boolean).join(' ') || 'Paciente';
    L.push(
      'BEGIN:VEVENT', `UID:${c.id}@clinica-mayela`, `DTSTAMP:${fechaCal(ahora)}`, `DTSTART:${fechaCal(inicio)}`,
      `DTEND:${fechaCal(new Date(inicio.getTime() + dur * 60_000))}`, `SUMMARY:${escapar(`${nombre} · ${t?.nombre ?? 'Cita'}`)}`,
      `DESCRIPTION:${escapar([c.notas ? `Notas: ${c.notas}` : '', `Estado: ${c.estado}`].filter(Boolean).join('\n'))}`,
      'LOCATION:Clínica Dra. Mayela González\\, Las Mercedes\\, Caracas', 'END:VEVENT',
    );
  }
  L.push('END:VCALENDAR');

  return new Response(L.map(plegar).join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=300' },
  });
});
