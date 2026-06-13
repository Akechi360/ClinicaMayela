export interface Paciente {
  id:          string;   // UUID
  nombre:      string;
  apellido:    string;
  cedula?:     string;
  telefono?:   string;
  correo?:     string;
  fecha_nac?:  string;
  foto_perfil?: string;
  notas?:      string;
  created_at:  string;
}

export interface HistorialClinico {
  id:                      string;
  paciente_id:             string;
  fecha:                   string;
  tratamiento:             string;
  notas_medicas?:          string;
  antecedentes?:           string;
  foto_antes?:             string;
  foto_despues?:           string;
  mapa_facial_coordenadas: MapaFacialCoordenada[];
  productos_usados?:       ProductoUsado[];
  created_at:              string;
}

export interface MapaFacialCoordenada {
  x:        number;
  y:        number;
  z?:       number;
  zona:     string;
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
  estado:      'pendiente' | 'completada' | 'cancelada';
  notas?:      string;
  origen:      'manual' | 'whatsapp';
  created_at:  string;
  // join
  pacientes?:  Pick<Paciente, 'nombre' | 'apellido' | 'telefono'>;
}

export interface DoctorProfile {
  id:           string;
  nombre?:      string;
  especialidad?: string;
  cedula_prof?: string;
  correo?:      string;
  telefono?:    string;
  foto?:        string;
  biografia?:   string;
  horario?:     Record<string, string>;
  updated_at:   string;
}

export interface ClinicSettings {
  id:                  string;
  bot_activo:          boolean;
  bot_conectado:       boolean;
  bot_qr_base64?:      string | null;
  hora_recordatorio?:  string;
  mensaje_bienvenida?: string;
  updated_at:          string;
}
