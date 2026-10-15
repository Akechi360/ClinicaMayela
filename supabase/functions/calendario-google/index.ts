// Edge Function "calendario-google": mantiene el Google Calendar de la Dra. al día con las citas (app y bot).
//   · La base de datos la invoca con un disparador (pg_net) cada vez que una cita se crea, cambia o se cancela.
//   · La app la usa para "Probar conexión" y "Sincronizar citas pendientes".
// Credenciales: secreto GOOGLE_SERVICE_ACCOUNT_JSON (cuenta de servicio con permiso de edición sobre el calendario).
// Sin credenciales o sin calendario configurado no hace nada (responde ok:false, motivo:no_configurado).
// Despliegue sin verificación de JWT: la seguridad es el token x-sync-token (clinic_settings.google_sync_token).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { accionPara, construirEvento, iguales, leerCuentaServicio, type CitaParaEvento, type CuentaServicio } from './evento.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** Token de acceso de Google a partir de la cuenta de servicio (JWT RS256 firmado con Web Crypto). */
async function tokenGoogle(sa: CuentaServicio): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);
  const aud = sa.token_uri ?? 'https://oauth2.googleapis.com/token';
  const cab = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = b64url(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/calendar.events', aud, iat: ahora, exp: ahora + 3600,
  }));
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const llave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', llave, new TextEncoder().encode(`${cab}.${cuerpo}`));
  const r = await fetch(aud, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cab}.${cuerpo}.${b64url(firma)}` }),
  });
  const d = await r.json();
  if (!r.ok || !d.access_token) throw new Error(`Google rechazó las credenciales: ${d.error_description ?? d.error ?? r.status}`);
  return d.access_token as string;
}

const API = 'https://www.googleapis.com/calendar/v3/calendars';

function mensajeGoogle(status: number, cuerpo: string): string {
  if (status === 404) return 'Calendario no encontrado o no compartido con la cuenta de servicio.';
  if (status === 403) return 'La cuenta de servicio no tiene permiso para editar ese calendario.';
  if (status === 401) return 'Credenciales de Google inválidas.';
  return `Google respondió ${status}: ${cuerpo.slice(0, 120)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, motivo: 'metodo' }, 405);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: aj } = await sb.from('clinic_settings').select('google_sync_token, google_calendar_id').limit(1).maybeSingle();
  const guardado = (aj?.google_sync_token as string | null | undefined) ?? '';
  const recibido = req.headers.get('x-sync-token') ?? '';
  if (!guardado || !recibido || !iguales(recibido, guardado)) return json({ ok: false, motivo: 'no_autorizado' }, 401);

  const calendarId = ((aj?.google_calendar_id as string | null) ?? '').trim();
  const sa = leerCuentaServicio(Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON'));
  if (!calendarId || !sa) return json({ ok: false, motivo: 'no_configurado', calendario: !!calendarId, credenciales: !!sa });

  let body: { op?: string; cita_id?: string; event_id?: string };
  try { body = await req.json(); } catch { return json({ ok: false, motivo: 'json' }, 400); }

  let acceso: string;
  try { acceso = await tokenGoogle(sa); } catch (e) { return json({ ok: false, motivo: 'credenciales', mensaje: (e as Error).message }); }
  const H = { Authorization: `Bearer ${acceso}`, 'Content-Type': 'application/json' };
  const base = `${API}/${encodeURIComponent(calendarId)}/events`;

  /** Sincroniza una cita: crea, actualiza o elimina el evento y guarda el resultado en la cita. */
  async function sincronizar(citaId: string): Promise<{ ok: boolean; accion: string; mensaje?: string }> {
    const { data: cita, error } = await sb
      .from('citas')
      .select('id, fecha_hora, estado, notas, duracion_minutos, google_event_id, paciente:pacientes(nombre, apellido, telefono), tratamiento:tratamientos(nombre, duracion_minutos)')
      .eq('id', citaId)
      .maybeSingle();
    if (error || !cita) return { ok: false, accion: 'nada', mensaje: 'Cita no encontrada' };

    const registrar = async (eventId: string | null, err: string | null) => {
      await sb.from('citas').update({ google_event_id: eventId, google_sync_error: err }).eq('id', citaId);
    };

    const c = cita as unknown as CitaParaEvento & { google_event_id: string | null };
    const rel = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
    const norm: CitaParaEvento = { ...c, paciente: rel(c.paciente), tratamiento: rel(c.tratamiento) };
    const accion = accionPara(c.estado, c.google_event_id);
    if (accion === 'nada') { await registrar(null, null); return { ok: true, accion }; }

    if (accion === 'eliminar') {
      const r = await fetch(`${base}/${encodeURIComponent(c.google_event_id)}`, { method: 'DELETE', headers: H });
      if (r.ok || r.status === 404 || r.status === 410) { await registrar(null, null); return { ok: true, accion }; }
      const msg = mensajeGoogle(r.status, await r.text());
      await registrar(c.google_event_id, msg);
      return { ok: false, accion, mensaje: msg };
    }

    const evento = construirEvento(norm);
    let r: Response;
    if (accion === 'actualizar') {
      r = await fetch(`${base}/${encodeURIComponent(c.google_event_id)}`, { method: 'PUT', headers: H, body: JSON.stringify(evento) });
      // Si la persona borró el evento a mano en Google, se vuelve a crear
      if (r.status === 404 || r.status === 410) r = await fetch(base, { method: 'POST', headers: H, body: JSON.stringify(evento) });
    } else {
      r = await fetch(base, { method: 'POST', headers: H, body: JSON.stringify(evento) });
    }
    if (!r.ok) {
      const msg = mensajeGoogle(r.status, await r.text());
      await registrar(c.google_event_id ?? null, msg);
      return { ok: false, accion, mensaje: msg };
    }
    const creado = await r.json();
    await registrar(creado.id as string, null);
    return { ok: true, accion };
  }

  try {
    switch (body.op) {
      case 'ping': {
        const r = await fetch(`${base}?maxResults=1`, { headers: H });
        if (!r.ok) return json({ ok: false, motivo: 'google', mensaje: mensajeGoogle(r.status, await r.text()) });
        return json({ ok: true, calendario: calendarId });
      }
      case 'cita': {
        if (!body.cita_id) return json({ ok: false, motivo: 'falta_cita' }, 400);
        return json(await sincronizar(body.cita_id));
      }
      case 'borrar': {
        if (!body.event_id) return json({ ok: false, motivo: 'falta_evento' }, 400);
        const r = await fetch(`${base}/${encodeURIComponent(body.event_id)}`, { method: 'DELETE', headers: H });
        return json({ ok: r.ok || r.status === 404 || r.status === 410 });
      }
      case 'pendientes': {
        // Citas próximas sin evento (o con error previo): se sincronizan de a una, hasta 100
        const desde = new Date(Date.now() - 86_400_000).toISOString();
        const { data: citas } = await sb
          .from('citas')
          .select('id')
          .gte('fecha_hora', desde)
          .neq('estado', 'cancelado')
          .or('google_event_id.is.null,google_sync_error.not.is.null')
          .order('fecha_hora', { ascending: true })
          .limit(100);
        let ok = 0;
        let fallidas = 0;
        for (const x of citas ?? []) {
          const r = await sincronizar(x.id as string);
          if (r.ok) ok++; else fallidas++;
        }
        return json({ ok: true, sincronizadas: ok, fallidas });
      }
      default:
        return json({ ok: false, motivo: 'operacion_desconocida' }, 400);
    }
  } catch (e) {
    return json({ ok: false, motivo: 'error', mensaje: (e as Error).message });
  }
});
