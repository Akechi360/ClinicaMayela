import QRCode from 'qrcode';

/** URL pública que abre la farmacia al escanear el QR del récipe. El código corto es aleatorio; el HMAC-SHA256 se valida en el servidor. VITE_PUBLIC_URL fija el dominio público (evita QR a localhost o a previews). */
const baseUrl = () => (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, '');

export const recipeVerifyUrl = (codigo: string) => `${baseUrl()}/v/${encodeURIComponent(codigo)}`;

export const recipeQrDataUrl = (url: string) =>
  QRCode.toDataURL(url, { margin: 1, width: 240, errorCorrectionLevel: 'M' });
