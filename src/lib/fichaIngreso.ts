import type { Paciente } from '../types/database.types';
import { urlPublica } from './recipeVerify';

/** Datos que el paciente declara en su ficha de ingreso (validados y limitados por el servidor). */
export interface FichaDatos {
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  fecha_nacimiento: string | null;
  genero: 'Femenino' | 'Masculino' | null;
  estatura_cm: number | null;
  patologias: string[];
  alergias: string;
  antecedentes: string;
  medicamentos: string;
  motivo: string;
  veracidad: boolean;
  privacidad: boolean;
}

export interface FichaIngreso {
  id: string;
  token: string;
  paciente_id: string | null;
  estado: 'pendiente' | 'recibida' | 'aplicada' | 'descartada';
  expira_en: string;
  datos: FichaDatos | null;
  recibida_en: string | null;
  created_at: string;
}

export const fichaUrl = (token: string) => `${urlPublica()}/f/${encodeURIComponent(token)}`;

/** Campos del paciente que salen de la ficha (medicamentos y motivo se agregan a antecedentes/notas). */
export function fichaAPaciente(d: FichaDatos): Omit<Paciente, 'id' | 'creado_en'> {
  const antecedentes = [d.antecedentes.trim(), d.medicamentos.trim() ? `Medicamentos actuales: ${d.medicamentos.trim()}` : '']
    .filter(Boolean)
    .join('\n');
  return {
    nombre: d.nombre.trim(),
    apellido: d.apellido.trim(),
    cedula: d.cedula.trim() || undefined,
    telefono: d.telefono.trim() || undefined,
    email: d.email.trim() || undefined,
    fecha_nacimiento: d.fecha_nacimiento ?? undefined,
    genero: d.genero ?? undefined,
    estatura_cm: d.estatura_cm,
    patologias: d.patologias,
    alergias: d.alergias.trim() || undefined,
    antecedentes: antecedentes || undefined,
    notas: d.motivo.trim() ? `Motivo de consulta: ${d.motivo.trim()}` : undefined,
  };
}

/** Une la ficha con un paciente existente: la ficha completa lo que declaró; las patologías se suman. */
export function fusionarFicha(actual: Partial<Paciente>, d: FichaDatos) {
  const f = fichaAPaciente(d);
  const unir = (a?: string, b?: string) => [a?.trim(), b?.trim()].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join('\n');
  return {
    nombre: f.nombre || actual.nombre || '',
    apellido: f.apellido || actual.apellido || '',
    cedula: f.cedula ?? actual.cedula ?? '',
    telefono: f.telefono ?? actual.telefono ?? '',
    email: f.email ?? actual.email ?? '',
    fecha_nacimiento: f.fecha_nacimiento ?? actual.fecha_nacimiento ?? '',
    genero: f.genero ?? actual.genero ?? '',
    estatura_cm: f.estatura_cm ?? actual.estatura_cm ?? null,
    patologias: Array.from(new Set([...(actual.patologias ?? []), ...(f.patologias ?? [])])),
    alergias: f.alergias ?? actual.alergias ?? '',
    antecedentes: unir(actual.antecedentes, f.antecedentes),
    notas: unir(actual.notas, f.notas),
  };
}
