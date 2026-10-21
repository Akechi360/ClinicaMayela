// Recibe mensajes de WhatsApp, identifica al remitente y delega la conversación en conversacion.js.
import { procesar } from './conversacion.js';
import { normalizarTelefono } from './telefono.js';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Número y clave de conversación de un mensaje. WhatsApp puede entregar "@lid" en vez del teléfono: se usa el alterno si viene. */
export function identificar(msg) {
  const key = msg?.key ?? {};
  const jid = key.remoteJid ?? null;
  if (!jid) return { jid: null, telefono: null, clave: null };
  const jidTel = jid.endsWith('@lid') ? (key.remoteJidAlt ?? key.participantAlt ?? null) : jid;
  const telefono = jidTel && jidTel.endsWith('@s.whatsapp.net') ? normalizarTelefono(jidTel.split('@')[0].split(':')[0]) : null;
  return { jid, telefono, clave: telefono || jid };
}

/** Chats que el bot nunca atiende: grupos, estados, listas de difusión y canales. */
export const esChatIgnorado = (jid) =>
  !jid || jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter');

/** Texto del mensaje; '' si es multimedia; null si no es un mensaje de conversación (reacciones, protocolo…). */
export function extraerTexto(msg) {
  const m = msg?.message;
  if (!m) return null;
  const t = m.conversation ?? m.extendedTextMessage?.text ?? m.buttonsResponseMessage?.selectedDisplayText ?? m.listResponseMessage?.title;
  if (typeof t === 'string') return t.trim();
  if (m.reactionMessage || m.protocolMessage || m.senderKeyDistributionMessage || m.pollUpdateMessage) return null;
  return '';
}

/** Limita cuántos mensajes se atienden por número (evita abuso y bucles). */
export function crearLimitador({ max = 15, ventanaMs = 5 * 60_000 } = {}) {
  const hist = new Map();
  return {
    excedido(clave, ahora = Date.now()) {
      const recientes = (hist.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
      recientes.push(ahora);
      hist.set(clave, recientes);
      return recientes.length > max;
    },
  };
}

export async function handleIncomingMessage(sock, msg, repo, limitador, pausaMs = 800) {
  const { jid, telefono, clave } = identificar(msg);
  if (esChatIgnorado(jid)) return;
  const texto = extraerTexto(msg);
  if (texto === null) return;
  if (limitador.excedido(clave)) return;

  let respuestas = [];
  try {
    ({ respuestas } = await procesar(repo, { clave, telefono, texto }));
  } catch (err) {
    console.error(`Error atendiendo a ${clave}:`, err);
    respuestas = ['Ocurrió un inconveniente al procesar su solicitud. Por favor intente nuevamente en unos minutos o escriba *menu*.'];
    try { await repo.guardarSesion(clave, { paso: 'menu', datos: {} }); } catch { /* sin sesión */ }
  }
  for (const r of respuestas) {
    await sock.sendMessage(jid, { text: r });
    if (respuestas.length > 1) await dormir(pausaMs);
  }
}
