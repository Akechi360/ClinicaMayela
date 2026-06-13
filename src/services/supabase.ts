// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string || 'http://localhost:54321';
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel o en el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export const isSupabaseActive = true;
