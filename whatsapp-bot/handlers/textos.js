// Textos y formatos de los mensajes del bot (todo en hora de Caracas).

/** Minúsculas, sin tildes ni espacios sobrantes: para comparar lo que escribe el paciente. */
export const norm = (t) => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** "14:30" → "2:30 p. m." */
export function hora12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
}

/** "2026-10-21" → "miércoles 21 de octubre" */
export const textoDia = (dia) =>
  new Intl.DateTimeFormat('es-VE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${dia}T12:00:00Z`)).replace(',', '');

/** Instante → "miércoles 21 de octubre, 10:00 a. m." (Caracas) */
export function textoCita(fecha) {
  const f = new Date(fecha);
  const dia = new Intl.DateTimeFormat('es-VE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Caracas' }).format(f).replace(',', '');
  const hora = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Caracas' }).format(f);
  return `${dia}, ${hora12(hora)}`;
}

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** "lunes a viernes de 10:00 a. m. a 5:00 p. m." */
export function textoHorario(config) {
  const d = [...config.dias].sort();
  const consecutivos = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
  const dias = consecutivos && d.length > 1 ? `${DIAS[d[0] - 1]} a ${DIAS[d[d.length - 1] - 1]}` : d.map((x) => DIAS[x - 1]).join(', ');
  return `${dias} de ${hora12(config.apertura)} a ${hora12(config.cierre)}`;
}
