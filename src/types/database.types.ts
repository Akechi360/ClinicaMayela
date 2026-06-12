export interface Paciente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  fecha_nacimiento: string;
  genero: string;
  antecedentes: string;
  alergias: string;
  es_vip: boolean;
  creado_en: string;
}

export interface Tratamiento {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_minutos: number;
  creado_en: string;
}

export interface Cita {
  id: string;
  paciente_id: string;
  tratamiento_id: string;
  fecha_hora: string; // ISO string
  estado: 'confirmado' | 'en_sala' | 'pendiente' | 'cancelado';
  notas: string;
  creado_en: string;
}

export interface MapaFacialCoordenada {
  x: number; // porcentaje (0-100) en el lienzo (o coordenada X 3D)
  y: number; // porcentaje (0-100) en el lienzo (o coordenada Y 3D)
  z?: number; // coordenada Z 3D
  zona?: string; // nombre de la zona anatómica
  dosis: number;
  producto: string;
}

export interface HistorialClinico {
  id: string;
  paciente_id: string;
  cita_id?: string;
  fecha: string;
  tratamiento_id: string;
  producto: string;
  cantidad: string;
  lote: string;
  tecnica: string;
  notas_medicas: string;
  mapa_facial_coordenadas: MapaFacialCoordenada[];
  foto_antes?: string; // URL o base64
  foto_despues?: string; // URL o base64
  creado_en: string;
}

export interface Transaccion {
  id: string;
  paciente_id: string;
  cita_id: string;
  fecha: string;
  monto: number;
  estado: 'completado' | 'pendiente' | 'reembolsado';
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia';
  creado_en: string;
}

// Representación relacional unificada para vistas complejas
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
