// @ts-nocheck
import { supabase, isSupabaseActive } from './supabase';
import * as localDb from './local_db';
import type {
  Paciente,
  HistorialClinico,
  Cita,
  DoctorProfile,
  ClinicSettings,
  Transaccion,
  Tratamiento
} from '../types/database.types';

// ─────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────

export async function getPacientes(): Promise<Paciente[]> {
  if (!isSupabaseActive) {
    return localDb.dbPacientes.listar();
  }
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('apellido', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteById(id: string): Promise<Paciente | null> {
  if (!isSupabaseActive) {
    return localDb.dbPacientes.obtener(id);
  }
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createPaciente(
  paciente: Omit<Paciente, 'id' | 'created_at'>
): Promise<Paciente> {
  if (!isSupabaseActive) {
    return localDb.dbPacientes.insertar(paciente);
  }
  const { data, error } = await supabase
    .from('pacientes')
    .insert(paciente)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePaciente(
  id: string,
  updates: Partial<Omit<Paciente, 'id' | 'created_at'>>
): Promise<Paciente> {
  if (!isSupabaseActive) {
    return localDb.dbPacientes.actualizar(id, updates);
  }
  const { data, error } = await supabase
    .from('pacientes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePaciente(id: string): Promise<void> {
  if (!isSupabaseActive) {
    await localDb.dbPacientes.eliminar(id);
    return;
  }
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function searchPacientes(query: string): Promise<Paciente[]> {
  if (!isSupabaseActive) {
    const list = await localDb.dbPacientes.listar();
    return list.filter(p => 
      p.nombre.toLowerCase().includes(query.toLowerCase()) ||
      (p.apellido && p.apellido.toLowerCase().includes(query.toLowerCase())) ||
      (p.cedula && p.cedula.toLowerCase().includes(query.toLowerCase())) ||
      (p.telefono && p.telefono.includes(query)) ||
      (p.correo && p.correo.toLowerCase().includes(query.toLowerCase()))
    );
  }
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,cedula.ilike.%${query}%,telefono.ilike.%${query}%`)
    .order('apellido', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────
// HISTORIAL CLÍNICO
// ─────────────────────────────────────────────

export async function getHistorialByPaciente(
  pacienteId: string
): Promise<HistorialClinico[]> {
  if (!isSupabaseActive) {
    return localDb.dbHistoriales.listarPorPaciente(pacienteId);
  }
  const { data, error } = await supabase
    .from('historial_clinico')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getHistorialById(id: string): Promise<HistorialClinico | null> {
  if (!isSupabaseActive) {
    const todos = await localDb.dbHistoriales.listarTodos();
    return todos.find(h => h.id === id) || null;
  }
  const { data, error } = await supabase
    .from('historial_clinico')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createHistorial(
  historial: Omit<HistorialClinico, 'id' | 'created_at'>
): Promise<HistorialClinico> {
  if (!isSupabaseActive) {
    return localDb.dbHistoriales.insertar(historial);
  }
  const { data, error } = await supabase
    .from('historial_clinico')
    .insert(historial)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHistorial(
  id: string,
  updates: Partial<Omit<HistorialClinico, 'id' | 'created_at'>>
): Promise<HistorialClinico> {
  if (!isSupabaseActive) {
    const items = JSON.parse(localStorage.getItem('rejuvenece_historiales') || '[]');
    const idx = items.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      localStorage.setItem('rejuvenece_historiales', JSON.stringify(items));
      return items[idx];
    }
    throw new Error('Historial no encontrado');
  }
  const { data, error } = await supabase
    .from('historial_clinico')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHistorial(id: string): Promise<void> {
  if (!isSupabaseActive) {
    const items = JSON.parse(localStorage.getItem('rejuvenece_historiales') || '[]');
    const filtered = items.filter((item: any) => item.id !== id);
    localStorage.setItem('rejuvenece_historiales', JSON.stringify(filtered));
    return;
  }
  const { error } = await supabase
    .from('historial_clinico')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// CITAS
// ─────────────────────────────────────────────

export async function getCitas(desde?: string, hasta?: string): Promise<Cita[]> {
  if (!isSupabaseActive) {
    const list = await localDb.dbCitas.listar();
    let res = list;
    if (desde) res = res.filter(c => c.fecha_hora >= desde);
    if (hasta) res = res.filter(c => c.fecha_hora <= hasta);
    return res;
  }
  let query = supabase
    .from('citas')
    .select('*, pacientes(nombre, apellido, telefono)')
    .order('fecha_hora', { ascending: true });

  if (desde) query = query.gte('fecha_hora', desde);
  if (hasta) query = query.lte('fecha_hora', hasta);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCitasByPaciente(pacienteId: string): Promise<Cita[]> {
  if (!isSupabaseActive) {
    const list = await localDb.dbCitas.listar();
    return list.filter(c => c.paciente_id === pacienteId);
  }
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha_hora', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCita(
  cita: Omit<Cita, 'id' | 'created_at'>
): Promise<Cita> {
  if (!isSupabaseActive) {
    return localDb.dbCitas.insertar(cita);
  }
  const { data, error } = await supabase
    .from('citas')
    .insert(cita)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCita(
  id: string,
  updates: Partial<Omit<Cita, 'id' | 'created_at'>>
): Promise<Cita> {
  if (!isSupabaseActive) {
    const items = JSON.parse(localStorage.getItem('rejuvenece_citas') || '[]');
    const idx = items.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates };
      localStorage.setItem('rejuvenece_citas', JSON.stringify(items));
      return items[idx];
    }
    throw new Error('Cita no encontrada');
  }
  const { data, error } = await supabase
    .from('citas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCita(id: string): Promise<void> {
  if (!isSupabaseActive) {
    await localDb.dbCitas.eliminar(id);
    return;
  }
  const { error } = await supabase
    .from('citas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// HISTORIALES TODOS (PARA GALERÍA)
// ─────────────────────────────────────────────

export async function getHistorialesTodos(): Promise<HistorialClinico[]> {
  if (!isSupabaseActive) {
    return localDb.dbHistoriales.listarTodos();
  }
  const { data, error } = await supabase
    .from('historial_clinico')
    .select('*, pacientes(nombre, apellido)')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─────────────────────────────────────────────
// EXÁMENES DE LABORATORIO
// ─────────────────────────────────────────────

export async function getExamenes(pacienteId: string): Promise<any[]> {
  if (!isSupabaseActive) {
    return localDb.dbExamenes.listarPorPaciente(pacienteId);
  }
  const { data, error } = await supabase
    .from('examenes_laboratorio')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createExamen(examen: any): Promise<any> {
  if (!isSupabaseActive) {
    return localDb.dbExamenes.insertar(examen);
  }
  const { data, error } = await supabase
    .from('examenes_laboratorio')
    .insert(examen)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExamen(id: string): Promise<void> {
  if (!isSupabaseActive) {
    await localDb.dbExamenes.eliminar(id);
    return;
  }
  const { error } = await supabase
    .from('examenes_laboratorio')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// RÉCIPES MÉDICOS
// ─────────────────────────────────────────────

export async function getRecipes(pacienteId: string): Promise<any[]> {
  if (!isSupabaseActive) {
    return localDb.dbRecipes.listarPorPaciente(pacienteId);
  }
  const { data, error } = await supabase
    .from('recipes_medicos')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRecipe(recipe: any): Promise<any> {
  if (!isSupabaseActive) {
    return localDb.dbRecipes.insertar(recipe);
  }
  const { data, error } = await supabase
    .from('recipes_medicos')
    .insert(recipe)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(id: string): Promise<void> {
  if (!isSupabaseActive) {
    await localDb.dbRecipes.eliminar(id);
    return;
  }
  const { error } = await supabase
    .from('recipes_medicos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// DOCTOR PROFILE
// ─────────────────────────────────────────────

export async function getDoctorProfile(): Promise<DoctorProfile | null> {
  if (!isSupabaseActive) {
    return localDb.dbDoctor.obtener();
  }
  const { data, error } = await supabase
    .from('doctor_profile')
    .select('*')
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data ?? null;
}

export async function upsertDoctorProfile(
  profile: Omit<DoctorProfile, 'id' | 'updated_at'>
): Promise<DoctorProfile> {
  if (!isSupabaseActive) {
    return localDb.dbDoctor.actualizar(profile);
  }
  const { data: existing } = await supabase
    .from('doctor_profile')
    .select('id')
    .limit(1)
    .single();

  const { data, error } = existing
    ? await supabase
        .from('doctor_profile')
        .update({ ...profile, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
    : await supabase
        .from('doctor_profile')
        .insert(profile)
        .select()
        .single();

  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// CLINIC SETTINGS
// ─────────────────────────────────────────────

export async function getClinicSettings(): Promise<ClinicSettings | null> {
  if (!isSupabaseActive) {
    return localDb.dbClinicSettings.obtener();
  }
  const { data, error } = await supabase
    .from('clinic_settings')
    .select('*')
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function updateClinicSettings(
  updates: Partial<Omit<ClinicSettings, 'id'>>
): Promise<ClinicSettings> {
  if (!isSupabaseActive) {
    return localDb.dbClinicSettings.actualizar(updates);
  }
  const { data: existing } = await supabase
    .from('clinic_settings')
    .select('id')
    .limit(1)
    .single();

  if (!existing) throw new Error('No existe configuración de clínica. Ejecuta migrate_db.js primero.');

  const { data, error } = await supabase
    .from('clinic_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────────
// DASHBOARD STATS — consulta agregada
// ─────────────────────────────────────────────

export async function getDashboardStats() {
  if (!isSupabaseActive) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59).toISOString();

    const [pacientes, citas, historiales] = await Promise.all([
      localDb.dbPacientes.listar(),
      localDb.dbCitas.listar(),
      localDb.dbHistoriales.listarTodos()
    ]);

    const totalPacientes = pacientes.length;
    const citasMes = citas.filter(c => c.fecha_hora >= inicioMes && c.fecha_hora <= finMes).length;
    const citasPendientes = citas.filter(c => c.estado === 'pendiente').length;
    const ultimosHistoriales = historiales.slice(0, 5).map(h => ({
      tratamiento: h.tratamiento?.nombre || h.producto || 'Tratamiento',
      fecha: h.fecha,
      pacientes: h.paciente ? { nombre: h.paciente.nombre, apellido: h.paciente.apellido } : { nombre: 'Paciente', apellido: '' }
    }));

    return {
      totalPacientes,
      citasMes,
      citasPendientes,
      ultimosHistoriales
    };
  }

  const hoy      = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const finMes    = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59).toISOString();

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
      .select('tratamiento, fecha, pacientes(nombre, apellido)')
      .order('fecha', { ascending: false })
      .limit(5),
  ]);

  return {
    totalPacientes:   totalPacientes  ?? 0,
    citasMes:         citasMes        ?? 0,
    citasPendientes:  citasPendientes ?? 0,
    ultimosHistoriales: ultimoHistorial ?? [],
  };
}

// ─────────────────────────────────────────────
// TRATAMIENTOS
// ─────────────────────────────────────────────

export async function getTratamientos(): Promise<Tratamiento[]> {
  if (!isSupabaseActive) {
    return localDb.dbTratamientos.listar();
  }
  const { data, error } = await supabase
    .from('tratamientos')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTratamiento(t: any): Promise<Tratamiento> {
  if (!isSupabaseActive) {
    return localDb.dbTratamientos.insertar(t);
  }
  const { data, error } = await supabase
    .from('tratamientos')
    .insert(t)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTratamiento(id: string, updates: any): Promise<Tratamiento> {
  if (!isSupabaseActive) {
    return localDb.dbTratamientos.actualizar(id, updates);
  }
  const { data, error } = await supabase
    .from('tratamientos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTratamiento(id: string): Promise<void> {
  if (!isSupabaseActive) {
    await localDb.dbTratamientos.eliminar(id);
    return;
  }
  const { error } = await supabase
    .from('tratamientos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// TRANSACCIONES
// ─────────────────────────────────────────────

export async function getTransacciones(): Promise<Transaccion[]> {
  if (!isSupabaseActive) {
    return localDb.dbTransacciones.listar();
  }
  const { data, error } = await supabase
    .from('transacciones')
    .select('*')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTransaccion(t: any): Promise<Transaccion> {
  if (!isSupabaseActive) {
    return localDb.dbTransacciones.insertar(t);
  }
  const { data, error } = await supabase
    .from('transacciones')
    .insert(t)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaccionEstado(id: string, estado: string, metodo_pago?: string): Promise<any> {
  if (!isSupabaseActive) {
    return localDb.dbTransacciones.actualizarEstado(id, estado, metodo_pago);
  }
  const updates: any = { estado };
  if (metodo_pago) updates.metodo_pago = metodo_pago;
  const { data, error } = await supabase
    .from('transacciones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaccionPorCita(citaId: string, estado: string, metodo_pago?: string): Promise<any> {
  if (!isSupabaseActive) {
    return localDb.dbTransacciones.actualizarPorCita(citaId, estado, metodo_pago);
  }
  const updates: any = { estado };
  if (metodo_pago) updates.metodo_pago = metodo_pago;
  const { data, error } = await supabase
    .from('transacciones')
    .update(updates)
    .eq('cita_id', citaId)
    .select();
  if (error) throw error;
  return data;
}

// --- ADAPTADORES RETROCOMPATIBILIDAD CON SOPORTE DE HIBRIDACIÓN ---
export const dbPacientes = {
  listar: () => getPacientes(),
  obtener: (id: string) => getPacienteById(id),
  insertar: (p: any) => createPaciente(p),
  actualizar: (id: string, updates: any) => updatePaciente(id, updates),
  eliminar: (id: string) => deletePaciente(id)
};

export const dbHistoriales = {
  listarPorPaciente: (pacienteId: string) => getHistorialByPaciente(pacienteId),
  listarTodos: () => getHistorialesTodos(),
  insertar: (h: any) => createHistorial(h)
};

export const dbExamenes = {
  listarPorPaciente: (pacienteId: string) => getExamenes(pacienteId),
  insertar: (e: any) => createExamen(e),
  eliminar: (id: string) => deleteExamen(id)
};

export const dbRecipes = {
  listarPorPaciente: (pacienteId: string) => getRecipes(pacienteId),
  insertar: (r: any) => createRecipe(r),
  eliminar: (id: string) => deleteRecipe(id)
};

export const dbCitas = {
  listar: () => getCitas(),
  insertar: (c: any) => createCita(c),
  actualizarEstado: (id: string, estado: string) => updateCita(id, { estado })
};

export const dbDoctor = {
  obtener: () => getDoctorProfile(),
  actualizar: (profile: any) => upsertDoctorProfile(profile)
};

export const dbTratamientos = {
  listar: () => getTratamientos(),
  insertar: (t: any) => createTratamiento(t),
  actualizar: (id: string, updates: any) => updateTratamiento(id, updates),
  eliminar: (id: string) => deleteTratamiento(id)
};

export const dbTransacciones = {
  listar: () => getTransacciones(),
  insertar: (t: any) => createTransaccion(t),
  actualizarEstado: (id: string, estado: string, metodo_pago?: string) => updateTransaccionEstado(id, estado, metodo_pago),
  actualizarPorCita: (citaId: string, estado: string, metodo_pago?: string) => updateTransaccionPorCita(citaId, estado, metodo_pago)
};
