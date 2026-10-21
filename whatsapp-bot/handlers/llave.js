// Comprueba qué tipo de llave de Supabase se pegó en el .env (sin enviarla a ningún lado): el bot necesita la de rol "service_role".

/** Rol que declara una llave JWT de Supabase ("anon", "service_role"…); null si no se puede leer. */
export function rolDeLlave(llave) {
  try {
    const partes = String(llave ?? '').trim().split('.');
    if (partes.length !== 3) return null;
    const json = Buffer.from(partes[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json).role ?? null;
  } catch {
    return null;
  }
}

/** Mensaje de diagnóstico para mostrar al arrancar; null si todo está bien. */
export function avisoDeLlave(llave) {
  const rol = rolDeLlave(llave);
  if (rol === 'service_role') return null;
  if (rol === 'anon') return 'La llave pegada es la "anon" (pública). Necesitas la de "service_role": Supabase → Project Settings → API Keys → Legacy → service_role → Reveal → Copy.';
  if (String(llave ?? '').startsWith('sb_secret_')) return 'La llave es del tipo nuevo "sb_secret_…". Usa la clásica "service_role" (pestaña Legacy anon, service_role API keys).';
  if (String(llave ?? '').startsWith('sb_publishable_')) return 'La llave pegada es la pública ("sb_publishable_…"). Necesitas la de "service_role".';
  return 'No pude leer la llave de SUPABASE_SERVICE_KEY. Revisa que esté completa, sin comillas ni espacios, y que sea la "service_role".';
}
