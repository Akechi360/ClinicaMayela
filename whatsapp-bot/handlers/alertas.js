// Alertas a la doctora por WhatsApp: el bot le escribe a su número cuando hay algo que atender (citas, cancelaciones, pacientes que
// piden hablar con ella, síntomas urgentes). Horas de silencio: lo no urgente espera y llega en un solo resumen por la mañana.
// Funciones puras + un procesador con repo y "enviar" inyectados (se prueba sin WhatsApp ni base de datos).
import { ahoraCaracas } from './reminderSchedule.js';
import { normalizarTelefono } from './telefono.js';
import { hora12, textoDia } from './textos.js';

export const MAX_INTENTOS = 3;
const ESPERA_FALLO_RESUMEN_MS = 10 * 60_000;

const hhmm = (v, d) => (typeof v === 'string' && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : d);

/** Configuración de alertas desde la fila de clinic_settings (con valores por defecto seguros). */
export function configAlertas(a = {}) {
  return {
    activa: a.alerta_activa !== false,
    telefono: normalizarTelefono(a.alerta_telefono),
    desde: hhmm(a.alerta_silencio_desde, '19:00'),
    hasta: hhmm(a.alerta_silencio_hasta, '07:00'),
    citas: a.alerta_citas !== false,
    cancelaciones: a.alerta_cancelaciones !== false,
    fichas: a.alerta_fichas !== false,
    ultimoResumen: a.alerta_ultimo_resumen ?? null,
  };
}

/** ¿Es hora de silencio (hora de Caracas)? Admite ventanas que cruzan la medianoche (19:00 → 07:00). */
export function esSilencio(fecha, desde = '19:00', hasta = '07:00') {
  const { hora } = ahoraCaracas(fecha);
  return desde <= hasta ? hora >= desde && hora < hasta : hora >= desde || hora < hasta;
}

/**
 * Qué hacer con una notificación:
 *  - urgente  → se envía siempre, sin importar el silencio
 *  - inmediata → se envía al momento (de día) o se agrupa en el resumen (de noche)
 *  - resumen  → solo va en el resumen de la mañana
 *  - ignorar  → no se avisa (tipo desconocido o desactivado en Ajustes)
 */
export function clasificar(n, cfg) {
  const enSilencio = esSilencio(new Date(n.created_at), cfg.desde, cfg.hasta);
  const normal = { modo: enSilencio ? 'resumen' : 'inmediata' };
  switch (n.tipo) {
    case 'sintomas_urgentes': return { modo: 'inmediata', urgente: true };
    case 'chat_whatsapp': return normal;
    case 'cita_nueva_whatsapp':
    case 'cita_por_aprobar_whatsapp': return cfg.citas ? normal : { modo: 'ignorar' };
    case 'cita_cancelada_whatsapp': return cfg.cancelaciones ? normal : { modo: 'ignorar' };
    case 'ficha_recibida': return cfg.fichas ? { modo: 'resumen' } : { modo: 'ignorar' };
    default: return { modo: 'ignorar' };
  }
}

const tel = (m) => (m?.telefono ? `\nTel.: ${m.telefono}` : '');
const quien = (m, n) => String(m?.nombre ?? '').trim() || n.mensaje;

/** Mensaje de alerta (trato formal, corto). */
export function textoAlerta(n) {
  const m = n.metadata ?? {};
  switch (n.tipo) {
    case 'sintomas_urgentes':
      return `🚨 *Síntomas urgentes — ${quien(m, n)}*\n${m.texto ? `Escribió: «${m.texto}»\n` : ''}${tel(m).trim()}\nSe recomienda contactarle de inmediato. El asistente ya le indicó acudir a un centro de salud si se trata de una emergencia.`.replace(/\n\n+/g, '\n');
    case 'chat_whatsapp':
      return `💬 *${quien(m, n)}* desea hablar con usted por WhatsApp.${tel(m)}\nPuede responderle desde el teléfono de la clínica.`;
    case 'cita_nueva_whatsapp':
      return `📅 *Nueva cita agendada por WhatsApp*\n${quien(m, n)}${m.tratamiento ? `\n${m.tratamiento}` : ''}${m.cuando ? `\n${m.cuando}` : ''}${tel(m)}`;
    case 'cita_por_aprobar_whatsapp':
      return `📝 *Solicitud de cita por confirmar*\n${quien(m, n)}${m.tratamiento ? `\n${m.tratamiento}` : ''}${m.cuando ? `\n${m.cuando}` : ''}${tel(m)}\nConfírmela desde la app.`;
    case 'cita_cancelada_whatsapp':
      return `❌ *Cita cancelada por WhatsApp*\n${quien(m, n)}${m.cuando ? `\n${m.cuando}` : ''}${tel(m)}`;
    case 'ficha_recibida':
      return `📋 ${n.mensaje}`;
    default:
      return n.mensaje;
  }
}

/** Línea corta para el resumen de la mañana. */
export function lineaResumen(n) {
  const m = n.metadata ?? {};
  switch (n.tipo) {
    case 'chat_whatsapp': return `💬 ${quien(m, n)} desea hablar con usted${m.telefono ? ` (${m.telefono})` : ''}`;
    case 'cita_nueva_whatsapp': return `📅 Nueva cita: ${quien(m, n)}${m.tratamiento ? ` · ${m.tratamiento}` : ''}${m.cuando ? ` · ${m.cuando}` : ''}`;
    case 'cita_por_aprobar_whatsapp': return `📝 Por confirmar: ${quien(m, n)}${m.tratamiento ? ` · ${m.tratamiento}` : ''}${m.cuando ? ` · ${m.cuando}` : ''}`;
    case 'cita_cancelada_whatsapp': return `❌ Cancelación: ${quien(m, n)}${m.cuando ? ` · ${m.cuando}` : ''}`;
    case 'ficha_recibida': return `📋 ${n.mensaje}`;
    default: return n.mensaje;
  }
}

/** Resumen de la mañana: lo ocurrido fuera de horario + la agenda del día. */
export function textoResumen({ items, agenda, dia }) {
  const partes = ['☀️ *Buenos días, Dra. Mayela.*'];
  if (items.length) partes.push(`*Pendientes desde la última revisión (${items.length})*\n${items.map((n) => `• ${lineaResumen(n)}`).join('\n')}`);
  if (agenda.length) {
    const filas = agenda.map((c) => {
      const p = Array.isArray(c.paciente) ? c.paciente[0] : c.paciente;
      const t = Array.isArray(c.tratamiento) ? c.tratamiento[0] : c.tratamiento;
      const hora = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Caracas' }).format(new Date(c.fecha_hora));
      return `• ${hora12(hora)} · ${[p?.nombre, p?.apellido].filter(Boolean).join(' ') || 'Paciente'}${t?.nombre ? ` · ${t.nombre}` : ''}${c.estado === 'pendiente' ? ' (por confirmar)' : ''}`;
    });
    partes.push(`*Agenda de hoy — ${textoDia(dia)}*\n${filas.join('\n')}`);
  }
  return partes.join('\n\n');
}

let fallosResumen = 0;

/**
 * Un ciclo de alertas (se ejecuta cada minuto).
 * @param repo    notificacionesSinAlertar, marcarAlertadas, registrarFalloAlerta, agendaDelDia, marcarResumen, ajustes
 * @param enviar  async (jid, texto) => void
 */
export async function procesarAlertas({ repo, enviar, ahora = new Date() }) {
  const cfg = configAlertas(await repo.ajustes());
  if (!cfg.activa || !cfg.telefono) return { enviados: 0 };

  const jid = `${cfg.telefono}@s.whatsapp.net`;
  const enSilencio = esSilencio(ahora, cfg.desde, cfg.hasta);
  const hoy = ahoraCaracas(ahora).dia;
  const pendientes = await repo.notificacionesSinAlertar(50);

  const ignoradas = [];
  const urgentes = [];
  const inmediatas = [];
  const resumen = [];
  for (const n of pendientes) {
    const c = clasificar(n, cfg);
    if (c.modo === 'ignorar') ignoradas.push(n.id);
    else if (c.urgente) urgentes.push(n);
    else if (c.modo === 'inmediata') inmediatas.push(n);
    else resumen.push(n);
  }
  if (ignoradas.length) await repo.marcarAlertadas(ignoradas);

  let enviados = 0;
  const enviarUna = async (n) => {
    try {
      await enviar(jid, textoAlerta(n));
      await repo.marcarAlertadas([n.id]);
      enviados++;
    } catch (e) {
      console.error(`No se pudo enviar la alerta ${n.id}:`, e.message);
      await repo.registrarFalloAlerta(n.id, MAX_INTENTOS);
    }
  };

  // Lo urgente siempre se envía, también de noche
  for (const n of urgentes) await enviarUna(n);

  if (enSilencio) return { enviados };

  if (cfg.ultimoResumen !== hoy) {
    // Primer ciclo del día fuera del silencio: un solo mensaje con lo pendiente y la agenda
    if (Date.now() - fallosResumen < ESPERA_FALLO_RESUMEN_MS) return { enviados };
    const items = [...inmediatas, ...resumen];
    const agenda = await repo.agendaDelDia(hoy);
    if (items.length || agenda.length) {
      try {
        await enviar(jid, textoResumen({ items, agenda, dia: hoy }));
        if (items.length) await repo.marcarAlertadas(items.map((n) => n.id));
        enviados++;
      } catch (e) {
        console.error('No se pudo enviar el resumen de la mañana:', e.message);
        fallosResumen = Date.now();
        return { enviados };
      }
    }
    await repo.marcarResumen(hoy);
  } else {
    for (const n of inmediatas) await enviarUna(n);
  }
  return { enviados };
}

export const _pruebas = { reiniciarFallos: () => { fallosResumen = 0; } };
