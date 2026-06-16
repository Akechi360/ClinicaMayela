export interface Paciente {
  id:          string;   // UUID
  nombre:      string;
  apellido?:   string;
  cedula?:     string;
  telefono?:   string;
  correo?:     string;
  fecha_nac?:  string;
  foto_perfil?: string;
  notas?:      string;
  created_at?: string;
  // Retrocompatibilidad
  email?:      string;
  fecha_nacimiento?: string;
  es_vip?:     boolean;
  antecedentes?: string;
  alergias?:   string;
  creado_en?:  string;
  genero?:     string;
}

export interface HistorialClinico {
  id:                      string;
  paciente_id:             string;
  fecha:                   string;
  tratamiento?:            string;
  notas_medicas?:          string;
  antecedentes?:           string;
  foto_antes?:             string;
  foto_despues?:           string;
  mapa_facial_coordenadas: MapaFacialCoordenada[];
  productos_usados?:       ProductoUsado[];
  created_at?:             string;
  // Retrocompatibilidad
  producto?: string;
  cantidad?: string;
  lote?: string;
  tecnica?: string;
  cita_id?: string;
  creado_en?: string;
  tratamiento_id?: string;
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
  unidad:  string; // 'U' | 'ml'
}

export interface Cita {
  id:          string;
  paciente_id?: string;
  fecha_hora:  string;
  tipo?:       string;
  estado:      string;
  notas?:      string;
  origen?:     'manual' | 'whatsapp';
  created_at?: string;
  pacientes?:  Pick<Paciente, 'nombre' | 'apellido' | 'telefono'>;
  tratamiento?: any;
  tratamiento_id?: string;
  creado_en?: string;
}

export interface DoctorProfile {
  id:           string;
  nombre:       string;
  especialidad: string;
  cedula_prof?: string;
  cedula?:      string;
  correo?:      string;
  email?:       string;
  telefono:     string;
  foto?:        string;
  foto_perfil?: string;
  biografia:    string;
  horario:      any;
  linkedin?:    string;
  instagram?:   string;
  mpps?:        string;
  col?:         string;
  updated_at?:  string;
}

export interface Transaccion {
  id: string;
  cita_id?: string;
  paciente_id: string;
  fecha: string;
  monto: number;
  estado: string;
  metodo_pago: string;
  paciente?: any;
  creado_en?: string;
}

export interface ClinicSettings {
  id:                  string;
  bot_activo:          boolean;
  bot_conectado:       boolean;
  bot_qr_base64?:      string | null;
  hora_recordatorio?:  string;
  mensaje_bienvenida?: string;
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
  tratamiento?: any;
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

export interface RecipeMedico {
  id: string;
  paciente_id: string;
  fecha: string;
  medicamentos: string;
  indicaciones?: string;
  created_at?: string;
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
  firma_base64?: string;
  version: number;
  clausulas: string[];
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
