// INTENCIONES: qué quiere el paciente según lo que escribe. Para que el bot entienda más formas de pedir lo mismo,
// agregue palabras o frases a las listas de abajo (en minúscula y SIN tildes: el texto del paciente se normaliza antes de comparar).
// Cada entrada es una expresión regular simple; las palabras separadas por | son alternativas.
// El ORDEN importa: se prueba de arriba hacia abajo y gana la primera que coincida.
import { norm } from './textos.js';

export const INTENCIONES = [
  { id: 'gracias', patron: /^(muchas )?gracias|^(mil|muy) gracias|^ok gracias|^listo gracias|se lo agradezco|muy amable/ },
  { id: 'despedida', patron: /^(adios|chao|chau|hasta luego|hasta pronto|nos vemos|bendiciones|feliz dia|buen dia para usted)\b|^(eso es todo|nada mas|es todo)/ },
  { id: 'doctora', patron: /doctora|la dra\b|hablar con (la |una |alguien|usted|una persona|un humano)|persona real|un humano|asesor|que me llamen|llamenme|comunicarme con/ },
  { id: 'cambiar', patron: /(cambiar|mover|reprogramar|reagendar|modificar|posponer|adelantar|pasar)( mi| la| una)? (cita|consulta|turno)|cambiar (la )?hora|cambiar (el )?dia/ },
  { id: 'cancelar', patron: /cancel|anular|ya no (puedo|voy|podre)|no voy a poder (ir|asistir)|no podre (ir|asistir)/ },
  { id: 'ver_citas', patron: /mis citas|mi cita|cuando (es|tengo|me toca)|tengo (alguna |una )?cita|proxima cita|ver (mi|mis|las) (cita|citas)|confirmar mi cita|a que hora (es|tengo|me toca)/ },
  { id: 'agendar', patron: /agend|reserv|apart(ar|o)|(sacar|pedir|solicitar|programar|hacer|conseguir|tomar) (una |mi )?(cita|consulta|turno)|(quiero|quisiera|necesito|deseo|me gustaria|busco|tienen|hay) (una )?(cita|consulta|turno|valoracion|espacio|disponibilidad)|valoracion|disponibilidad|horarios? disponibles?|cita para/ },
  { id: 'info', patron: /horario|hora de (atencion|apertura)|a que hora (abren|atienden|cierran)|abren|cierran|donde (estan|queda|se ubican|atienden)|direccion|ubicacion|como llego|precio|costo|cuanto (cuesta|vale|cobran)|tarifa|que (tratamientos|servicios|procedimientos)|servicios|informacion|telefono|que hacen/ },
];

const OPCION = { agendar: '1', ver_citas: '2', cancelar: '3', info: '4', doctora: '5' };

/** Intención detectada ('agendar', 'cancelar', 'gracias'…) o null. */
export function detectarIntencion(texto) {
  const t = norm(texto);
  if (!t || /^\d{1,2}$/.test(t)) return null;
  return INTENCIONES.find((i) => i.patron.test(t))?.id ?? null;
}

/** Opción del menú (1–5) que corresponde a la intención, o null. */
export const opcionDeIntencion = (id) => OPCION[id] ?? null;

const SEMANA = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };

/** Día mencionado en el texto ("hoy", "mañana", "pasado mañana", "el jueves") como 'AAAA-MM-DD', o null. `hoy` es 'AAAA-MM-DD' de Caracas. */
export function diaMencionado(texto, hoy) {
  const t = norm(texto);
  const sumar = (n) => new Date(new Date(`${hoy}T12:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
  if (/pasado manana/.test(t)) return sumar(2);
  if (/\bmanana\b/.test(t)) return sumar(1);
  if (/\bhoy\b/.test(t)) return hoy;
  const m = t.match(/\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/);
  if (!m) return null;
  const actual = new Date(`${hoy}T12:00:00Z`).getUTCDay();
  let falta = (SEMANA[m[1]] - actual + 7) % 7;
  if (falta === 0) falta = 7; // "el lunes" dicho un lunes = el próximo
  return sumar(falta);
}
