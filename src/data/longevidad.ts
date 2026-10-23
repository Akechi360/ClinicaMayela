/** Historia clínica de longevidad y salud metabólica. Un solo esquema alimenta el formulario del paciente, la pestaña de la Dra. y el resumen. */

export type TipoCampo = 'texto' | 'textarea' | 'numero' | 'escala' | 'opcion' | 'multi' | 'sino';

export interface OpcionCampo { valor: string; label: string }

export interface CampoLongevidad {
  id: string;
  label: string;
  tipo: TipoCampo;
  opciones?: OpcionCampo[];
  min?: number;
  max?: number;
  paso?: number;
  unidad?: string;
  ayuda?: string;
  placeholder?: string;
}

export interface SeccionLongevidad {
  id: string;
  titulo: string;
  descripcion?: string;
  campos: CampoLongevidad[];
}

const op = (...pares: [string, string][]): OpcionCampo[] => pares.map(([valor, label]) => ({ valor, label }));

export const SECCIONES_LONGEVIDAD: SeccionLongevidad[] = [
  {
    id: 'perfil',
    titulo: '1. Datos generales · Ocupación y estilo de vida',
    campos: [
      { id: 'ocupacion', label: 'Ocupación', tipo: 'texto', placeholder: 'Ej. Abogada, ingeniero, docente…' },
      {
        id: 'estilo_vida', label: 'Estilo de vida', tipo: 'opcion',
        opciones: op(['sedentario', 'Sedentario'], ['ligero', 'Ligeramente activo'], ['activo', 'Activo'], ['muy_activo', 'Muy activo']),
      },
    ],
  },
  {
    id: 'familiares',
    titulo: '2. Antecedentes heredofamiliares',
    descripcion: 'Marque lo que haya en su familia (padres, hermanos, abuelos).',
    campos: [
      {
        id: 'cardiometabolico', label: 'Enfermedades cardio-metabólicas', tipo: 'multi',
        opciones: op(['diabetes', 'Diabetes mellitus'], ['hipertension', 'Hipertensión arterial'], ['dislipidemia', 'Dislipidemia'],
          ['sindrome_metabolico', 'Síndrome metabólico'], ['infarto_acv', 'Infarto agudo al miocardio o ACV antes de los 60 años (familiar de primer grado)']),
      },
      {
        id: 'neurodegenerativo', label: 'Enfermedades neurodegenerativas', tipo: 'multi',
        opciones: op(['demencia', 'Demencia'], ['alzheimer', 'Enfermedad de Alzheimer'], ['parkinson', 'Parkinson'], ['deterioro_cognitivo', 'Deterioro cognitivo']),
      },
      {
        id: 'oncologico', label: 'Oncología', tipo: 'multi',
        opciones: op(['colon', 'Cáncer de colon'], ['mama', 'Cáncer de mama'], ['prostata', 'Cáncer de próstata'], ['otros_tumores', 'Otros tumores']),
      },
      {
        id: 'autoinmune', label: 'Trastornos autoinmunes e inflamatorios', tipo: 'multi',
        opciones: op(['fibromialgia', 'Fibromialgia'], ['lupus', 'Lupus'], ['artritis_reumatoide', 'Artritis reumatoide'], ['hashimoto', 'Tiroiditis de Hashimoto']),
      },
      { id: 'longevidad_familiar', label: 'Longevidad familiar: familiares centenarios o de edad avanzada libres de enfermedad', tipo: 'sino' },
      { id: 'quien', label: '¿Quién? (madre, padre, hermanos…)', tipo: 'texto', placeholder: 'Opcional' },
    ],
  },
  {
    id: 'nutricion',
    titulo: '3A. Nutrición y salud digestiva',
    campos: [
      {
        id: 'patron', label: 'Patrón de alimentación', tipo: 'opcion',
        opciones: op(['mediterranea', 'Mediterránea'], ['cetogenica', 'Cetogénica'], ['baja_carbohidratos', 'Baja en carbohidratos'], ['antiinflamatoria', 'Antiinflamatoria'], ['normal', 'Normal']),
      },
      {
        id: 'ayuno', label: 'Ayuno o restricción calórica', tipo: 'opcion',
        opciones: op(['no', 'No practico'], ['intermitente', 'Ayuno intermitente'], ['restriccion', 'Restricción calórica']),
      },
      { id: 'ventana', label: 'Ventana de alimentación (horarios)', tipo: 'texto', placeholder: 'Ej. 12:00 a 20:00' },
      { id: 'agua_litros', label: 'Ingesta de agua al día', tipo: 'numero', min: 0, max: 10, paso: 0.5, unidad: 'litros' },
      { id: 'vegetales', label: 'Fibra: porciones de vegetales y verduras al día', tipo: 'numero', min: 0, max: 20, paso: 1, unidad: 'porciones' },
      {
        id: 'digestivos', label: 'Síntomas digestivos', tipo: 'multi',
        opciones: op(['hinchazon', 'Hinchazón'], ['reflujo', 'Reflujo'], ['permeabilidad', 'Sospecha de permeabilidad intestinal'],
          ['estrenimiento', 'Estreñimiento'], ['intolerancia', 'Alguna intolerancia alimentaria']),
      },
      { id: 'intolerancia_detalle', label: 'Intolerancia alimentaria (cuál)', tipo: 'texto', placeholder: 'Opcional' },
      { id: 'evacuaciones_regulares', label: 'Deposiciones regulares', tipo: 'sino' },
    ],
  },
  {
    id: 'actividad',
    titulo: '3B. Actividad física y masa corporal',
    campos: [
      { id: 'fuerza_dias', label: 'Entrenamiento de fuerza', tipo: 'numero', min: 0, max: 7, paso: 1, unidad: 'días por semana' },
      { id: 'fuerza_detalle', label: 'Frecuencia o carga', tipo: 'texto', placeholder: 'Opcional' },
      { id: 'zona2_horas', label: 'Entrenamiento aeróbico (zona 2)', tipo: 'numero', min: 0, max: 40, paso: 0.5, unidad: 'horas por semana' },
      { id: 'zona2_tipo', label: 'Tipo de ejercicio', tipo: 'texto', placeholder: 'Caminata, bicicleta, natación…' },
      { id: 'hiit_veces', label: 'Ejercicio de alta intensidad (VO2 máx.)', tipo: 'numero', min: 0, max: 14, paso: 1, unidad: 'veces por semana' },
      { id: 'masa_muscular_kg', label: 'Masa muscular esquelética (si la conoce)', tipo: 'numero', min: 0, max: 150, paso: 0.1, unidad: 'kg' },
      { id: 'grasa_pct', label: 'Porcentaje de grasa corporal (si lo conoce)', tipo: 'numero', min: 0, max: 80, paso: 0.1, unidad: '%' },
      { id: 'grasa_visceral', label: 'Grasa visceral (si la conoce)', tipo: 'numero', min: 0, max: 60, paso: 1 },
    ],
  },
  {
    id: 'sueno_estres',
    titulo: '3C. Cronobiología, sueño y estrés',
    campos: [
      { id: 'sueno_horas', label: 'Horas de sueño por noche', tipo: 'numero', min: 0, max: 14, paso: 0.5, unidad: 'horas' },
      { id: 'sueno_calidad', label: 'Calidad del sueño', tipo: 'opcion', opciones: op(['profundo', 'Profundo'], ['liviano', 'Liviano'], ['no_duermo', 'No duermo']) },
      { id: 'horarios_regulares', label: 'Me acuesto y me levanto a horas regulares', tipo: 'sino' },
      { id: 'luz_matutina', label: 'Me expongo a la luz solar en la mañana', tipo: 'sino' },
      { id: 'estres', label: 'Nivel de estrés (1 = nada, 10 = máximo)', tipo: 'escala', min: 1, max: 10 },
      {
        id: 'practicas', label: 'Prácticas para manejar el estrés', tipo: 'multi',
        opciones: op(['meditacion', 'Meditación'], ['respiracion', 'Respiración'], ['frio', 'Exposición al frío'], ['calor', 'Exposición al calor / sauna'], ['ninguna', 'Ninguna']),
      },
    ],
  },
  {
    id: 'exposoma',
    titulo: '3D. Exposoma y tóxicos',
    campos: [
      {
        id: 'tabaco', label: 'Tabaquismo / vapeo', tipo: 'opcion',
        opciones: op(['no', 'No fumo'], ['exfumador', 'Exfumador'], ['fuma', 'Fumo'], ['vapeo', 'Vapeo']),
      },
      { id: 'tabaco_detalle', label: 'Años y cantidad', tipo: 'texto', placeholder: 'Ej. 10 años, 5 cigarrillos al día' },
      { id: 'alcohol', label: 'Consumo de alcohol', tipo: 'numero', min: 0, max: 100, paso: 1, unidad: 'unidades por semana' },
      {
        id: 'ambiental', label: 'Exposición ambiental', tipo: 'multi',
        opciones: op(['metales', 'Metales pesados'], ['disruptores', 'Disruptores endocrinos (plásticos, pesticidas)'], ['radiacion', 'Radiación'], ['ninguna', 'Ninguna conocida']),
      },
    ],
  },
  {
    id: 'patologicos',
    titulo: '4. Antecedentes personales patológicos',
    descripcion: 'Las patologías, las alergias y los demás antecedentes del expediente se muestran junto a esta sección.',
    campos: [
      { id: 'cirugias', label: 'Cirugías y hospitalizaciones (fecha y motivo)', tipo: 'textarea', placeholder: 'Ej. 2019 — apendicectomía' },
      {
        id: 'sintomas', label: 'Síntomas actuales', tipo: 'multi',
        opciones: op(['cefalea', 'Dolores de cabeza'], ['cansancio', 'Cansancio'], ['debilidad', 'Debilidad generalizada'], ['nube_mental', 'Niebla mental']),
      },
      { id: 'medicamentos', label: 'Medicamentos actuales: fármacos de prescripción', tipo: 'textarea', placeholder: 'Nombre y dosis, si los recuerda' },
      { id: 'suplementos', label: 'Suplementación actual: nutracéuticos, péptidos o terapias hormonales', tipo: 'textarea' },
      { id: 'peptidos_previos', label: 'He recibido terapia peptídica o terapias hormonales previas', tipo: 'sino' },
      { id: 'peptidos_detalle', label: 'Cuál, por cuánto tiempo y a qué dosis', tipo: 'textarea', placeholder: 'Ej. Semaglutida 0.5 mg semanal por 3 meses' },
      { id: 'otros_tratamientos', label: 'Otros tratamientos estéticos o médicos previos', tipo: 'textarea' },
    ],
  },
];

export type ValorCampo = string | number | boolean | string[] | null | undefined;
export type DatosSeccion = Record<string, ValorCampo>;
export type DatosLongevidad = Record<string, DatosSeccion>;

const vacio = (v: ValorCampo) => v == null || v === '' || (Array.isArray(v) && v.length === 0);

/** Quita campos vacíos (y secciones vacías) para guardar y enviar solo lo contestado. */
export function limpiarLongevidad(d: DatosLongevidad | null | undefined): DatosLongevidad {
  const out: DatosLongevidad = {};
  for (const sec of SECCIONES_LONGEVIDAD) {
    const src = d?.[sec.id];
    if (!src) continue;
    const campos: DatosSeccion = {};
    for (const c of sec.campos) {
      const v = src[c.id];
      if (!vacio(v)) campos[c.id] = v;
    }
    if (Object.keys(campos).length) out[sec.id] = campos;
  }
  return out;
}

export const hayDatosLongevidad = (d: DatosLongevidad | null | undefined) => Object.keys(limpiarLongevidad(d)).length > 0;

const etiquetaOpcion = (c: CampoLongevidad, valor: string) => c.opciones?.find((o) => o.valor === valor)?.label ?? valor;

/** "1 veces por semana" -> "1 vez por semana" (solo las unidades que usa el formulario). */
const singular = (u: string) =>
  u.replace(/^veces\b/, 'vez').replace(/^días\b/, 'día').replace(/^horas\b/, 'hora').replace(/^unidades\b/, 'unidad')
    .replace(/^porciones\b/, 'porción').replace(/^litros\b/, 'litro');

/** Texto legible de un valor según el tipo del campo (para resúmenes y PDF). */
export function textoValor(c: CampoLongevidad, v: ValorCampo): string {
  if (vacio(v)) return '';
  switch (c.tipo) {
    case 'sino': return v === true || v === 'true' ? 'Sí' : 'No';
    case 'opcion': return etiquetaOpcion(c, String(v));
    case 'multi': return (Array.isArray(v) ? v : [String(v)]).map((x) => etiquetaOpcion(c, x)).join(', ');
    case 'numero':
    case 'escala': return `${v}${c.unidad ? ' ' + (Number(v) === 1 ? singular(c.unidad) : c.unidad) : ''}`;
    default: return String(v);
  }
}

/** Líneas "Etiqueta: valor" por sección, solo con lo contestado. */
export function resumenLongevidad(d: DatosLongevidad | null | undefined): { seccion: string; lineas: { label: string; valor: string }[] }[] {
  const limpio = limpiarLongevidad(d);
  return SECCIONES_LONGEVIDAD.flatMap((sec) => {
    const src = limpio[sec.id];
    if (!src) return [];
    const lineas = sec.campos
      .filter((c) => !vacio(src[c.id]))
      .map((c) => ({ label: c.label, valor: textoValor(c, src[c.id]) }));
    return lineas.length ? [{ seccion: sec.titulo, lineas }] : [];
  });
}
