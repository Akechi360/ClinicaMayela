import { supabase } from './supabase';
import type {
  Paciente,
  DoctorProfile,
  ClinicSettings,
  Tratamiento,
  Consentimiento,
  ComposicionCorporal
} from '../types/database.types';

// ─────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────

export const dbPacientes = {
  listar: async (): Promise<Paciente[]> => {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
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
      .delete()
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

export const dbCitas = {
  listar: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('citas')
      .select('*, paciente:pacientes(*), tratamiento:tratamientos(*)')
      .order('fecha_hora');
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: any): Promise<any> => {
    const { data: treatment, error: tErr } = await supabase
      .from('tratamientos')
      .select('precio')
      .eq('id', datos.tratamiento_id)
      .single();
    if (tErr) throw new Error(tErr.message);
    const { data: appointment, error: aErr } = await supabase
      .from('citas')
      .insert(datos)
      .select()
      .single();
    if (aErr) throw new Error(aErr.message);
    const transaction = {
      paciente_id: appointment.paciente_id,
      cita_id: appointment.id,
      fecha: appointment.fecha_hora.split('T')[0],
      monto: treatment.precio,
      estado: 'pendiente',
      metodo_pago: 'efectivo'
    };
    const { error: trErr } = await supabase
      .from('transacciones')
      .insert(transaction);
    if (trErr) throw new Error(trErr.message);
    return appointment;
  },
  actualizarEstado: async (id: string, estado: string): Promise<any> => {
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
    const { error } = await supabase
      .from('citas')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
};

// ─────────────────────────────────────────────
// HISTORIALES
// ─────────────────────────────────────────────

export const dbHistoriales = {
  listarPorPaciente: async (pacienteId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('historial_clinico')
      .select('*, tratamiento:tratamientos(*)')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  listarTodos: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('historial_clinico')
      .select('*, paciente:pacientes(*), tratamiento:tratamientos(*)');
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: any): Promise<any> => {
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

export const dbTransacciones = {
  listar: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*, paciente:pacientes(*)')
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: any): Promise<any> => {
    const { data, error } = await supabase
      .from('transacciones')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
  actualizarEstado: async (id: string, estado: string, metodo_pago?: string): Promise<any> => {
    const updates: any = { estado };
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
  actualizarPorCita: async (citaId: string, estado: string, metodo_pago?: string): Promise<any> => {
    const updates: any = { estado };
    if (metodo_pago) updates.metodo_pago = metodo_pago;
    const { data, error } = await supabase
      .from('transacciones')
      .update(updates)
      .eq('cita_id', citaId)
      .select();
    if (error) throw new Error(error.message);
    return data ?? [];
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
  actualizar: async (datos: any): Promise<DoctorProfile> => {
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
  actualizar: async (datos: any): Promise<ClinicSettings> => {
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

export const dbExamenes = {
  listarPorPaciente: async (pacienteId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('examenes_laboratorio')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: any): Promise<any> => {
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

export const dbConsentimientos = {
  listar: async (): Promise<Consentimiento[]> => {
    const { data, error } = await supabase
      .from('consentimientos')
      .select('*')
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
  insertar: async (datos: any): Promise<Consentimiento> => {
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

export const dbRecipes = {
  listarPorPaciente: async (pacienteId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('recipes_medicos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  insertar: async (datos: any): Promise<any> => {
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
// DASHBOARD STATS
// ─────────────────────────────────────────────

export async function getDashboardStats() {
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59).toISOString();

  const [
    { count: totalPacientes },
    { count: citasMes },
    { count: citasPendientes },
    { data: ultimoHistorial },
  ] = await Promise.all([
    supabase.from('pacientes').select('*', { count: 'exact', head: true }),
    supabase.from('citas').select('*', { count: 'exact', head: true })
      .gte('fecha_hora', inicioMes).lte('fecha_hora', finMes),
    supabase.from('citas').select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),
    supabase.from('historial_clinico')
      .select('tratamiento, fecha, paciente:pacientes(nombre)')
      .order('fecha', { ascending: false })
      .limit(5),
  ]);

  return {
    totalPacientes: totalPacientes ?? 0,
    citasMes: citasMes ?? 0,
    citasPendientes: citasPendientes ?? 0,
    ultimosHistoriales: (ultimoHistorial ?? []).map(h => {
      const p = Array.isArray(h.paciente) ? h.paciente[0] : h.paciente;
      return {
        tratamiento: h.tratamiento || 'Tratamiento',
        fecha: h.fecha,
        pacientes: p ? { nombre: p.nombre, apellido: '' } : { nombre: 'Paciente', apellido: '' }
      };
    })
  };
}

export const getClinicSettings = dbClinicSettings.obtener;
export const updateClinicSettings = dbClinicSettings.actualizar;
