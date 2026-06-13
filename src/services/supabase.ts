// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

let rawUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseUrl = rawUrl ? String(rawUrl).trim() : 'http://localhost:54321';
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = 'https://' + supabaseUrl;
}

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel o en el archivo .env');
}

// Para evitar crashes completos de React por un URL malformado
let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, String(supabaseKey).trim());
} catch (e) {
  console.error("Error al inicializar Supabase client:", e);
  // Fallback a un client inútil pero que no crashea la app entera
  supabaseClient = createClient('http://localhost:54321', 'placeholder');
}

export const supabase = supabaseClient;
export const isSupabaseActive = true;
