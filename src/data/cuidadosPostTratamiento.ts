/** Recomendaciones post-tratamiento que se envían al paciente por WhatsApp (plantillas editables antes de enviar). */
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
      'No frotes ni masajees la zona tratada durante las primeras 24 horas.',
      'Evita acostarte boca abajo y el ejercicio intenso hasta mañana.',
      'Evita calor extremo (sauna, vapor, sol directo) durante 48 horas.',
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
      'Aplica frío suave (compresa envuelta, nunca hielo directo) 10 minutos cada hora, durante el primer día.',
      'No masajees ni presiones la zona, salvo que la Dra. te lo indique.',
      'Evita ejercicio intenso, alcohol, sauna y sol directo durante 48 horas.',
      'Es normal cierta hinchazón o pequeños moretones durante 3 a 7 días.',
      'Usa protector solar y duerme con la cabeza ligeramente elevada la primera noche.',
    ],
    alarma: ['Dolor intenso o desproporcionado', 'La piel se ve pálida, blanquecina, morada o con manchas', 'Cambios en la visión', 'Ampollas, fiebre o bultos duros y dolorosos'],
    controlDias: 15,
  },
  {
    id: 'alta_cohesion',
    titulo: 'Rellenos de alta cohesión (mentón, mandíbula, pómulos)',
    claves: ['alta cohes', 'mentón', 'menton', 'mandíbula', 'mandibula', 'perfilado', 'contorno'],
    cuidados: [
      'Evita presionar, masajear o apoyar la zona durante 2 semanas.',
      'No te hagas limpiezas faciales profundas ni masajes faciales durante 2 semanas.',
      'Evita ejercicio intenso, calor y alcohol durante 48 horas.',
      'Duerme boca arriba con la cabeza elevada los primeros días.',
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
      'Sigue exactamente las indicaciones de masaje que te dio la Dra. (si te las indicó).',
      'Evita ejercicio intenso, calor y alcohol durante 48 horas.',
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
      'Usa protector solar FPS 50 y reaplícalo cada 3 a 4 horas.',
      'No arranques ni te rasques la piel que se descama: déjala caer sola.',
      'Hidrata la piel varias veces al día con lo que te indicó la Dra.',
      'Evita sol directo, sauna y ejercicio intenso durante 7 días.',
      'No uses ácidos ni retinoides hasta que la Dra. te lo autorice.',
    ],
    alarma: ['Ampollas, costras amarillas o secreción', 'Dolor o ardor intenso que no cede', 'Fiebre'],
    controlDias: 15,
  },
  {
    id: 'peptidos',
    titulo: 'Terapia con péptidos',
    claves: ['péptido', 'peptido', 'bpc', 'semaglut', 'tirzep', 'ipamorelin', 'mod-grf', 'tb-500', 'ghk', 'nad'],
    cuidados: [
      'Conserva el vial en refrigeración (2–8 °C) y protégelo de la luz.',
      'Usa una jeringa nueva en cada aplicación y rota el sitio de inyección.',
      'Aplica exactamente la dosis y los horarios indicados por la Dra.; no la modifiques por tu cuenta.',
      'Un leve enrojecimiento en el punto de inyección es esperable.',
      'Anota cualquier síntoma nuevo para comentarlo en tu control.',
    ],
    alarma: ['Ronchas, hinchazón de labios o cara, o dificultad para respirar', 'Mareo intenso, vómitos o náuseas que no ceden', 'Dolor abdominal fuerte', 'Fiebre o enrojecimiento que se extiende en la zona'],
    controlDias: 15,
  },
  {
    id: 'general',
    titulo: 'Cuidados generales',
    claves: [],
    cuidados: [
      'Sigue las indicaciones que te dio la Dra. en la consulta.',
      'Evita ejercicio intenso, calor extremo y alcohol durante 48 horas.',
      'Usa protector solar a diario.',
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
    `Hola ${primerNombre(nombre)} 👋 Gracias por confiar en la Dra. Mayela González.\n\n` +
    `*Cuidados después de tu tratamiento — ${p.titulo}*\n\n` +
    p.cuidados.map((c) => `• ${c}`).join('\n') +
    `\n\n⚠️ *Escríbenos de inmediato si presentas:*\n` +
    p.alarma.map((a) => `• ${a}`).join('\n') +
    `\n\nEstamos pendientes de ti. 💜`
  );
}

export const mensajeCheck24 = (nombre: string) =>
  `Hola ${primerNombre(nombre)}, ¿cómo amaneciste hoy? 😊 ¿Cómo sientes la zona tratada? Recuerda no masajearla ni exponerla al calor, y usar protector solar. Si notas algo fuera de lo normal, escríbenos por aquí.`;

export const mensajeCheck72 = (nombre: string) =>
  `Hola ${primerNombre(nombre)}, ya pasaron 3 días de tu tratamiento. ¿Cómo vas con la evolución? Un poco de hinchazón o molestia es normal, pero si algo te preocupa o empeora, cuéntanos y lo revisamos.`;

export const mensajeControl = (nombre: string, dias: number) =>
  `Hola ${primerNombre(nombre)}, ya pasaron ${dias} días de tu tratamiento. Es un buen momento para tu cita de control y evaluar si necesitas un retoque. ¿Te agendamos? Responde este mensaje y coordinamos. 💜`;
