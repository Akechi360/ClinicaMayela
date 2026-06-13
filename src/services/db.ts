import { supabase } from './supabase';
import type {
  Paciente,
  HistorialClinico,
  Cita,
  DoctorProfile,
  ClinicSettings,
} from '../types/database.types';

// ─────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────

export async function getPacientes(): Promise<Paciente[]> {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('apellido', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPacienteById(id: string): Promise<Paciente | null> {
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
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function searchPacientes(query: string): Promise<Paciente[]> {
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
  const { data, error } = await supabase
    .from('historial_clinico')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getHistorialById(id: string): Promise<HistorialClinico | null> {
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
  const { error } = await supabase
    .from('citas')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─────────────────────────────────────────────
// DOCTOR PROFILE
// ─────────────────────────────────────────────

export async function getDoctorProfile(): Promise<DoctorProfile | null> {
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
