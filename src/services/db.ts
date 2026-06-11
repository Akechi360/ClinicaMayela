import type { Paciente, Tratamiento, Cita, HistorialClinico, Transaccion, CitaRelacional, HistorialClinicoRelacional, TransaccionRelacional } from '../types/database.types';

// Claves de LocalStorage
const KEYS = {
  PACIENTES: 'rejuvenece_pacientes',
  TRATAMIENTOS: 'rejuvenece_tratamientos',
  CITAS: 'rejuvenece_citas',
  HISTORIALES: 'rejuvenece_historiales',
  TRANSACCIONES: 'rejuvenece_transacciones',
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
  if (!localStorage.getItem(KEYS.TRATAMIENTOS)) {
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
        paciente_id: cita.paciente_id,
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
