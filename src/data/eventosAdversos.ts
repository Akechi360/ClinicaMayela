export const TIPOS_EVENTO = [
  { id: 'edema_prolongado', label: 'Edema prolongado' },
  { id: 'hematoma', label: 'Hematoma (grado II-III)' },
  { id: 'nodulo_granuloma', label: 'Nódulo / granuloma' },
  { id: 'infeccion_eritema', label: 'Infección / eritema' },
  { id: 'sufrimiento_vascular', label: 'Sufrimiento vascular' },
  { id: 'asimetria', label: 'Asimetría' },
  { id: 'ptosis', label: 'Ptosis' },
  { id: 'alergia', label: 'Reacción alérgica' },
  { id: 'efecto_gastrointestinal', label: 'Efecto gastrointestinal (péptido)' },
  { id: 'intolerancia_dosis', label: 'Intolerancia a la dosis' },
  { id: 'otro', label: 'Otro' },
] as const;

export const SEVERIDADES = [
  { id: 'leve', label: 'Leve' },
  { id: 'moderada', label: 'Moderada' },
  { id: 'severa', label: 'Severa' },
] as const;

export const ESTADOS_EVENTO = [
  { id: 'activo', label: 'Activo' },
  { id: 'en_tratamiento', label: 'En tratamiento' },
  { id: 'resuelto', label: 'Resuelto' },
] as const;

export const CONDUCTAS_SUGERIDAS = ['Hialuronidasa', 'Corticoides', 'Antibióticos', 'Antihistamínicos', 'Ajuste de dosis', 'Suspender péptido', 'Reposo y control', 'Derivación'];

export const etiquetaEvento = (id: string) => TIPOS_EVENTO.find((t) => t.id === id)?.label ?? id;
