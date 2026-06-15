import type { Paciente, Tratamiento, Cita, HistorialClinico, Transaccion, CitaRelacional, HistorialClinicoRelacional, TransaccionRelacional, DoctorProfile, ClinicSettings, ExamenLaboratorio, RecipeMedico } from '../types/database.types';

// Claves de LocalStorage
const KEYS = {
  PACIENTES: 'rejuvenece_pacientes',
  TRATAMIENTOS: 'rejuvenece_tratamientos',
  CITAS: 'rejuvenece_citas',
  HISTORIALES: 'rejuvenece_historiales',
  TRANSACCIONES: 'rejuvenece_transacciones',
  DOCTOR: 'rejuvenece_doctor_profile',
  CLINIC_SETTINGS: 'rejuvenece_clinic_settings',
  EXAMENES: 'rejuvenece_examenes',
  RECIPES: 'rejuvenece_recipes',
};

// Delay artificial para simular asincronía de Supabase (ms)
const API_DELAY = 150;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Datos semilla iniciales
const SEMILLA_TRATAMIENTOS: Tratamiento[] = [
  {
    id: 't-1',
    nombre: 'Toxina Botulínica (Botox)',
    descripcion: 'Tratamiento de arrugas de expresión en frente, glabela y patas de gallo.',
    precio: 450,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-01').toISOString()
  },
  {
    id: 't-2',
    nombre: 'Ácido Hialurónico Labios',
    descripcion: 'Perfilado y volumen de labios con técnica rusa o clásica.',
    precio: 380,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-02').toISOString()
  },
  {
    id: 't-3',
    nombre: 'Marcación Mandibular y Mentón',
    descripcion: 'Armonización del contorno mandibular y proyección de mentón.',
    precio: 1850,
    duracion_minutos: 60,
    creado_en: new Date('2026-01-03').toISOString()
  },
  {
    id: 't-4',
    nombre: 'Peeling Químico Médico',
    descripcion: 'Renovación celular profunda para manchas, acné y luminosidad.',
    precio: 150,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-04').toISOString()
  },
  {
    id: 't-5',
    nombre: 'Radiesse (Bioestimulador)',
    descripcion: 'Inducción de colágeno para combatir la flacidez y dar volumen sutil.',
    precio: 650,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-05').toISOString()
  },
  {
    id: 't-6',
    nombre: 'Endoláser Facial',
    descripcion: 'Lifting facial asistido por láser diodo no invasivo.',
    precio: 1200,
    duracion_minutos: 90,
    creado_en: new Date('2026-01-06').toISOString()
  },
  {
    id: 't-7',
    nombre: 'Armonizacion Facial',
    descripcion: 'Tratamiento facial de armonización estética.',
    precio: 600,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-8',
    nombre: 'Adipoestructuración Facial',
    descripcion: 'Remodelación y estructuración de la grasa facial.',
    precio: 750,
    duracion_minutos: 60,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-9',
    nombre: 'Limpieza de cutis',
    descripcion: 'Higiene facial profunda con extracción e hidratación.',
    precio: 80,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-10',
    nombre: 'Rejuvenecimiento facial inteligente',
    descripcion: 'Tratamiento inteligente adaptado a las necesidades celulares de la piel.',
    precio: 500,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-11',
    nombre: 'Hilos tensores aptos',
    descripcion: 'Lifting biológico sin cirugía mediante hilos tensores reabsorbibles.',
    precio: 900,
    duracion_minutos: 60,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-12',
    nombre: 'Bioestimuladores',
    descripcion: 'Inductores de colágeno para recuperar firmeza y elasticidad.',
    precio: 650,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-13',
    nombre: 'Polirevitalizantes',
    descripcion: 'Cocktail de vitaminas, aminoácidos y minerales para nutrir la dermis.',
    precio: 300,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-14',
    nombre: 'Blending Faciales',
    descripcion: 'Mezcla sinérgica de activos adaptada para un brillo inmediato.',
    precio: 350,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-15',
    nombre: 'Exomas',
    descripcion: 'Terapia molecular facial regeneradora avanzada.',
    precio: 450,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-16',
    nombre: 'Antienvejecimiento',
    descripcion: 'Tratamiento facial preventivo contra el envejecimiento biológico.',
    precio: 400,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-17',
    nombre: 'Ellanse (Bioestimulador de colágeno)',
    descripcion: 'Bioestimulador de colágeno y relleno autólogo de larga duración.',
    precio: 850,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-18',
    nombre: 'Hidroxiapatita (Bioestimulador de colágeno)',
    descripcion: 'Tratamiento inductor de colágeno con hidroxiapatita de calcio.',
    precio: 750,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-19',
    nombre: 'Rich (Bioestimulador de colágeno)',
    descripcion: 'Hidratación y estimulación cutánea profunda.',
    precio: 480,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-20',
    nombre: 'Reversal neo (Bioestimulador de colágeno)',
    descripcion: 'Regeneración y reposición de volumen de efecto natural.',
    precio: 550,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-21',
    nombre: 'Pink (Polirevitalizante)',
    descripcion: 'Terapia de hidratación profunda y efecto glow rosado.',
    precio: 250,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-22',
    nombre: 'Amber (Polirevitalizante)',
    descripcion: 'Acción succínica y ácido hialurónico contra el fotoenvejecimiento.',
    precio: 280,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-23',
    nombre: 'Orquid (Polirevitalizante)',
    descripcion: 'Revitalizante e hidratante para pieles deshidratadas.',
    precio: 260,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-24',
    nombre: 'Cristal healer (Polirevitalizante)',
    descripcion: 'Nutrición celular y efecto de suavidad de cristal.',
    precio: 300,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-25',
    nombre: 'Polinucleotidos (Polirevitalizante)',
    descripcion: 'Reparador de tejido dérmico con polinucleótidos bioactivos.',
    precio: 380,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-26',
    nombre: 'Mesoheal (Polirevitalizante)',
    descripcion: 'Mesoterapia revitalizante de efecto tensor y regenerador.',
    precio: 290,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-27',
    nombre: 'Lips soom (Labios)',
    descripcion: 'Hidratación y volumen labial exclusivo.',
    precio: 320,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-28',
    nombre: 'Labios ac hialurónico Cristal',
    descripcion: 'Modelado y voluminización labial con ácido hialurónico de alta gama.',
    precio: 390,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-29',
    nombre: 'Técnica 4 puntos nariz',
    descripcion: 'Rinomodelación no quirúrgica mediante puntos estratégicos de soporte.',
    precio: 450,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-30',
    nombre: 'Armonizacion Facial Técnica 4 puntos malar mandibula',
    descripcion: 'Proyección mandibular y definición de pómulos mediante puntos fijos.',
    precio: 890,
    duracion_minutos: 60,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-31',
    nombre: 'Peeling',
    descripcion: 'Exfoliación médica y peeling para renovación de capas de la piel.',
    precio: 130,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-32',
    nombre: 'Tratamiento exosomas',
    descripcion: 'Terapia regenerativa y antiinflamatoria celular con exosomas.',
    precio: 420,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-33',
    nombre: 'Exosomas capilares',
    descripcion: 'Regeneración y bioestimulación capilar contra la alopecia.',
    precio: 480,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-34',
    nombre: 'Depilación laser',
    descripcion: 'Remoción definitiva del vello mediante tecnología láser.',
    precio: 90,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-35',
    nombre: 'Quemadores de grasa',
    descripcion: 'Tratamiento lipolítico localizado.',
    precio: 160,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-36',
    nombre: 'Sueroterapia',
    descripcion: 'Infusiones endovenosas para revitalización y desintoxicación.',
    precio: 200,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-37',
    nombre: 'Corporales: Indiba',
    descripcion: 'Radiofrecuencia Indiba para reafirmación y modelado corporal.',
    precio: 120,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-38',
    nombre: 'Corporales: Carboxiterapia',
    descripcion: 'Infusión subcutánea de CO2 contra la grasa localizada y celulitis.',
    precio: 95,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-39',
    nombre: 'Corporales: Ultracavitacion',
    descripcion: 'Ultrasonidos de alta potencia para romper adipocitos rebeldes.',
    precio: 110,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-40',
    nombre: 'Corporales: Radiofrecuencia',
    descripcion: 'Radiofrecuencia reafirmante corporal.',
    precio: 100,
    duracion_minutos: 45,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-41',
    nombre: 'Péptidos metabólicos (tirzapatida o mountjaro)',
    descripcion: 'Control metabólico y reducción ponderal asistida.',
    precio: 350,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-42',
    nombre: 'Péptidos longevidad: G',
    descripcion: 'Fórmula peptídica de longevidad regeneradora.',
    precio: 180,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-43',
    nombre: 'Péptidos longevidad: Ghc ku',
    descripcion: 'Tratamiento de antienvejecimiento celular celular.',
    precio: 190,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-44',
    nombre: 'Péptidos longevidad: Glow',
    descripcion: 'Péptidos para la luminosidad e hidratación a nivel celular.',
    precio: 190,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-45',
    nombre: 'Péptidos longevidad: Most c',
    descripcion: 'Terapia con péptidos para la renovación celular.',
    precio: 200,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-46',
    nombre: 'Péptidos longevidad: Telomerasa',
    descripcion: 'Tratamiento antienvejecimiento celular inhibidor de telómeros.',
    precio: 280,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-47',
    nombre: 'Recuperación: Bpc157+tb 500',
    descripcion: 'Terapia peptídica regeneradora y antiinflamatoria sistémica.',
    precio: 240,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-48',
    nombre: 'Inmunológicos',
    descripcion: 'Suplementación de soporte e inmunorregulación avanzada.',
    precio: 220,
    duracion_minutos: 30,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-49',
    nombre: 'Oxigenadores: Semax',
    descripcion: 'Péptido regulador neuroprotector y de oxigenación.',
    precio: 150,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-50',
    nombre: 'Sexuales: Pt151',
    descripcion: 'Tratamiento peptídico para disfunciones y vitalidad sexual.',
    precio: 230,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-51',
    nombre: 'Hormonales gym: Cj1295+ipamorelin',
    descripcion: 'Estimulador de la liberación de hormona de crecimiento.',
    precio: 300,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  },
  {
    id: 't-52',
    nombre: 'Hormonales gym: Tesamorelin',
    descripcion: 'Péptido específico para quema de grasa visceral y definición muscular.',
    precio: 340,
    duracion_minutos: 15,
    creado_en: new Date('2026-01-07').toISOString()
  }
];

const SEMILLA_PACIENTES: Paciente[] = [
  {
    id: 'p-1',
    nombre: 'Elena Rostova',
    telefono: '+34 600 123 456',
    email: 'elena.rostova@luxury.com',
    fecha_nacimiento: '1988-04-12',
    genero: 'Femenino',
    antecedentes: 'Sin enfermedades crónicas. No fuma.',
    alergias: 'Ninguna conocida.',
    es_vip: true,
    creado_en: new Date('2026-02-15').toISOString()
  },
  {
    id: 'p-2',
    nombre: 'Camila Flores',
    telefono: '+34 655 987 654',
    email: 'camila.flores@example.com',
    fecha_nacimiento: '1995-09-23',
    genero: 'Femenino',
    antecedentes: 'Piel sensible con rosácea leve.',
    alergias: 'Alergia al polen.',
    es_vip: false,
    creado_en: new Date('2026-03-10').toISOString()
  },
  {
    id: 'p-3',
    nombre: 'Roberto Vega',
    telefono: '+3Spain 611 222 333',
    email: 'roberto.vega@salud.es',
    fecha_nacimiento: '1980-11-05',
    genero: 'Masculino',
    antecedentes: 'Hipertensión controlada.',
    alergias: 'Alergia a la penicilina.',
    es_vip: false,
    creado_en: new Date('2026-03-25').toISOString()
  },
  {
    id: 'p-4',
    nombre: 'Lucía Sánchez',
    telefono: '+34 633 444 555',
    email: 'lucia.sanchez@gmail.com',
    fecha_nacimiento: '1992-07-30',
    genero: 'Femenino',
    antecedentes: 'Embarazos previos: 1. Lactancia finalizada.',
    alergias: 'Alergia al níquel.',
    es_vip: false,
    creado_en: new Date('2026-04-01').toISOString()
  }
];

// Obtener fecha actual para simular la agenda de hoy
const hoy = new Date();
const formatearFechaHora = (diasOffset: number, hora: number, minutos: number) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + diasOffset);
  d.setHours(hora, minutos, 0, 0);
  return d.toISOString();
};

const SEMILLA_CITAS: Cita[] = [
  // Citas pasadas para el historial
  {
    id: 'c-1',
    paciente_id: 'p-1',
    tratamiento_id: 't-3', // Marcación Mandibular
    fecha_hora: formatearFechaHora(-15, 11, 0),
    estado: 'confirmado',
    notas: 'Marcación mandibular bilateral. Paciente muy satisfecha en citas previas.',
    creado_en: formatearFechaHora(-20, 10, 0)
  },
  {
    id: 'c-2',
    paciente_id: 'p-1',
    tratamiento_id: 't-2', // Labios
    fecha_hora: formatearFechaHora(-45, 17, 30),
    estado: 'confirmado',
    notas: 'Relleno de labios técnica rusa. Busca perfilado y volumen medio.',
    creado_en: formatearFechaHora(-50, 12, 0)
  },
  // Citas de hoy
  {
    id: 'c-3',
    paciente_id: 'p-2',
    tratamiento_id: 't-1', // Botox
    fecha_hora: formatearFechaHora(0, 9, 0),
    estado: 'confirmado',
    notas: 'Tercio superior. Control de arrugas frontales.',
    creado_en: formatearFechaHora(-5, 10, 30)
  },
  {
    id: 'c-4',
    paciente_id: 'p-3',
    tratamiento_id: 't-2', // Labios (Ácido Hialurónico)
    fecha_hora: formatearFechaHora(0, 10, 30),
    estado: 'en_sala',
    notas: 'Retoque e hidratación ligera en labios.',
    creado_en: formatearFechaHora(-2, 14, 0)
  },
  {
    id: 'c-5',
    paciente_id: 'p-4',
    tratamiento_id: 't-4', // Peeling
    fecha_hora: formatearFechaHora(0, 12, 0),
    estado: 'pendiente',
    notas: 'Peeling iluminador post-acné.',
    creado_en: formatearFechaHora(-1, 9, 15)
  },
  // Citas futuras
  {
    id: 'c-6',
    paciente_id: 'p-1',
    tratamiento_id: 't-1', // Botox futuro
    fecha_hora: formatearFechaHora(1, 10, 0),
    estado: 'confirmado',
    notas: 'Sesión de mantenimiento de toxina botulínica en tercio superior.',
    creado_en: formatearFechaHora(-3, 11, 0)
  },
  {
    id: 'c-7',
    paciente_id: 'p-3',
    tratamiento_id: 't-5', // Radiesse
    fecha_hora: formatearFechaHora(3, 16, 0),
    estado: 'confirmado',
    notas: 'Bioestimulación colágena en tercio medio e inferior.',
    creado_en: formatearFechaHora(-4, 15, 0)
  }
];

const SEMILLA_HISTORIALES: HistorialClinico[] = [
  {
    id: 'h-1',
    paciente_id: 'p-1',
    cita_id: 'c-1',
    fecha: new Date(formatearFechaHora(-15, 11, 0)).toISOString().split('T')[0],
    tratamiento_id: 't-3',
    producto: 'Juvéderm Volux XC',
    cantidad: '3.0 ml total (1.5ml por lado)',
    lote: 'JVX-998822',
    tecnica: 'Cánula sobre periostio',
    notas_medicas: 'Marcación mandibular bien definida. Se aplicaron 1.5 ml en cada ángulo mandibular. Paciente toleró muy bien el procedimiento. Zonas de inyección desinfectadas y masajeadas levemente.',
    mapa_facial_coordenadas: [
      { x: 38, y: 72, dosis: 1.5, producto: 'Juvéderm Volux XC' },
      { x: 62, y: 72, dosis: 1.5, producto: 'Juvéderm Volux XC' }
    ],
    foto_antes: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTkLwynBv1NhFsfnBlP91NLPacWVLko2Na-BY4BfbvGeJuJZKRQybmh87xMTZMyJULVBtawP3ZaVZCZV2h8H5q29XBE7iE2ltTeQnhfP4h47-KPe_Cyp9wK46tpeJlx4ZyiFfDvAIxDSi0XgXEOO8RAqCwOsZStejnBRRs0awdWazl_J9yBWugLT1IZSdcOyvsjrAq5O7A8F3XXCiTYckKPBu9e96BdOZxne5npadQEnMDICCsGmMmXLXIgGpB0fEmaum4rGX1gQI',
    foto_despues: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6sbBViHOkG3r0VYZgTJxspzMfz-xcEh9EVoRpvkzwRCeQIu_b941DwYFBiNRRtp92ukcCHqA5gBI2h4re401aLOHibZakAWqiVjsbFfK9cb0msvh2tPqWTocytztxMoiPnI-JDqWmrxGHZXfLoXvvvo0PY0vYJNcYLNpZkOTthjj56wNxZ_I5AQFwT64ELQqWR_zkP878QtEpDunZxeq2ETu85BhZCmoZZPCyscfWgDk_bsRtjzBTHerSGJfUlsZRJzrqiygHyfU',
    creado_en: formatearFechaHora(-15, 12, 0)
  },
  {
    id: 'h-2',
    paciente_id: 'p-1',
    cita_id: 'c-2',
    fecha: new Date(formatearFechaHora(-45, 17, 30)).toISOString().split('T')[0],
    tratamiento_id: 't-2',
    producto: 'Restylane Kysse',
    cantidad: '1.0 ml',
    lote: 'RK-771190',
    tecnica: 'Puntos lineales verticales',
    notas_medicas: 'Aumento labial con técnica rusa. Excelente definición del arco de cupido y eversión del labio superior sin proyección excesiva (evitando labios de pato). Control a las dos semanas sin incidencias.',
    mapa_facial_coordenadas: [
      { x: 50, y: 64, dosis: 0.5, producto: 'Restylane Kysse' },
      { x: 50, y: 67, dosis: 0.5, producto: 'Restylane Kysse' }
    ],
    foto_antes: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA89avSxRbYSCdCIye1KEZnWX_M8dly-VxhU3cyt3PkRCsUQcBYtbqKoUeSyUMl5zKet84SpwS6uJXwBmTIPO4219KXhr7-EP6RII_GZOYtuhthWKZwxi3F6jQAnbzd0wkATdZ4lXPvQ5zzMAhdk-gCmxru0qH3AO-ERy1C0d2PLs597j4ff9MPgRvbT1yE8M13UACN6PyXxHFJMDMhnjDr8S0eJRHTIAuMiVXUugxV6IexP5Q6kPsqpnT6F7--hseYABtK9k8JSo8',
    foto_despues: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-fF4FV6tLMllrPVXhQV49kpAAFa4hTeOQ6sGoUAV32JbjbDJz6z7-LJqNWj8YOMuFtpw83RReVDPsEfuhCXiaAbLT2qE_TtKIeztYrQ3dlBYSM4vdZ1NLbxRN1rDYhivasdvJyyAz3nIHSfmTKKENS0P6rS34oiU2-i-QgmhE2ROyiYgmFOsNsJDSQKvaMHqe6K3WAL8VqRNDG_60aO_deZzXOZQatb5b7DdJgUHUCy12Lmzx6r_-jHoHSUdKrGTTrN1AP6rxz20',
    creado_en: formatearFechaHora(-45, 18, 30)
  }
];

const SEMILLA_TRANSACCIONES: Transaccion[] = [
  {
    id: 'tr-1',
    paciente_id: 'p-1',
    cita_id: 'c-1',
    fecha: new Date(formatearFechaHora(-15, 12, 0)).toISOString().split('T')[0],
    monto: 1850,
    estado: 'completado',
    metodo_pago: 'tarjeta',
    creado_en: formatearFechaHora(-15, 12, 0)
  },
  {
    id: 'tr-2',
    paciente_id: 'p-1',
    cita_id: 'c-2',
    fecha: new Date(formatearFechaHora(-45, 18, 30)).toISOString().split('T')[0],
    monto: 380,
    estado: 'completado',
    metodo_pago: 'efectivo',
    creado_en: formatearFechaHora(-45, 18, 30)
  },
  // Transacciones de hoy (simuladas en base al progreso de citas)
  {
    id: 'tr-3',
    paciente_id: 'p-2',
    cita_id: 'c-3',
    fecha: new Date(formatearFechaHora(0, 9, 30)).toISOString().split('T')[0],
    monto: 450,
    estado: 'completado',
    metodo_pago: 'tarjeta',
    creado_en: formatearFechaHora(0, 9, 30)
  },
  {
    id: 'tr-4',
    paciente_id: 'p-4',
    cita_id: 'c-5',
    fecha: new Date(formatearFechaHora(0, 12, 30)).toISOString().split('T')[0],
    monto: 150,
    estado: 'pendiente',
    metodo_pago: 'efectivo',
    creado_en: formatearFechaHora(0, 12, 30)
  }
];

// Inicialización de la base de datos
export const inicializarDB = () => {
  if (!localStorage.getItem(KEYS.PACIENTES)) {
    localStorage.setItem(KEYS.PACIENTES, JSON.stringify(SEMILLA_PACIENTES));
  }
  if (!localStorage.getItem(KEYS.TRATAMIENTOS) || JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]').length < 10) {
    localStorage.setItem(KEYS.TRATAMIENTOS, JSON.stringify(SEMILLA_TRATAMIENTOS));
  }
  if (!localStorage.getItem(KEYS.CITAS)) {
    localStorage.setItem(KEYS.CITAS, JSON.stringify(SEMILLA_CITAS));
  }
  if (!localStorage.getItem(KEYS.HISTORIALES)) {
    localStorage.setItem(KEYS.HISTORIALES, JSON.stringify(SEMILLA_HISTORIALES));
  }
  if (!localStorage.getItem(KEYS.TRANSACCIONES)) {
    localStorage.setItem(KEYS.TRANSACCIONES, JSON.stringify(SEMILLA_TRANSACCIONES));
  }
  if (!localStorage.getItem(KEYS.DOCTOR)) {
    const semillaDoctor: DoctorProfile = {
      id: 'doc-1',
      nombre: 'Dra. Mayela González',
      especialidad: 'Medicina Estética & Bienestar',
      cedula: '12345678-A',
      email: 'contacto@rejuvenecemayela.com',
      telefono: '+34 600 999 888',
      foto_perfil: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKjS5i-riOBcVgFNnseY1IRnnqVypzEjBUkXkBg0mjrgCwcOaYqpY2n94ywToDTuGf7j9F-kBWzWB2yiJwHSpIsKiamoCVdIZM7KBz6gc4ugcQ-48g8brWW5T8TZ-Q4ogkIaKVv9CbWgYQuMLnP2WJzM1LZ1hjqVC1Q2Xh0PTGBOy5y6TQ9jNQpt_1TvBu-Ag2hUPkL9pjR3XVDZXnxF8AtZ5w9Vu2IKFWNgKD_HbqnLk6ldR45Oh1q7bKeExBlECNUL8BeqZeIJ8',
      biografia: 'Médica especialista en medicina estética facial avanzada y rejuvenecimiento integral.',
      horario: 'Lunes a Viernes de 9:00 a 18:30',
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com/dra.mayelagonzalez',
      mpps: 'MPPS-98765',
      col: 'COL-12345'
    };
    localStorage.setItem(KEYS.DOCTOR, JSON.stringify(semillaDoctor));
  }
  if (!localStorage.getItem(KEYS.CLINIC_SETTINGS)) {
    const semillaClinicSettings: ClinicSettings = {
      id: 'settings-1',
      bot_activo: false,
      bot_conectado: false,
      bot_qr_base64: null,
      hora_recordatorio: '09:00:00',
      mensaje_bienvenida: '👋 Hola, soy el asistente de *Clínica Mayela*. ¿En qué te puedo ayudar?'
    };
    localStorage.setItem(KEYS.CLINIC_SETTINGS, JSON.stringify(semillaClinicSettings));
  }
  if (!localStorage.getItem(KEYS.EXAMENES)) {
    localStorage.setItem(KEYS.EXAMENES, JSON.stringify([]));
  }
  if (!localStorage.getItem(KEYS.RECIPES)) {
    localStorage.setItem(KEYS.RECIPES, JSON.stringify([]));
  }
};

// --- MOTOR CRUD PACIENTES ---
export const dbPacientes = {
  listar: async (): Promise<Paciente[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    return JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
  },
  obtener: async (id: string): Promise<Paciente | null> => {
    await sleep(API_DELAY);
    inicializarDB();
    const pacientes: Paciente[] = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    return pacientes.find(p => p.id === id) || null;
  },
  insertar: async (paciente: Omit<Paciente, 'id' | 'creado_en'>): Promise<Paciente> => {
    await sleep(API_DELAY);
    inicializarDB();
    const pacientes: Paciente[] = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    const nuevo: Paciente = {
      ...paciente,
      id: 'p-' + Math.random().toString(36).substr(2, 9),
      creado_en: new Date().toISOString()
    };
    pacientes.push(nuevo);
    localStorage.setItem(KEYS.PACIENTES, JSON.stringify(pacientes));
    return nuevo;
  },
  actualizar: async (id: string, datos: Partial<Paciente>): Promise<Paciente> => {
    await sleep(API_DELAY);
    inicializarDB();
    const pacientes: Paciente[] = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    const index = pacientes.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Paciente no encontrado');
    pacientes[index] = { ...pacientes[index], ...datos };
    localStorage.setItem(KEYS.PACIENTES, JSON.stringify(pacientes));
    return pacientes[index];
  },
  eliminar: async (id: string): Promise<boolean> => {
    await sleep(API_DELAY);
    inicializarDB();
    const pacientes: Paciente[] = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    const filtrados = pacientes.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PACIENTES, JSON.stringify(filtrados));
    return true;
  }
};

// --- MOTOR CRUD TRATAMIENTOS ---
export const dbTratamientos = {
  listar: async (): Promise<Tratamiento[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    return JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]');
  },
  insertar: async (tratamiento: Omit<Tratamiento, 'id' | 'creado_en'>): Promise<Tratamiento> => {
    await sleep(API_DELAY);
    inicializarDB();
    const tratamientos: Tratamiento[] = JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]');
    const nuevo: Tratamiento = {
      ...tratamiento,
      id: 't-' + Math.random().toString(36).substr(2, 9),
      creado_en: new Date().toISOString()
    };
    tratamientos.push(nuevo);
    localStorage.setItem(KEYS.TRATAMIENTOS, JSON.stringify(tratamientos));
    return nuevo;
  },
  actualizar: async (id: string, datos: Partial<Tratamiento>): Promise<Tratamiento> => {
    await sleep(API_DELAY);
    inicializarDB();
    const tratamientos: Tratamiento[] = JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]');
    const index = tratamientos.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tratamiento no encontrado');
    tratamientos[index] = { ...tratamientos[index], ...datos };
    localStorage.setItem(KEYS.TRATAMIENTOS, JSON.stringify(tratamientos));
    return tratamientos[index];
  }
};

// --- MOTOR CRUD CITAS ---
export const dbCitas = {
  listar: async (): Promise<CitaRelacional[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    const citas: Cita[] = JSON.parse(localStorage.getItem(KEYS.CITAS) || '[]');
    const pacientes = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    const tratamientos = JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]');

    return citas.map(cita => ({
      ...cita,
      paciente: pacientes.find((p: Paciente) => p.id === cita.paciente_id),
      tratamiento: tratamientos.find((t: Tratamiento) => t.id === cita.tratamiento_id)
    })).sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
  },
  insertar: async (cita: Omit<Cita, 'id' | 'creado_en'>): Promise<CitaRelacional> => {
    await sleep(API_DELAY);
    inicializarDB();
    const citas: Cita[] = JSON.parse(localStorage.getItem(KEYS.CITAS) || '[]');
    const nueva: Cita = {
      ...cita,
      id: 'c-' + Math.random().toString(36).substr(2, 9),
      creado_en: new Date().toISOString()
    };
    citas.push(nueva);
    localStorage.setItem(KEYS.CITAS, JSON.stringify(citas));

    // Si se crea la cita con estado confirmado o pendiente, simular una transaccion inicial
    const tratamientos: Tratamiento[] = JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]');
    const tratamiento = tratamientos.find(t => t.id === cita.tratamiento_id);
    if (tratamiento) {
      await dbTransacciones.insertar({
        paciente_id: cita.paciente_id || '',
        cita_id: nueva.id,
        fecha: new Date(cita.fecha_hora).toISOString().split('T')[0],
        monto: tratamiento.precio,
        estado: 'pendiente',
        metodo_pago: 'efectivo'
      });
    }

    const pacientes = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    return {
      ...nueva,
      paciente: pacientes.find((p: Paciente) => p.id === nueva.paciente_id),
      tratamiento: tratamiento
    };
  },
  actualizarEstado: async (id: string, estado: Cita['estado']): Promise<Cita> => {
    await sleep(API_DELAY);
    inicializarDB();
    const citas: Cita[] = JSON.parse(localStorage.getItem(KEYS.CITAS) || '[]');
    const index = citas.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Cita no encontrada');
    citas[index].estado = estado;
    localStorage.setItem(KEYS.CITAS, JSON.stringify(citas));
    
    // Si cambia a confirmado/en_sala, podríamos actualizar el estado del pago a completado si ya se pagó.
    // Esto es comportamiento mock.
    return citas[index];
  },
  eliminar: async (id: string): Promise<boolean> => {
    await sleep(API_DELAY);
    inicializarDB();
    const citas: Cita[] = JSON.parse(localStorage.getItem(KEYS.CITAS) || '[]');
    const filtradas = citas.filter(c => c.id !== id);
    localStorage.setItem(KEYS.CITAS, JSON.stringify(filtradas));
    return true;
  }
};

// --- MOTOR CRUD HISTORIALES CLINICOS ---
export const dbHistoriales = {
  listarPorPaciente: async (pacienteId: string): Promise<HistorialClinicoRelacional[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    const historiales: HistorialClinico[] = JSON.parse(localStorage.getItem(KEYS.HISTORIALES) || '[]');
    const tratamientos = JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]');
    
    return historiales
      .filter(h => h.paciente_id === pacienteId)
      .map(h => ({
        ...h,
        tratamiento: tratamientos.find((t: Tratamiento) => t.id === h.tratamiento_id)
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // más reciente primero
  },
  listarTodos: async (): Promise<HistorialClinicoRelacional[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    const historiales: HistorialClinico[] = JSON.parse(localStorage.getItem(KEYS.HISTORIALES) || '[]');
    const pacientes = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    const tratamientos = JSON.parse(localStorage.getItem(KEYS.TRATAMIENTOS) || '[]');
    
    return historiales.map(h => ({
      ...h,
      paciente: pacientes.find((p: Paciente) => p.id === h.paciente_id),
      tratamiento: tratamientos.find((t: Tratamiento) => t.id === h.tratamiento_id)
    })).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },
  insertar: async (historial: Omit<HistorialClinico, 'id' | 'creado_en'>): Promise<HistorialClinico> => {
    await sleep(API_DELAY);
    inicializarDB();
    const historiales: HistorialClinico[] = JSON.parse(localStorage.getItem(KEYS.HISTORIALES) || '[]');
    const nuevo: HistorialClinico = {
      ...historial,
      id: 'h-' + Math.random().toString(36).substr(2, 9),
      creado_en: new Date().toISOString()
    };
    historiales.push(nuevo);
    localStorage.setItem(KEYS.HISTORIALES, JSON.stringify(historiales));
    return nuevo;
  }
};

// --- MOTOR CRUD TRANSACCIONES ---
export const dbTransacciones = {
  listar: async (): Promise<TransaccionRelacional[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    const transacciones: Transaccion[] = JSON.parse(localStorage.getItem(KEYS.TRANSACCIONES) || '[]');
    const pacientes = JSON.parse(localStorage.getItem(KEYS.PACIENTES) || '[]');
    
    return transacciones.map(t => ({
      ...t,
      paciente: pacientes.find((p: Paciente) => p.id === t.paciente_id)
    })).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },
  insertar: async (transaccion: Omit<Transaccion, 'id' | 'creado_en'>): Promise<Transaccion> => {
    await sleep(API_DELAY);
    inicializarDB();
    const transacciones: Transaccion[] = JSON.parse(localStorage.getItem(KEYS.TRANSACCIONES) || '[]');
    const nueva: Transaccion = {
      ...transaccion,
      id: 'tr-' + Math.random().toString(36).substr(2, 9),
      creado_en: new Date().toISOString()
    };
    transacciones.push(nueva);
    localStorage.setItem(KEYS.TRANSACCIONES, JSON.stringify(transacciones));
    return nueva;
  },
  actualizarEstado: async (id: string, estado: Transaccion['estado'], metodo_pago?: Transaccion['metodo_pago']): Promise<Transaccion> => {
    await sleep(API_DELAY);
    inicializarDB();
    const transacciones: Transaccion[] = JSON.parse(localStorage.getItem(KEYS.TRANSACCIONES) || '[]');
    const index = transacciones.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transacción no encontrada');
    transacciones[index].estado = estado;
    if (metodo_pago) transacciones[index].metodo_pago = metodo_pago;
    localStorage.setItem(KEYS.TRANSACCIONES, JSON.stringify(transacciones));
    return transacciones[index];
  },
  actualizarPorCita: async (citaId: string, estado: Transaccion['estado'], metodo_pago: Transaccion['metodo_pago']): Promise<Transaccion | null> => {
    await sleep(API_DELAY);
    inicializarDB();
    const transacciones: Transaccion[] = JSON.parse(localStorage.getItem(KEYS.TRANSACCIONES) || '[]');
    const index = transacciones.findIndex(t => t.cita_id === citaId);
    if (index === -1) return null;
    transacciones[index].estado = estado;
    transacciones[index].metodo_pago = metodo_pago;
    localStorage.setItem(KEYS.TRANSACCIONES, JSON.stringify(transacciones));
    return transacciones[index];
  }
};

// --- MOTOR CRUD DOCTOR ---
export const dbDoctor = {
  obtener: async (): Promise<DoctorProfile> => {
    await sleep(API_DELAY);
    inicializarDB();
    const doc = localStorage.getItem(KEYS.DOCTOR);
    if (!doc) throw new Error('Perfil del doctor no encontrado');
    return JSON.parse(doc);
  },
  actualizar: async (datos: Partial<DoctorProfile>): Promise<DoctorProfile> => {
    await sleep(API_DELAY);
    inicializarDB();
    const doc = localStorage.getItem(KEYS.DOCTOR);
    if (!doc) throw new Error('Perfil del doctor no encontrado');
    const actual: DoctorProfile = JSON.parse(doc);
    const actualizado: DoctorProfile = { ...actual, ...datos };
    localStorage.setItem(KEYS.DOCTOR, JSON.stringify(actualizado));
    return actualizado;
  }
};

// --- MOTOR CRUD CLINIC SETTINGS ---
export const dbClinicSettings = {
  obtener: async (): Promise<ClinicSettings> => {
    await sleep(API_DELAY);
    inicializarDB();
    const settings = localStorage.getItem(KEYS.CLINIC_SETTINGS);
    if (!settings) throw new Error('Configuración de clínica no encontrada');
    return JSON.parse(settings);
  },
  actualizar: async (datos: Partial<ClinicSettings>): Promise<ClinicSettings> => {
    await sleep(API_DELAY);
    inicializarDB();
    const settings = localStorage.getItem(KEYS.CLINIC_SETTINGS);
    if (!settings) throw new Error('Configuración de clínica no encontrada');
    const actual: ClinicSettings = JSON.parse(settings);
    const actualizado: ClinicSettings = { ...actual, ...datos, updated_at: new Date().toISOString() };
    localStorage.setItem(KEYS.CLINIC_SETTINGS, JSON.stringify(actualizado));
    return actualizado;
  }
};

// --- MOTOR CRUD EXAMENES ---
export const dbExamenes = {
  listarPorPaciente: async (pacienteId: string): Promise<ExamenLaboratorio[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    const items: ExamenLaboratorio[] = JSON.parse(localStorage.getItem(KEYS.EXAMENES) || '[]');
    return items.filter(e => e.paciente_id === pacienteId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },
  insertar: async (examen: Omit<ExamenLaboratorio, 'id' | 'created_at'>): Promise<ExamenLaboratorio> => {
    await sleep(API_DELAY);
    inicializarDB();
    const items: ExamenLaboratorio[] = JSON.parse(localStorage.getItem(KEYS.EXAMENES) || '[]');
    const nuevo: ExamenLaboratorio = {
      ...examen,
      id: 'ex-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    items.push(nuevo);
    localStorage.setItem(KEYS.EXAMENES, JSON.stringify(items));
    return nuevo;
  },
  eliminar: async (id: string): Promise<boolean> => {
    await sleep(API_DELAY);
    inicializarDB();
    const items: ExamenLaboratorio[] = JSON.parse(localStorage.getItem(KEYS.EXAMENES) || '[]');
    const filtrados = items.filter(e => e.id !== id);
    localStorage.setItem(KEYS.EXAMENES, JSON.stringify(filtrados));
    return true;
  }
};

// --- MOTOR CRUD RECIPES ---
export const dbRecipes = {
  listarPorPaciente: async (pacienteId: string): Promise<RecipeMedico[]> => {
    await sleep(API_DELAY);
    inicializarDB();
    const items: RecipeMedico[] = JSON.parse(localStorage.getItem(KEYS.RECIPES) || '[]');
    return items.filter(r => r.paciente_id === pacienteId).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },
  insertar: async (recipe: Omit<RecipeMedico, 'id' | 'created_at'>): Promise<RecipeMedico> => {
    await sleep(API_DELAY);
    inicializarDB();
    const items: RecipeMedico[] = JSON.parse(localStorage.getItem(KEYS.RECIPES) || '[]');
    const nuevo: RecipeMedico = {
      ...recipe,
      id: 'rc-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    items.push(nuevo);
    localStorage.setItem(KEYS.RECIPES, JSON.stringify(items));
    return nuevo;
  },
  eliminar: async (id: string): Promise<boolean> => {
    await sleep(API_DELAY);
    inicializarDB();
    const items: RecipeMedico[] = JSON.parse(localStorage.getItem(KEYS.RECIPES) || '[]');
    const filtrados = items.filter(r => r.id !== id);
    localStorage.setItem(KEYS.RECIPES, JSON.stringify(filtrados));
    return true;
  }
};

