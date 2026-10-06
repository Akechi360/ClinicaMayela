/** Índice de masa corporal y clasificación de la OMS. */
export function calcularImc(pesoKg?: number | null, estaturaCm?: number | null): number | null {
  if (!pesoKg || !estaturaCm || pesoKg <= 0 || estaturaCm <= 0) return null;
  const m = estaturaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}

export function categoriaImc(imc: number | null): { label: string; tono: 'bajo' | 'normal' | 'alto' } | null {
  if (imc == null) return null;
  if (imc < 18.5) return { label: 'Bajo peso', tono: 'bajo' };
  if (imc < 25) return { label: 'Normal', tono: 'normal' };
  if (imc < 30) return { label: 'Sobrepeso', tono: 'alto' };
  if (imc < 35) return { label: 'Obesidad grado I', tono: 'alto' };
  if (imc < 40) return { label: 'Obesidad grado II', tono: 'alto' };
  return { label: 'Obesidad grado III', tono: 'alto' };
}

/** % del camino recorrido desde el peso inicial hasta la meta (0–100; admite ganar o perder peso). */
export function progresoHaciaMeta(inicial?: number | null, actual?: number | null, meta?: number | null): number | null {
  if (inicial == null || actual == null || meta == null || inicial === meta) return null;
  const p = ((inicial - actual) / (inicial - meta)) * 100;
  return Math.max(0, Math.min(100, Math.round(p)));
}
