// Teléfonos venezolanos en cualquier formato → comparables. WhatsApp entrega "584144334584"; en la app se guardan como
// "0414-433.4584", "+58 414 4334584", etc. Antes no coincidían y los recordatorios a números locales nunca llegaban.

/** 0414-433.4584 / +58 414… / 414… → 584144334584 */
export function normalizarTelefono(tel) {
  let d = String(tel ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '58' + d.slice(1);
  else if (d.length === 10 && d.startsWith('4')) d = '58' + d;
  return d;
}

const ultimos10 = (tel) => normalizarTelefono(tel).slice(-10);

/** ¿Es el mismo número aunque venga escrito distinto? (compara los últimos 10 dígitos) */
export function mismoTelefono(a, b) {
  const x = ultimos10(a);
  const y = ultimos10(b);
  return x.length >= 10 && x === y;
}

/** 584144334584 → 04144334584 (formato con el que se suelen guardar en la app) */
export function formatoLocal(tel) {
  const n = normalizarTelefono(tel);
  return n.startsWith('58') && n.length === 12 ? '0' + n.slice(2) : n;
}
