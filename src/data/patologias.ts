/** Patologías previas / factores de riesgo estructurados (ayuda a la decisión clínica; la valoración final es de la médica). */
export interface Patologia {
  codigo: string;
  label: string;
  categoria: string;
}

export const CATEGORIAS_PATOLOGIA = [
  { id: 'oncologicas', label: 'Oncológicas' },
  { id: 'cardio', label: 'Cardiovasculares y coagulación' },
  { id: 'endocrino', label: 'Endocrinas y metabólicas' },
  { id: 'inmuno', label: 'Inmunológicas y dermatológicas' },
  { id: 'quirurgicas', label: 'Quirúrgicas e implantes' },
  { id: 'otras', label: 'Otras condiciones' },
] as const;

export const PATOLOGIAS: Patologia[] = [
  { codigo: 'neoplasia_previa', label: 'Neoplasia previa', categoria: 'oncologicas' },
  { codigo: 'neoplasia_activa', label: 'Neoplasia activa o en tratamiento', categoria: 'oncologicas' },
  { codigo: 'tumor_hipofisario', label: 'Tumor hipofisario', categoria: 'oncologicas' },
  { codigo: 'hipertension', label: 'Hipertensión arterial', categoria: 'cardio' },
  { codigo: 'arritmias', label: 'Arritmias', categoria: 'cardio' },
  { codigo: 'trombosis', label: 'Trombosis / tromboembolismo', categoria: 'cardio' },
  { codigo: 'anticoagulantes', label: 'Anticoagulantes o aspirina', categoria: 'cardio' },
  { codigo: 'diabetes_1', label: 'Diabetes tipo 1', categoria: 'endocrino' },
  { codigo: 'diabetes_2', label: 'Diabetes tipo 2', categoria: 'endocrino' },
  { codigo: 'hipotiroidismo', label: 'Hipotiroidismo', categoria: 'endocrino' },
  { codigo: 'hipertiroidismo', label: 'Hipertiroidismo', categoria: 'endocrino' },
  { codigo: 'resistencia_insulina', label: 'Resistencia a la insulina', categoria: 'endocrino' },
  { codigo: 'lupus', label: 'Lupus', categoria: 'inmuno' },
  { codigo: 'artritis', label: 'Artritis / enfermedad autoinmune', categoria: 'inmuno' },
  { codigo: 'queloides', label: 'Queloides / cicatrización hipertrófica', categoria: 'inmuno' },
  { codigo: 'herpes_recurrente', label: 'Herpes facial recurrente', categoria: 'inmuno' },
  { codigo: 'implantes_permanentes', label: 'Implantes permanentes (biopolímeros, silicona líquida)', categoria: 'quirurgicas' },
  { codigo: 'embarazo_lactancia', label: 'Embarazo o lactancia', categoria: 'otras' },
  { codigo: 'enfermedad_wilson', label: 'Enfermedad de Wilson', categoria: 'otras' },
];

const POR_CODIGO = new Map(PATOLOGIAS.map((p) => [p.codigo, p]));
export const etiquetaPatologia = (codigo: string) => POR_CODIGO.get(codigo)?.label ?? codigo;

export type NivelAlerta = 'roja' | 'precaucion';
export interface AlertaClinica { nivel: NivelAlerta; codigo: string; mensaje: string }
/** Tipo de intervención que se está por indicar */
export type ContextoAlerta = 'peptidos' | 'inyectable';

const ONCOLOGICAS = ['neoplasia_previa', 'neoplasia_activa', 'tumor_hipofisario'];

/** Nivel con el que se destaca la patología en la ficha (etiquetas): rojo = alerta mayor. */
export const esAlertaMayor = (codigo: string) => ONCOLOGICAS.includes(codigo) || codigo === 'embarazo_lactancia';

/** Reglas de apoyo a la decisión. Son avisos para valorar, no prohibiciones automáticas. */
export function alertasPara(patologias: string[] | null | undefined, contexto: ContextoAlerta): AlertaClinica[] {
  const set = new Set(patologias ?? []);
  const out: AlertaClinica[] = [];
  const add = (nivel: NivelAlerta, codigo: string, mensaje: string) => { if (set.has(codigo)) out.push({ nivel, codigo, mensaje }); };

  if (contexto === 'peptidos') {
    for (const c of ONCOLOGICAS) {
      add('roja', c, `${etiquetaPatologia(c)}: contraindicación estricta de péptidos secretagogos y de crecimiento. No indicar sin valoración oncológica.`);
    }
    add('roja', 'embarazo_lactancia', 'Embarazo o lactancia: contraindicación absoluta de la terapia con péptidos.');
    add('roja', 'enfermedad_wilson', 'Enfermedad de Wilson: contraindicado el péptido de cobre (GHK-Cu).');
    for (const c of ['diabetes_1', 'diabetes_2', 'resistencia_insulina']) {
      add('precaucion', c, `${etiquetaPatologia(c)}: los secretagogos de GH pueden alterar la glucemia; valorar y monitorizar.`);
    }
  } else {
    for (const c of ONCOLOGICAS) {
      add('precaucion', c, `${etiquetaPatologia(c)}: valorar con el oncólogo antes de infiltrar o aplicar bioestimuladores.`);
    }
    add('roja', 'embarazo_lactancia', 'Embarazo o lactancia: evitar toxina botulínica, rellenos y bioestimuladores.');
    add('precaucion', 'anticoagulantes', 'Anticoagulantes/aspirina: mayor riesgo de hematoma y sangrado; valorar riesgo-beneficio antes de infiltrar.');
    add('precaucion', 'trombosis', 'Antecedente de trombosis: valorar riesgo vascular antes de infiltrar.');
    add('precaucion', 'queloides', 'Queloides o cicatrización hipertrófica: riesgo de mala cicatrización en los puntos de inyección.');
    add('precaucion', 'herpes_recurrente', 'Herpes facial recurrente: considerar profilaxis antiviral antes de tratar la región perioral.');
    add('precaucion', 'implantes_permanentes', 'Implantes permanentes previos: riesgo de reacción o granuloma al aplicar rellenos.');
    for (const c of ['lupus', 'artritis']) {
      add('precaucion', c, `${etiquetaPatologia(c)}: enfermedad autoinmune; valorar antes de bioestimuladores y rellenos.`);
    }
  }
  return out.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'roja' ? -1 : 1));
}
