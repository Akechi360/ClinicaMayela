// Tiempo en hora de Caracas (UTC−4, sin horario de verano). El servidor del bot suele estar en UTC, por lo que no se
// puede depender de su zona horaria local: antes, las citas agendadas por WhatsApp y los recordatorios salían 4 h corridos.

const TZ = 'America/Caracas';

/** Día "YYYY-MM-DD" y hora "HH:MM" en Caracas de un instante. */
export function ahoraCaracas(fecha = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(fecha).map((p) => [p.type, p.value]),
  );
  return { dia: `${partes.year}-${partes.month}-${partes.day}`, hora: `${partes.hour === '24' ? '00' : partes.hour}:${partes.minute}` };
}

/** "2026-10-07" → "2026-10-08" */
export function diaSiguiente(dia) {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

/** Instante (Date) de un día y hora dichos en hora de Caracas; null si no es una fecha/hora real. */
export function fechaHoraCaracas(dia, hh, mm) {
  const h = Number(hh);
  const m = Number(mm);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !(h >= 0 && h < 24) || !(m >= 0 && m < 60)) return null;
  const f = new Date(`${dia}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-04:00`);
  return Number.isNaN(f.getTime()) ? null : f;
}

/** Texto de fecha y hora para mostrar al paciente, siempre en hora de Caracas. */
export const textoFechaHora = (fecha) => new Date(fecha).toLocaleString('es-MX', { timeZone: TZ });

/**
 * true si ya llegó la hora configurada y hoy todavía no se enviaron los recordatorios.
 * Se evalúa cada minuto; si el bot estuvo desconectado a la hora exacta, los envía en cuanto vuelve (ese mismo día).
 */
export function correspondenRecordatorios(fecha, horaConfig = '09:00:00', ultimoDiaEnviado = null) {
  const { dia, hora } = ahoraCaracas(fecha);
  const objetivo = String(horaConfig || '09:00').slice(0, 5);
  return hora >= objetivo && ultimoDiaEnviado !== dia;
}
