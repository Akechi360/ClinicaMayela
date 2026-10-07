/** Perfiles de laboratorio de la Dra. según el sexo del paciente. */
const COMUNES_1 = [
  'Perfil 20',
  'PCR ultrasensible',
  'VSG',
  'IL-6',
  'Insulina basal con índice HOMA',
  'TSH, T3 y T4 total y libre',
  'Amilasa, lipasa y fosfatasa alcalina',
  'Cortisol en ayunas',
];
const COMUNES_2 = ['DHEA', 'Testosterona total y libre', 'Vitamina D', 'IGF-1', 'Hormona de crecimiento cuantificada'];

export const PERFIL_MASCULINO = [...COMUNES_1, ...COMUNES_2];
export const PERFIL_FEMENINO = [...COMUNES_1, 'Estrógeno, progesterona y prolactina', ...COMUNES_2];

export type PerfilLab = 'Femenino' | 'Masculino';

export const estudiosDePerfil = (perfil: PerfilLab): string[] => (perfil === 'Femenino' ? PERFIL_FEMENINO : PERFIL_MASCULINO);

/** Perfil sugerido según el género registrado del paciente (null si no está definido). */
export function perfilDeGenero(genero?: string | null): PerfilLab | null {
  const g = (genero ?? '').trim().toLowerCase();
  if (g.startsWith('f') || g === 'mujer') return 'Femenino';
  if (g.startsWith('m') || g === 'hombre') return 'Masculino';
  return null;
}
