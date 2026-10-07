/** Limpia el texto de búsqueda antes de armar un filtro `.or(...)` de PostgREST: la coma, los paréntesis y las comillas
 *  son sintaxis del filtro (permitirlos dejaba inyectar condiciones) y % _ son comodines de LIKE. */
export function sanitizarBusqueda(texto: string): string {
  return texto.replace(/[,()"'\\%_*:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}
