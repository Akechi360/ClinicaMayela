export interface Paciente {
  id:               string;   // UUID
  nombre:           string;
  apellido?:        string;
  cedula?:          string;
  telefono?:        string;
  email?:           string;
  fecha_nacimiento?: string;
  genero?:          string;
  estatura_cm?:     number | null;
  peso_meta_kg?:    number | null;
  patologias?:      string[];
  antecedentes?:    string;
  alergias?:        string;
  notas?:           string;
  es_vip?:          boolean;
  foto_perfil?:     string;
  activo?:          boolean;
  creado_en?:       string;
  created_at?:      string;
}

export interface EventoAdverso {
  id: string;
  paciente_id: string;
  historial_id?: string | null;
  tipo: string;
  severidad: 'leve' | 'moderada' | 'severa';
  fecha_inicio: string;
  estado: 'activo' | 'en_tratamiento' | 'resuelto';
  conducta?: string | null;
  notas?: string | null;
  resuelto_en?: string | null;
  created_at?: string;
}

export interface Seguimiento {
  id: string;
  paciente_id: string;
  cita_id?: string | null;
  protocolo_id?: string | null;
  tipo: 'cuidados_post' | 'recordatorio_24h' | 'recordatorio_72h' | 'control_estetico' | 'dosis_peptido' | 'escalado_dosis';
  fecha_programada: string;
  mensaje: string;
  estado: 'pendiente' | 'enviado' | 'cancelado' | 'error';
  enviado_en?: string | null;
  error?: string | null;
  created_at?: string;
}

export interface OrdenLaboratorio {
  id: string;
  paciente_id: string;
  fecha: string;
  perfil: 'Femenino' | 'Masculino';
  estudios: string[];
  notas?: string | null;
  created_at?: string;
}

export interface HistorialClinico {
  id:                      string;
  paciente_id:             string;
  cita_id?:                string;
  tratamiento_id?:         string;
  fecha:                   string;
  producto?:               string;
  cantidad?:               string;
  lote?:                   string;
  tecnica?:                string;
  notas_medicas?:          string;
  mapa_facial_coordenadas: MapaFacialCoordenada[];
  foto_antes?:             string | null;
  foto_despues?:           string | null;
  creado_en?:              string;
  created_at?:             string;
}

export interface MapaFacialCoordenada {
  x:        number;
  y:        number;
  z?:       number;
  zona?:    string;
  producto: string;
  dosis:    number;
}

export interface ProductoUsado {
  nombre:  string;
  dosis:   number;
  role?:   string;
  unidad:  string; // 'U' | 'ml'
}

export interface Cita {
  id:             string;
  paciente_id:    string;
  tratamiento_id: string;
  fecha_hora:     string;
  estado:         string;
  notas?:         string;
  creado_en?:     string;
  created_at?:    string;
  pacientes?:     Pick<Paciente, 'nombre' | 'apellido' | 'telefono'>;
  tratamiento?:   Tratamiento;
}

export interface DoctorProfile {
  id:           string;
  nombre:       string;
  especialidad: string;
  cedula_prof?: string | null;
  cedula?:      string | null;
  correo?:      string | null;
  email?:       string | null;
  telefono:     string;
  foto?:        string | null;
  foto_perfil?: string | null;
  biografia:    string;
  horario:      string;
  linkedin?:    string | null;
  instagram?:   string | null;
  mpps?:        string | null;
  col?:         string | null;
  firma_base64?: string | null;
  sello_base64?: string | null;
  consultorio_nombre?: string | null;
  consultorio_direccion?: string | null;
  updated_at?:  string | null;
}

export interface Transaccion {
  id: string;
  cita_id?: string;
  paciente_id: string;
  fecha: string;
  monto: number;
  estado: string;
  metodo_pago: string;
  paciente?: Paciente;
  creado_en?: string;
}

export interface ClinicSettings {
  id:                  string;
  bot_activo:          boolean;
  bot_conectado:       boolean;
  bot_qr_base64?:      string | null;
  hora_recordatorio?:  string;
  mensaje_bienvenida?: string;
  /** Token secreto del enlace de suscripción a Google Calendar */
  calendar_token?:     string | null;
  updated_at?:         string;
}

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_minutos: number;
  creado_en: string;
  categoria?: string;
}

export interface CitaRelacional extends Cita {
  paciente?: Paciente;
  tratamiento?: Tratamiento;
}

export interface HistorialClinicoRelacional extends HistorialClinico {
  paciente?: Paciente;
  tratamiento?: Tratamiento;
}

export interface TransaccionRelacional extends Transaccion {
  paciente?: Paciente;
  cita?: CitaRelacional;
}

export interface ExamenLaboratorio {
  id: string;
  paciente_id: string;
  titulo: string;
  fecha: string;
  archivo_url?: string;
  notas?: string;
  created_at?: string;
}

export type RecipeEstado = 'emitido' | 'dispensado' | 'anulado';

export interface RecipeMedico {
  id: string;
  paciente_id: string;
  fecha: string;
  medicamentos: string;
  indicaciones?: string;
  /** Identidad y hash congelados al firmar (los fija el servidor) */
  doctor_nombre?: string | null;
  doctor_mpps?: string | null;
  doctor_col?: string | null;
  hash_sha256?: string | null;
  estado?: RecipeEstado;
  estado_at?: string | null;
  /** Código corto público del QR (/v/<codigo>) */
  codigo?: string;
  reemplazado_por?: string | null;
  created_at?: string;
}

export interface RecipePlantilla {
  id: string;
  nombre: string;
  medicamentos: string;
  indicaciones?: string | null;
}

export interface RecipeVerificado {
  valido: boolean;
  estado?: RecipeEstado;
  estado_at?: string | null;
  /** Código de la versión vigente cuando este récipe fue corregido/reemplazado */
  vigente_codigo?: string | null;
  fecha?: string;
  medicamentos?: string;
  indicaciones?: string | null;
  paciente?: string;
  /** Cédula enmascarada por el servidor, p. ej. V-***3650 */
  paciente_cedula?: string | null;
  doctor_nombre?: string;
  doctor_mpps?: string;
  doctor_col?: string;
  especialidad?: string;
  telefono?: string | null;
  consultorio_nombre?: string | null;
  consultorio_direccion?: string | null;
  firma?: string | null;
  sello?: string | null;
}

export interface Consentimiento {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  paciente_dni: string;
  tratamiento_nombre: string;
  fecha: string;
  doctor_nombre: string;
  estado: 'Activo' | 'Pendiente' | 'Archivado';
  firma_base64?: string | null;
  version: number;
  clausulas: string[];
  /** Fecha y hora exactas de la firma (la fija el servidor) y versión del aviso legal vigente al firmar */
  firmado_en?: string | null;
  doc_version?: string | null;
  created_at: string;
}

export interface ComposicionCorporal {
  id: string;
  paciente_id: string;
  fecha: string;
  peso_kg: number;
  grasa_pct: number;
  masa_magra_kg: number; // columna generada en Supabase
  notas?: string;
  created_at?: string;
}
