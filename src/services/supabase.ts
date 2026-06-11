// Cliente de Supabase listo para producción.
// Para habilitar Supabase en producción:
// 1. Instalar la librería del cliente de Supabase: `npm install @supabase/supabase-js`
// 2. Descomentar el código de abajo y configurar las variables .env
// 3. Modificar tus hooks o llamadas para importar desde este archivo en lugar de './db'

/*
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.types'; // Tipos generados por Supabase CLI

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
*/

export const isSupabaseActive = false;
