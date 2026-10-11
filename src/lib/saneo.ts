/** Las columnas de tipo fecha no aceptan "" (texto vacío): un campo de fecha en blanco debe viajar como null. */
export function fechasVaciasANull<T extends object>(datos: T, campos: readonly (keyof T)[]): T {
  const out = { ...datos } as Record<string, unknown>;
  for (const c of campos) {
    const k = c as string;
    if (k in out && (out[k] === '' || (typeof out[k] === 'string' && (out[k] as string).trim() === ''))) out[k] = null;
  }
  return out as T;
}
