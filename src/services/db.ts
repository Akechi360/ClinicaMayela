import { supabase } from './supabase';
import type {
  Paciente,
  DoctorProfile,
  ClinicSettings,
  Tratamiento,
  Consentimiento,
  ComposicionCorporal,
  CitaRelacional,
  TransaccionRelacional,
  HistorialClinicoRelacional,
  Cita,
  Transaccion,
  HistorialClinico,
  ExamenLaboratorio,
  RecipeMedico,
} from '../types/database.types';

// ─────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────

export const dbPacientes = {
  listar: async (): Promise<Paciente[]> => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, cedula, telefono, email, es_vip, foto_perfil, activo, creado_en')
      .eq('activo', true)
      .order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  listarPaginado: async (page = 0, pageSize = 50): Promise<{ data: Paciente[]; count: number }> => {
    const { data, error, count } = await supabase
      .from('pacientes')
      .select('id, nombre, apellido, cedula, telefono, email, es_vip, foto_perfil, activo, creado_en', { count: 'exact' })
      .eq('activo', true)
      .order('creado_en', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw new Error(error.message);
    return { data: data ?? [], count: count ?? 0 };
  },
  obtener: async (id: string): Promise<Paciente | null> => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  insertar: async (datos: Omit<Paciente, 'id' | 'creado_en'>): Promise<Paciente> => {
    const { data, error } = await supabase
      .from('pacientes')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  actualizar: async (id: string, datos: Partial<Paciente>): Promise<Paciente> => {
    const { data, error } = await supabase
      .from('pacientes')
      .update(datos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  eliminar: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('pacientes')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ─────────────────────────────────────────────
// TRATAMIENTOS
// ─────────────────────────────────────────────

export const dbTratamientos = {
  listar: async (): Promise<Tratamiento[]> => {
    const { data, error } = await supabase
      .from('tratamientos')
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: Omit<Tratamiento, 'id' | 'creado_en'>): Promise<Tratamiento> => {
    const { data, error } = await supabase
      .from('tratamientos')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  actualizar: async (id: string, datos: Partial<Tratamiento>): Promise<Tratamiento> => {
    const { data, error } = await supabase
      .from('tratamientos')
      .update(datos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
};

// ─────────────────────────────────────────────
// CITAS
// ─────────────────────────────────────────────

export interface CrearCitaParams {
  paciente_id: string;
  tratamiento_id: string;
  fecha_hora: string;
  notas?: string;
  precio?: number;
}

export const dbCitas = {
  listar: async (): Promise<CitaRelacional[]> => {
    const { data, error } = await supabase
      .from('citas')
      .select('*, paciente:pacientes(id, nombre, apellido, telefono, email, es_vip, foto_perfil), tratamiento:tratamientos(*)')
      .order('fecha_hora');
    if (error) throw new Error(error.message);
    return (data ?? []) as CitaRelacional[];
  },
  listarPaginado: async (page = 0, pageSize = 100): Promise<{ data: CitaRelacional[]; count: number }> => {
    const { data, error, count } = await supabase
      .from('citas')
      .select('*, paciente:pacientes(id, nombre, apellido, telefono, email, es_vip, foto_perfil), tratamiento:tratamientos(*)', { count: 'exact' })
      .order('fecha_hora')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw new Error(error.message);
    return { data: (data ?? []) as CitaRelacional[], count: count ?? 0 };
  },
  insertar: async (datos: CrearCitaParams): Promise<{ cita_id: string }> => {
    const { data, error } = await supabase.rpc('crear_cita_con_transaccion', {
      p_paciente_id: datos.paciente_id,
      p_tratamiento_id: datos.tratamiento_id,
      p_fecha_hora: datos.fecha_hora,
      p_notas: datos.notas ?? null,
      p_precio: datos.precio ?? null,
    });
    if (error) throw new Error(error.message);
    return { cita_id: data as string };
  },
  actualizarEstado: async (id: string, estado: string): Promise<Cita> => {
    const { data, error } = await supabase
      .from('citas')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  eliminar: async (id: string): Promise<void> => {
    const { error } = await supabase.rpc('cancelar_cita', { p_cita_id: id });
    if (error) throw new Error(error.message);
  },
  checkConflict: async (fechaHora: string, duracionMinutos = 30): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_appointment_conflict', {
      p_fecha_hora: fechaHora,
      p_duracion_minutos: duracionMinutos,
    });
    if (error) throw new Error(error.message);
    return data as boolean;
  }
};

// ─────────────────────────────────────────────
// HISTORIALES
// ─────────────────────────────────────────────

type HistorialInsert = Omit<HistorialClinico, 'id' | 'creado_en' | 'created_at'>;

export const dbHistoriales = {
  listarPorPaciente: async (pacienteId: string): Promise<HistorialClinicoRelacional[]> => {
    const { data, error } = await supabase
      .from('historial_clinico')
      .select('*, tratamiento:tratamientos(*)')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as HistorialClinicoRelacional[];
  },
  listarTodos: async (): Promise<HistorialClinicoRelacional[]> => {
    const { data, error } = await supabase
      .from('historial_clinico')
      .select('*, paciente:pacientes(*), tratamiento:tratamientos(*)');
    if (error) throw new Error(error.message);
    return (data ?? []) as HistorialClinicoRelacional[];
  },
  insertar: async (datos: HistorialInsert): Promise<HistorialClinico> => {
    const { data, error } = await supabase
      .from('historial_clinico')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
};

// ─────────────────────────────────────────────
// TRANSACCIONES
// ─────────────────────────────────────────────

type TransaccionInsert = Omit<Transaccion, 'id' | 'creado_en'>;

export const dbTransacciones = {
  listar: async (): Promise<TransaccionRelacional[]> => {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, paciente:pacientes(id, nombre, apellido, telefono, email)')
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as TransaccionRelacional[];
  },
  listarPaginado: async (page = 0, pageSize = 100): Promise<{ data: TransaccionRelacional[]; count: number }> => {
    const { data, error, count } = await supabase
      .from('transacciones')
      .select('*, paciente:pacientes(id, nombre, apellido, telefono, email)', { count: 'exact' })
      .order('fecha', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw new Error(error.message);
    return { data: (data ?? []) as TransaccionRelacional[], count: count ?? 0 };
  },
  insertar: async (datos: TransaccionInsert): Promise<Transaccion> => {
    const { data, error } = await supabase
      .from('transacciones')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  actualizarEstado: async (id: string, estado: string, metodo_pago?: string): Promise<Transaccion> => {
    const updates: Partial<Transaccion> = { estado };
    if (metodo_pago) updates.metodo_pago = metodo_pago;
    const { data, error } = await supabase
      .from('transacciones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  actualizarMonto: async (id: string, monto: number): Promise<Transaccion> => {
    const { data, error } = await supabase
      .from('transacciones')
      .update({ monto })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  actualizarPorCita: async (citaId: string, estado: string, metodo_pago?: string): Promise<Transaccion[]> => {
    const updates: Partial<Transaccion> = { estado };
    if (metodo_pago) updates.metodo_pago = metodo_pago;
    const { data, error } = await supabase
      .from('transacciones')
      .update(updates)
      .eq('cita_id', citaId)
      .select();
    if (error) throw new Error(error.message);
    return (data ?? []) as Transaccion[];
  }
};

// ─────────────────────────────────────────────
// DOCTOR
// ─────────────────────────────────────────────

export const dbDoctor = {
  obtener: async (): Promise<DoctorProfile | null> => {
    const { data, error } = await supabase
      .from('doctor_profile')
      .select('*')
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  },
  actualizar: async (datos: Partial<DoctorProfile> & { id: string }): Promise<DoctorProfile> => {
    const { data, error } = await supabase
      .from('doctor_profile')
      .update(datos)
      .eq('id', datos.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
};

// ─────────────────────────────────────────────
// CLINIC SETTINGS
// ─────────────────────────────────────────────

export const dbClinicSettings = {
  obtener: async (): Promise<ClinicSettings | null> => {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  },
  actualizar: async (datos: Partial<ClinicSettings> & { id: string }): Promise<ClinicSettings> => {
    const { data, error } = await supabase
      .from('clinic_settings')
      .update({ ...datos, updated_at: new Date().toISOString() })
      .eq('id', datos.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
};

// ─────────────────────────────────────────────
// EXÁMENES DE LABORATORIO
// ─────────────────────────────────────────────

type ExamenInsert = Omit<ExamenLaboratorio, 'id' | 'created_at'>;

export const dbExamenes = {
  listarPorPaciente: async (pacienteId: string): Promise<ExamenLaboratorio[]> => {
    const { data, error } = await supabase
      .from('examenes_laboratorio')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: ExamenInsert): Promise<ExamenLaboratorio> => {
    const { data, error } = await supabase
      .from('examenes_laboratorio')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  eliminar: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('examenes_laboratorio')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ─────────────────────────────────────────────
// CONSENTIMIENTOS
// ─────────────────────────────────────────────

type ConsentimientoInsert = Omit<Consentimiento, 'id' | 'created_at'>;

export const dbConsentimientos = {
  listar: async (): Promise<Consentimiento[]> => {
    const { data, error } = await supabase
      .from('consentimientos')
      .select('id, paciente_id, paciente_nombre, paciente_dni, tratamiento_nombre, fecha, doctor_nombre, estado, version, clausulas, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  listarPorPaciente: async (pacienteId: string): Promise<Consentimiento[]> => {
    const { data, error } = await supabase
      .from('consentimientos')
      .select('*')
      .eq('paciente_id', pacienteId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: ConsentimientoInsert): Promise<Consentimiento> => {
    const { data, error } = await supabase
      .from('consentimientos')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  actualizar: async (id: string, datos: Partial<Consentimiento>): Promise<Consentimiento> => {
    const { data, error } = await supabase
      .from('consentimientos')
      .update(datos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  eliminar: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('consentimientos')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ─────────────────────────────────────────────
// RÉCIPES MÉDICOS
// ─────────────────────────────────────────────

type RecipeInsert = Omit<RecipeMedico, 'id' | 'created_at'>;

export const dbRecipes = {
  listarPorPaciente: async (pacienteId: string): Promise<RecipeMedico[]> => {
    const { data, error } = await supabase
      .from('recipes_medicos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: RecipeInsert): Promise<RecipeMedico> => {
    const { data, error } = await supabase
      .from('recipes_medicos')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  eliminar: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('recipes_medicos')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ─────────────────────────────────────────────
// COMPOSICIÓN CORPORAL
// ─────────────────────────────────────────────

export const dbComposicionCorporal = {
  listarPorPaciente: async (pacienteId: string): Promise<ComposicionCorporal[]> => {
    const { data, error } = await supabase
      .from('composicion_corporal')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: Omit<ComposicionCorporal, 'id' | 'masa_magra_kg' | 'created_at'>): Promise<ComposicionCorporal> => {
    const { data, error } = await supabase
      .from('composicion_corporal')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  eliminar: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('composicion_corporal')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ─────────────────────────────────────────────
// NOTIFICACIONES
// ─────────────────────────────────────────────

export interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export const dbNotificaciones = {
  listarNoLeidas: async (): Promise<Notificacion[]> => {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('leida', false)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  marcarLeida: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
  marcarTodasLeidas: async (): Promise<void> => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('leida', false);
    if (error) throw new Error(error.message);
  }
};

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────

export async function getDashboardStats() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59).toISOString();

  const results = await Promise.allSettled([
    supabase.from('pacientes').select('*', { count: 'exact', head: true }),
    supabase.from('citas').select('*', { count: 'exact', head: true })
      .gte('fecha_hora', inicioMes).lte('fecha_hora', finMes),
    supabase.from('citas').select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),
    supabase.from('historial_clinico')
      .select('fecha, tratamiento:tratamientos(nombre), paciente:pacientes(nombre, apellido)')
      .order('fecha', { ascending: false })
      .limit(5),
  ]);

  const totalPacientes = results[0].status === 'fulfilled' ? results[0].value.count ?? 0 : 0;
  const citasMes = results[1].status === 'fulfilled' ? results[1].value.count ?? 0 : 0;
  const citasPendientes = results[2].status === 'fulfilled' ? results[2].value.count ?? 0 : 0;
  const ultimoHistorial = results[3].status === 'fulfilled' ? results[3].value.data ?? [] : [];

  return {
    totalPacientes,
    citasMes,
    citasPendientes,
    ultimosHistoriales: ultimoHistorial.map((h: Record<string, unknown>) => {
      const p = Array.isArray(h.paciente) ? h.paciente[0] : h.paciente as Record<string, string> | null;
      const t = Array.isArray(h.tratamiento) ? h.tratamiento[0] : h.tratamiento as Record<string, string> | null;
      const fullPacienteName = p ? [p.nombre, p.apellido].filter(Boolean).join(' ') : 'Paciente';
      return {
        tratamiento: t?.nombre || 'Tratamiento',
        fecha: h.fecha as string,
        pacientes: { nombre: fullPacienteName, apellido: '' }
      };
    })
  };
}

export const getClinicSettings = dbClinicSettings.obtener;
export const updateClinicSettings = dbClinicSettings.actualizar;
