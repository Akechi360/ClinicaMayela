import QRCode from 'qrcode';

/** URL pública que abre la farmacia al escanear el QR del récipe. El hash es el SHA-256 sellado por el servidor. */
export const recipeVerifyUrl = (id: string, hash: string) =>
  `${window.location.origin}/verificar?id=${encodeURIComponent(id)}&h=${encodeURIComponent(hash)}`;

export const recipeQrDataUrl = (url: string) =>
  QRCode.toDataURL(url, { margin: 1, width: 240, errorCorrectionLevel: 'M' });
