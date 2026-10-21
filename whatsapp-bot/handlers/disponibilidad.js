// Disponibilidad de la agenda para el bot: horario de atención, duración real de cada cita y anticipación mínima.
// Todo en hora de Caracas. Funciones puras (se prueban sin base de datos).
import { diaSiguiente, fechaHoraCaracas } from './reminderSchedule.js';

export const CONFIG_POR_DEFECTO = {
  apertura: '10:00', cierre: '17:00', dias: [1, 2, 3, 4, 5], intervalo: 30,
  anticipacionHoras: 3, horizonteDias: 21, maxCitasFuturas: 2, cancelarHoras: 12,
};

const num = (v, d, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};
const hhmm = (v, d) => (typeof v === 'string' && /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : d);

/** Convierte la fila de clinic_settings en la configuración del bot (con valores por defecto seguros). */
export function configDesdeAjustes(a = {}) {
  const dias = Array.isArray(a.bot_dias) ? a.bot_dias.map(Number).filter((d) => d >= 1 && d <= 7) : [];
  return {
    apertura: hhmm(a.bot_hora_apertura, CONFIG_POR_DEFECTO.apertura),
    cierre: hhmm(a.bot_hora_cierre, CONFIG_POR_DEFECTO.cierre),
    dias: dias.length ? dias : CONFIG_POR_DEFECTO.dias,
    intervalo: num(a.bot_intervalo_min, 30, 10, 120),
    anticipacionHoras: num(a.bot_anticipacion_horas, 3, 0, 72),
    horizonteDias: num(a.bot_horizonte_dias, 21, 1, 90),
    maxCitasFuturas: num(a.bot_max_citas_futuras, 2, 1, 10),
    cancelarHoras: num(a.bot_cancelar_horas, 12, 0, 168),
  };
}

const aMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const pad = (n) => String(n).padStart(2, '0');

/** 1 = lunes … 7 = domingo, para un día "YYYY-MM-DD". */
export function diaSemanaISO(dia) {
  const w = new Date(`${dia}T12:00:00Z`).getUTCDay();
  return w === 0 ? 7 : w;
}

/** Duración que ocupa una cita: la mayor entre la de la cita y la de su tratamiento (las citas de la app guardan 30 por defecto). */
export function duracionEfectiva(cita) {
  const tr = Array.isArray(cita.tratamiento) ? cita.tratamiento[0] : cita.tratamiento;
  return Math.max(Number(cita.duracion_minutos) || 30, Number(tr?.duracion_minutos) || 0);
}

/** [{ inicio: Date, fin: Date }] de las citas que ocupan agenda. */
export function intervalosOcupados(citas) {
  return (citas ?? []).map((c) => {
    const inicio = new Date(c.fecha_hora);
    return { inicio, fin: new Date(inicio.getTime() + duracionEfectiva(c) * 60_000) };
  });
}

/** Horarios libres de un día para una duración dada. */
export function slotsDelDia({ dia, config, ocupados, duracionMin, ahora = new Date() }) {
  if (!config.dias.includes(diaSemanaISO(dia))) return [];
  const minimo = ahora.getTime() + config.anticipacionHoras * 3_600_000;
  const cierre = aMin(config.cierre);
  const out = [];
  for (let t = aMin(config.apertura); t + duracionMin <= cierre; t += config.intervalo) {
    const inicio = fechaHoraCaracas(dia, Math.floor(t / 60), t % 60);
    if (!inicio || inicio.getTime() < minimo) continue;
    const fin = new Date(inicio.getTime() + duracionMin * 60_000);
    if (ocupados.some((o) => inicio < o.fin && fin > o.inicio)) continue;
    out.push({ hora: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`, inicio });
  }
  return out;
}

/** Próximos días (desde `desde`, dentro del horizonte) que tienen al menos un horario libre. */
export function diasDisponibles({ desde, config, ocupados, duracionMin, ahora = new Date(), max = 6 }) {
  const out = [];
  let dia = desde;
  for (let i = 0; i < config.horizonteDias && out.length < max; i++) {
    const slots = slotsDelDia({ dia, config, ocupados, duracionMin, ahora });
    if (slots.length) out.push({ dia, slots });
    dia = diaSiguiente(dia);
  }
  return out;
}
