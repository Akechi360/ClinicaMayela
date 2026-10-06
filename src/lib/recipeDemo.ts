import type { RecipeVerificado } from '../types/database.types';

/** Solo desarrollo: datos de ejemplo para previsualizar /v/demo, /v/demo-dispensado, /v/demo-expirado, /v/demo-anulado, /v/demo-invalido. */
const base: RecipeVerificado = {
  valido: true,
  estado: 'emitido',
  fecha: '2026-10-06',
  medicamentos:
    '1. Meropenem 1 g — 1 g cada 8 horas — por 7 días\n2. Ibuprofeno 400 mg — 400 mg — dos veces al día — por 5 días\n3. Vitamina C inyectable — 1 ampolla — semanal — por 4 semanas',
  indicaciones: 'Administrar el meropenem diluido en 100 cc de solución 0.9 % vía endovenosa en 1 hora. Reposo relativo.',
  paciente: 'Luisa Elena Ruiz Machado',
  paciente_cedula: 'V-***3650',
  doctor_nombre: 'Dra. Mayela González',
  doctor_mpps: '652562',
  doctor_col: '7645',
  especialidad: 'Medicina Estética & Longevidad',
  telefono: '+58 414 000 0000',
  consultorio_nombre: 'Clínica Dra. Mayela González',
  consultorio_direccion: 'Av. Principal, Edif. Ejemplo, piso 2, Valencia',
  firma: null,
  sello: null
};

export const recipeDemo = async (codigo: string): Promise<RecipeVerificado> => {
  switch (codigo) {
    case 'demo-dispensado':
      return { ...base, estado: 'dispensado', estado_at: '2026-10-07T15:00:00Z' };
    case 'demo-expirado':
      return { ...base, estado: 'anulado', estado_at: '2026-10-08T12:00:00Z', vigente_codigo: 'demo' };
    case 'demo-anulado':
      return { valido: true, estado: 'anulado', estado_at: '2026-10-08T12:00:00Z', fecha: base.fecha, doctor_nombre: base.doctor_nombre };
    case 'demo-invalido':
      return { valido: false };
    default:
      return base;
  }
};
