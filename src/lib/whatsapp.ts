/** Normaliza un teléfono venezolano a formato internacional sin "+" (wa.me): 0414… → 58414…, 414… → 58414… */
export function telefonoWa(tel?: string | null): string {
  let d = (tel ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '58' + d.slice(1);
  else if (d.length === 10 && d.startsWith('4')) d = '58' + d;
  return d;
}

export const enlaceWa = (tel: string | null | undefined, mensaje: string): string | null => {
  const n = telefonoWa(tel);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(mensaje)}` : null;
};
