import type { Paciente } from '../types/database.types';
import { etiquetaPatologia } from '../data/patologias';

/** Texto de antecedentes y alergias que se propone para el récipe (la Dra. lo revisa y lo edita antes de emitir). */
export function textoAntecedentes(p: Pick<Paciente, 'patologias' | 'alergias' | 'antecedentes'>): string {
  const lineas: string[] = [];
  if (p.patologias?.length) lineas.push(`Patologías previas: ${p.patologias.map(etiquetaPatologia).join(', ')}.`);
  if (p.alergias?.trim()) lineas.push(`Alergias: ${p.alergias.trim()}.`);
  if (p.antecedentes?.trim()) lineas.push(`Otros antecedentes: ${p.antecedentes.trim().replace(/\n+/g, '; ')}`);
  return lineas.join('\n');
}
