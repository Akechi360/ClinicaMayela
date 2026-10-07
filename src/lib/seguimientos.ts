import { FRECUENCIAS, type FrecuenciaId } from './reconstitucion';
import { categoriaPorTratamiento, mensajeCheck24, mensajeCheck72, mensajeControl, mensajeCuidados, plantillaDe, type CategoriaCuidado } from '../data/cuidadosPostTratamiento';
import type { Seguimiento } from '../types/database.types';

export type SeguimientoNuevo = Pick<Seguimiento, 'paciente_id' | 'cita_id' | 'protocolo_id' | 'tipo' | 'fecha_programada' | 'mensaje'>;

/** "2026-10-07" + "09:00" (hora de Caracas, UTC−4 sin horario de verano) → ISO en UTC. */
export function caracasAUtc(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00-04:00`).toISOString();
}

/** Suma días de calendario a "YYYY-MM-DD" (sin depender de la zona horaria del navegador). */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().split('T')[0];
}

export interface OpcionesCuidados {
  pacienteId: string;
  nombre: string;
  categoria: CategoriaCuidado;
  citaId?: string | null;
  /** Mensaje de cuidados ya editado por la doctora (si no se pasa, se usa la plantilla) */
  mensajeCuidados?: string;
  ahora: Date;
  r24: boolean;
  r72: boolean;
  /** días hasta el control (null = no programar) */
  controlDias: number | null;
  /** true: el bot envía también el mensaje de cuidados ahora; false: ya se envió a mano por wa.me */
  incluirCuidadosAhora: boolean;
}

/** Arma las filas de la cola del bot para un procedimiento: cuidados, chequeos a 24 h y 72 h, y control. */
export function planCuidados(o: OpcionesCuidados): SeguimientoNuevo[] {
  const base = { paciente_id: o.pacienteId, cita_id: o.citaId ?? null, protocolo_id: null };
  const out: SeguimientoNuevo[] = [];
  const en = (h: number) => new Date(o.ahora.getTime() + h * 3600_000).toISOString();
  if (o.incluirCuidadosAhora) out.push({ ...base, tipo: 'cuidados_post', fecha_programada: o.ahora.toISOString(), mensaje: o.mensajeCuidados ?? mensajeCuidados(o.nombre, o.categoria) });
  if (o.r24) out.push({ ...base, tipo: 'recordatorio_24h', fecha_programada: en(24), mensaje: mensajeCheck24(o.nombre) });
  if (o.r72) out.push({ ...base, tipo: 'recordatorio_72h', fecha_programada: en(72), mensaje: mensajeCheck72(o.nombre) });
  if (o.controlDias && o.controlDias > 0) {
    const fecha = sumarDias(new Date(o.ahora.getTime() - 4 * 3600_000).toISOString().split('T')[0], o.controlDias);
    out.push({ ...base, tipo: 'control_estetico', fecha_programada: caracasAUtc(fecha, '10:00'), mensaje: mensajeControl(o.nombre, o.controlDias) });
  }
  return out;
}

export interface EscaladoDosis { semana: number; dosis: string }
export interface OpcionesDosis {
  pacienteId: string;
  protocoloId: string;
  nombre: string;
  peptido: string;
  dosis: string;
  /** "YYYY-MM-DD" del primer día */
  inicio: string;
  semanas: number;
  frecuencia: FrecuenciaId;
  /** "HH:MM" hora de Caracas */
  hora: string;
  escalado: EscaladoDosis[];
}

const primerNombre = (n: string) => n.trim().split(/\s+/)[0] || 'paciente';

/** Recordatorios de aplicación a lo largo del protocolo y avisos de escalado de dosis. */
export function planDosis(o: OpcionesDosis): SeguimientoNuevo[] {
  const frec = FRECUENCIAS.find((f) => f.id === o.frecuencia);
  if (!frec || o.semanas <= 0) return [];
  const cadaDias = Math.max(1, Math.round(1 / frec.porDia)); // 1, 2, 7, 14… (2/día y 3/semana se toman como diaria y cada 2 días)
  const escalado = [...o.escalado].filter((e) => e.semana >= 2 && e.dosis.trim()).sort((a, b) => a.semana - b.semana);
  const dosisEnSemana = (sem: number) => [...escalado].reverse().find((e) => e.semana <= sem)?.dosis ?? o.dosis;
  const base = { paciente_id: o.pacienteId, cita_id: null, protocolo_id: o.protocoloId };
  const out: SeguimientoNuevo[] = [];
  const total = o.semanas * 7;
  for (let d = 0; d < total; d += cadaDias) {
    const fecha = sumarDias(o.inicio, d);
    const semana = Math.floor(d / 7) + 1;
    out.push({ ...base, tipo: 'dosis_peptido', fecha_programada: caracasAUtc(fecha, o.hora),
      mensaje: `Hola ${primerNombre(o.nombre)} 💜 Hoy te toca tu aplicación de *${o.peptido}* (${dosisEnSemana(semana)}). Recuerda rotar el sitio de inyección y usar una jeringa nueva.` });
  }
  for (const e of escalado) {
    const fecha = sumarDias(o.inicio, (e.semana - 1) * 7);
    out.push({ ...base, tipo: 'escalado_dosis', fecha_programada: caracasAUtc(fecha, o.hora),
      mensaje: `Hola ${primerNombre(o.nombre)} 💜 A partir de hoy (semana ${e.semana}) cambia tu dosis de *${o.peptido}* a *${e.dosis}*. Si tienes dudas antes de aplicarla, escríbenos.` });
  }
  return out.sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada));
}

export { categoriaPorTratamiento, plantillaDe };
