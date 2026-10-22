// Entender respuestas escritas con palabras propias dentro de un trámite (elegir servicio, día u hora, decir sí o no).
// Todo son funciones puras sobre texto: se pueden ampliar sin tocar la conversación. Los números siguen valiendo como atajo.
import { norm } from './textos.js';

const SI = /^(si|sii+|sip|claro|confirmo|confirmar|confirmada|confirmado|ok|okey|dale|listo|perfecto|de acuerdo|correcto|esta bien|adelante|por favor|exacto|asi es|1)\b/;
const NO = /^(no|nop|nel|2)\b|mejor no|otro (dia|horario|hora)|otra (hora|fecha)|cambiar|no gracias/;

export const esSi = (texto) => SI.test(norm(texto));
export const esNo = (texto) => NO.test(norm(texto));

const ORDINALES = { primer: 0, segund: 1, tercer: 2, cuart: 3, quint: 4 };

/** Elige un elemento de la lista por número, por orden ("la segunda") o por parte de su nombre. null si no hay una única coincidencia. */
export function elegirPorTexto(texto, items, nombre = (x) => x) {
  const t = norm(texto);
  if (!t) return null;
  if (/^\d{1,2}$/.test(t)) {
    const n = Number(t);
    return n >= 1 && n <= items.length ? items[n - 1] : null;
  }
  const o = t.match(/\b(primer|segund|tercer|cuart|quint)[oa]\b/);
  if (o) return items[ORDINALES[o[1]]] ?? null;
  const directos = items.filter((i) => { const n = norm(nombre(i)); return n === t || (t.length >= 4 && n.includes(t)); });
  if (directos.length === 1) return directos[0];
  const palabras = t.split(' ').filter((w) => w.length >= 4);
  if (palabras.length) {
    const c = items.filter((i) => { const n = norm(nombre(i)); return palabras.some((w) => n.includes(w)); });
    if (c.length === 1) return c[0];
  }
  return null;
}

const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const minutos = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

/**
 * Hora que menciona el paciente ("10", "3:30", "a las 3 pm", "2 de la tarde", "mediodía").
 * `validas` = horarios libres ('HH:MM'). Sin am/pm se prueba la mañana y la tarde y se usa la que esté libre.
 * @returns {{ hora: string, valida: boolean, explicita: boolean, candidatas: string[] } | null}  explicita = lo dijo como hora ("a las 3", "3:30", "3 pm"), no solo un número suelto
 */
export function horaMencionada(texto, validas = []) {
  let t = norm(texto)
    .replace(/\b([ap])\s?\.?\s?m\b\.?/g, ' $1m ')
    .replace(/\b(de|en|por) la manana\b/g, ' am ')
    .replace(/\b(de|en|por) la (tarde|noche)\b/g, ' pm ');
  if (/mediodia/.test(t)) t = '12:00';
  const m = t.match(/(?<![\d:])(\d{1,2})(?:[:.h](\d{2}))?\s*(am|pm)?(?!\d)/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : /y media/.test(t) ? 30 : 0;
  if (h > 23 || min > 59) return null;
  const marca = m[3];
  const explicita = !!(m[2] || marca || /y media|\ba las\b|\bla una\b|mediodia/.test(norm(texto)) || t === '12:00');
  const candidatos = marca ? [marca === 'pm' ? (h % 12) + 12 : h % 12] : h > 0 && h < 12 ? [h, h + 12] : [h];
  const libre = candidatos.map((c) => hhmm(c, min)).find((x) => validas.includes(x));
  return { hora: libre ?? hhmm(candidatos[candidatos.length - 1], min), valida: !!libre, explicita, candidatas: candidatos.map((c) => hhmm(c, min)) };
}

/** Los `n` horarios libres más cercanos a una hora pedida. */
export function horasCercanas(hora, validas, n = 2) {
  return [...validas].sort((a, b) => Math.abs(minutos(a) - minutos(hora)) - Math.abs(minutos(b) - minutos(hora))).slice(0, n).sort();
}

/** Día del mes que dice el paciente ("el 22", "22 de octubre") entre los días ofrecidos. */
export function diaDelMes(texto, dias) {
  const m = norm(texto).match(/(?:\bel |\bdia |^)(\d{1,2})(?!\d|:)/);
  if (!m) return null;
  const n = Number(m[1]);
  return dias.find((d) => Number(d.slice(8, 10)) === n) ?? null;
}
