/** Cierre de sesión por inactividad (buena práctica HIPAA/ISO 27799: "automatic logoff"). */
export const LIMITE_INACTIVIDAD_MS = 20 * 60 * 1000; // sin actividad durante 20 min → se cierra la sesión
export const AVISO_INACTIVIDAD_MS = 60 * 1000; // el último minuto se muestra un aviso con cuenta regresiva
export const CLAVE_ACTIVIDAD = 'cm_ultima_actividad';
export const CLAVE_SESION_EXPIRADA = 'cm_sesion_expirada';

export type EstadoInactividad = 'activo' | 'aviso' | 'expirado';

/** Se calcula con marcas de tiempo (no con un temporizador) para que funcione aunque el equipo se suspenda. */
export function estadoInactividad(
  ultima: number,
  ahora: number,
  limiteMs = LIMITE_INACTIVIDAD_MS,
  avisoMs = AVISO_INACTIVIDAD_MS,
): EstadoInactividad {
  const inactivo = ahora - ultima;
  if (inactivo >= limiteMs) return 'expirado';
  return inactivo >= limiteMs - avisoMs ? 'aviso' : 'activo';
}
