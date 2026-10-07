/** "6 de octubre de 2026, 15:42" en hora de Caracas (UTC−4, sin horario de verano). */
export function fechaHoraCaracas(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const fecha = d.toLocaleDateString('es-VE', { timeZone: 'America/Caracas', day: 'numeric', month: 'long', year: 'numeric' });
  const hora = d.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha}, ${hora}`;
}
