import { supabase } from './supabase';
import type { PeptideProtocol } from '../types/peptides';

export const dbProtocolosPeptidos = {
  listar: async (): Promise<PeptideProtocol[]> => {
    const { data, error } = await supabase
      .from('protocolos_peptidos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  listarPorPaciente: async (pacienteId: string): Promise<PeptideProtocol[]> => {
    const { data, error } = await supabase
      .from('protocolos_peptidos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  obtener: async (id: string): Promise<PeptideProtocol | null> => {
    const { data, error } = await supabase
      .from('protocolos_peptidos')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  },

  insertar: async (datos: Omit<PeptideProtocol, 'id' | 'created_at'>): Promise<PeptideProtocol> => {
    const { data, error } = await supabase
      .from('protocolos_peptidos')
      .insert(datos)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  actualizar: async (id: string, datos: Partial<PeptideProtocol>): Promise<PeptideProtocol> => {
    const { data, error } = await supabase
      .from('protocolos_peptidos')
      .update(datos)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  eliminar: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('protocolos_peptidos')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
