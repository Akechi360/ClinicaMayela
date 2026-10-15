// Lógica pura (sin Deno ni red) de la sincronización con Google Calendar: se prueba con vitest.

export interface CitaParaEvento {
  id: string;
  fecha_hora: string;
  estado?: string | null;
  notas?: string | null;
  duracion_minutos?: number | null;
  paciente?: { nombre?: string | null; apellido?: string | null; telefono?: string | null } | null;
  tratamiento?: { nombre?: string | null; duracion_minutos?: number | null } | null;
}

export interface EventoGoogle {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  colorId?: string;
  extendedProperties: { private: { citaId: string; origen: string } };
}

export const ZONA = 'America/Caracas';

const COLOR_POR_ESTADO: Record<string, string> = {
  pendiente: '5',   // amarillo
  confirmado: '10', // verde
  en_sala: '9',     // azul
  completado: '8',  // gris
};

/** Duración en minutos: la de la cita, si no la del tratamiento, si no 30. Acotada a 5–480. */
export function duracionMinutos(c: CitaParaEvento): number {
  const d = c.duracion_minutos ?? c.tratamiento?.duracion_minutos ?? 30;
  return Math.min(480, Math.max(5, Math.round(d)));
}

export function construirEvento(c: CitaParaEvento): EventoGoogle {
  const inicio = new Date(c.fecha_hora);
  if (Number.isNaN(inicio.getTime())) throw new Error('Fecha de cita inválida');
  const fin = new Date(inicio.getTime() + duracionMinutos(c) * 60_000);
  const paciente = [c.paciente?.nombre, c.paciente?.apellido].filter(Boolean).join(' ').trim() || 'Paciente';
  const tratamiento = c.tratamiento?.nombre?.trim() || 'Cita';
  const lineas = [
    `Paciente: ${paciente}`,
    `Tratamiento: ${tratamiento}`,
    c.paciente?.telefono ? `Teléfono: ${c.paciente.telefono}` : '',
    c.estado ? `Estado: ${c.estado}` : '',
    c.notas?.trim() ? `Notas: ${c.notas.trim()}` : '',
    '',
    'Generado por la app de la Clínica Dra. Mayela González',
  ].filter((l, i, a) => l !== '' || i === a.length - 2);
  return {
    summary: `${tratamiento} · ${paciente}`.slice(0, 200),
    description: lineas.join('\n'),
    start: { dateTime: inicio.toISOString(), timeZone: ZONA },
    end: { dateTime: fin.toISOString(), timeZone: ZONA },
    ...(c.estado && COLOR_POR_ESTADO[c.estado] ? { colorId: COLOR_POR_ESTADO[c.estado] } : {}),
    extendedProperties: { private: { citaId: c.id, origen: 'app-clinica' } },
  };
}

export type Accion = 'crear' | 'actualizar' | 'eliminar' | 'nada';

/** Qué hacer en Google según el estado de la cita y si ya tiene evento. */
export function accionPara(estado: string | null | undefined, eventId: string | null | undefined): Accion {
  if ((estado ?? '').toLowerCase() === 'cancelado') return eventId ? 'eliminar' : 'nada';
  return eventId ? 'actualizar' : 'crear';
}

/** Comparación en tiempo constante (no filtra el token por diferencias de tiempo). */
export function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export interface CuentaServicio { client_email: string; private_key: string; token_uri?: string }

/** Valida el JSON de la cuenta de servicio guardado como secreto. */
export function leerCuentaServicio(json: string | undefined | null): CuentaServicio | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as Partial<CuentaServicio>;
    if (typeof o.client_email === 'string' && typeof o.private_key === 'string' && o.private_key.includes('PRIVATE KEY')) {
      return { client_email: o.client_email, private_key: o.private_key, token_uri: o.token_uri };
    }
  } catch { /* JSON inválido */ }
  return null;
}
