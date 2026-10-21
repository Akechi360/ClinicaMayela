/** Recomendaciones post-tratamiento que se envían al paciente por WhatsApp (plantillas editables antes de enviar). Trato formal (usted). */
export type CategoriaCuidado = 'toxina' | 'hialuronico' | 'alta_cohesion' | 'bioestimulador' | 'peeling' | 'peptidos' | 'general';

export interface PlantillaCuidado {
  id: CategoriaCuidado;
  titulo: string;
  /** Palabras (en minúscula) que sirven para deducir la categoría desde el nombre del tratamiento */
  claves: string[];
  cuidados: string[];
  alarma: string[];
  /** Días sugeridos para el control / retoque (null = sin control sugerido) */
  controlDias: number | null;
}

export const PLANTILLAS_CUIDADO: PlantillaCuidado[] = [
  {
    id: 'toxina',
    titulo: 'Toxina botulínica',
    claves: ['toxina', 'botox', 'botul', 'dysport', 'xeomin'],
    cuidados: [
      'No frote ni masajee la zona tratada durante las primeras 24 horas.',
      'Evite acostarse boca abajo y el ejercicio intenso hasta mañana.',
      'Evite el calor extremo (sauna, vapor, sol directo) durante 48 horas.',
      'El efecto aparece entre los días 3 y 7 y alcanza su máximo a los 14 días.',
    ],
    alarma: ['Caída marcada del párpado', 'Visión doble o dificultad para tragar o respirar', 'Ronchas, picazón intensa o hinchazón de la cara'],
    controlDias: 15,
  },
  {
    id: 'hialuronico',
    titulo: 'Ácido hialurónico (labios, pómulos y surcos)',
    claves: ['hialur', 'labio', 'relleno', 'surco', 'ojera', 'pómulo', 'pomulo', 'filler'],
    cuidados: [
      'Aplique frío suave (compresa envuelta, nunca hielo directo) 10 minutos cada hora, durante el primer día.',
      'No masajee ni presione la zona, salvo que la Dra. se lo indique.',
      'Evite el ejercicio intenso, el alcohol, la sauna y el sol directo durante 48 horas.',
      'Es normal cierta hinchazón o pequeños moretones durante 3 a 7 días.',
      'Use protector solar y duerma con la cabeza ligeramente elevada la primera noche.',
    ],
    alarma: ['Dolor intenso o desproporcionado', 'La piel se ve pálida, blanquecina, morada o con manchas', 'Cambios en la visión', 'Ampollas, fiebre o bultos duros y dolorosos'],
    controlDias: 15,
  },
  {
    id: 'alta_cohesion',
    titulo: 'Rellenos de alta cohesión (mentón, mandíbula, pómulos)',
    claves: ['alta cohes', 'mentón', 'menton', 'mandíbula', 'mandibula', 'perfilado', 'contorno'],
    cuidados: [
      'Evite presionar, masajear o apoyar la zona durante 2 semanas.',
      'No se realice limpiezas faciales profundas ni masajes faciales durante 2 semanas.',
      'Evite el ejercicio intenso, el calor y el alcohol durante 48 horas.',
      'Duerma boca arriba con la cabeza elevada los primeros días.',
      'La hinchazón disminuye de forma progresiva en 1 a 2 semanas.',
    ],
    alarma: ['Dolor intenso que aumenta', 'Cambio de color de la piel (pálida o violácea)', 'Fiebre, calor o secreción en la zona', 'Cambios en la visión'],
    controlDias: 15,
  },
  {
    id: 'bioestimulador',
    titulo: 'Bioestimuladores de colágeno',
    claves: ['bioestim', 'colágeno', 'colageno', 'sculptra', 'radiesse', 'exosoma', 'plla'],
    cuidados: [
      'Siga exactamente las indicaciones de masaje que le dio la Dra. (si se las indicó).',
      'Evite el ejercicio intenso, el calor y el alcohol durante 48 horas.',
      'Es normal una leve inflamación o sensibilidad los primeros días.',
      'Los resultados se desarrollan de forma gradual durante las semanas siguientes.',
    ],
    alarma: ['Dolor intenso o creciente', 'Nódulos duros, enrojecidos o dolorosos', 'Fiebre o secreción', 'Cambios en la visión'],
    controlDias: 30,
  },
  {
    id: 'peeling',
    titulo: 'Peeling',
    claves: ['peeling', 'peel', 'exfol'],
    cuidados: [
      'Use protector solar FPS 50 y reaplíquelo cada 3 a 4 horas.',
      'No arranque ni rasque la piel que se descama: déjela caer sola.',
      'Hidrate la piel varias veces al día con lo que le indicó la Dra.',
      'Evite el sol directo, la sauna y el ejercicio intenso durante 7 días.',
      'No utilice ácidos ni retinoides hasta que la Dra. lo autorice.',
    ],
    alarma: ['Ampollas, costras amarillas o secreción', 'Dolor o ardor intenso que no cede', 'Fiebre'],
    controlDias: 15,
  },
  {
    id: 'peptidos',
    titulo: 'Terapia con péptidos',
    claves: ['péptido', 'peptido', 'bpc', 'semaglut', 'tirzep', 'ipamorelin', 'mod-grf', 'tb-500', 'ghk', 'nad'],
    cuidados: [
      'Conserve el vial en refrigeración (2–8 °C) y protéjalo de la luz.',
      'Use una jeringa nueva en cada aplicación y rote el sitio de inyección.',
      'Aplique exactamente la dosis y los horarios indicados por la Dra.; no la modifique por su cuenta.',
      'Un leve enrojecimiento en el punto de inyección es esperable.',
      'Anote cualquier síntoma nuevo para comentarlo en su control.',
    ],
    alarma: ['Ronchas, hinchazón de labios o cara, o dificultad para respirar', 'Mareo intenso, vómitos o náuseas que no ceden', 'Dolor abdominal fuerte', 'Fiebre o enrojecimiento que se extiende en la zona'],
    controlDias: 15,
  },
  {
    id: 'general',
    titulo: 'Cuidados generales',
    claves: [],
    cuidados: [
      'Siga las indicaciones que le dio la Dra. en la consulta.',
      'Evite el ejercicio intenso, el calor extremo y el alcohol durante 48 horas.',
      'Use protector solar a diario.',
    ],
    alarma: ['Dolor intenso o que va en aumento', 'Fiebre', 'Cambios en la piel de la zona tratada'],
    controlDias: null,
  },
];

export const plantillaDe = (id: CategoriaCuidado): PlantillaCuidado => PLANTILLAS_CUIDADO.find((p) => p.id === id) ?? PLANTILLAS_CUIDADO[PLANTILLAS_CUIDADO.length - 1];

/** Deduce la categoría desde el nombre del tratamiento o producto ('general' si no hay coincidencia). */
export function categoriaPorTratamiento(texto?: string | null): CategoriaCuidado {
  const t = (texto ?? '').toLowerCase();
  if (!t) return 'general';
  const hit = PLANTILLAS_CUIDADO.find((p) => p.claves.some((k) => t.includes(k)));
  return hit?.id ?? 'general';
}

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] || 'paciente';

export function mensajeCuidados(nombre: string, cat: CategoriaCuidado): string {
  const p = plantillaDe(cat);
  return (
    `Estimado(a) ${primerNombre(nombre)}, gracias por confiar en la Dra. Mayela González.\n\n` +
    `*Cuidados posteriores a su tratamiento — ${p.titulo}*\n\n` +
    p.cuidados.map((c) => `• ${c}`).join('\n') +
    `\n\n⚠️ *Comuníquese con nosotros de inmediato si presenta:*\n` +
    p.alarma.map((a) => `• ${a}`).join('\n') +
    `\n\nEstamos atentos a su evolución.`
  );
}

export const mensajeCheck24 = (nombre: string) =>
  `Estimado(a) ${primerNombre(nombre)}, buenos días. ¿Cómo se siente hoy? ¿Cómo evoluciona la zona tratada? Le recordamos no masajearla ni exponerla al calor, y usar protector solar. Si nota algo fuera de lo normal, escríbanos por este medio.`;

export const mensajeCheck72 = (nombre: string) =>
  `Estimado(a) ${primerNombre(nombre)}, han transcurrido 3 días desde su tratamiento. ¿Cómo va su evolución? Un poco de hinchazón o molestia es normal, pero si algo le preocupa o empeora, cuéntenos y lo revisamos.`;

export const mensajeControl = (nombre: string, dias: number) =>
  `Estimado(a) ${primerNombre(nombre)}, han transcurrido ${dias} días desde su tratamiento. Es un buen momento para su cita de control y evaluar si necesita un retoque. ¿Desea que le agendemos? Responda a este mensaje y lo coordinamos.`;
