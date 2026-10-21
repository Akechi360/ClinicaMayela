// Espaciado de mensajes para no parecer un robot: todo lo que envía el bot (respuestas, recordatorios, seguimientos) pasa por una
// sola cola, con "escribiendo…" proporcional al texto y una pausa aleatoria entre mensajes. Sin dependencias externas
// (antes se usaba un paquete de terceros con acceso a la sesión de WhatsApp; no hace falta confiarle la sesión a nadie).

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Reemplaza sock.sendMessage por una versión en cola.
 * @param sock        socket de Baileys
 * @param alEnviar    (idMensaje) => void  — se llama con el id de cada mensaje enviado por el bot
 * @param esperar     función de espera (se inyecta en las pruebas)
 * @param azar        () => número entre 0 y 1 (se inyecta en las pruebas)
 */
export function aplicarAntibloqueo(sock, { alEnviar, esperar = dormir, azar = Math.random, pausaMinMs = 1200, pausaMaxMs = 2600 } = {}) {
  const original = sock.sendMessage.bind(sock);
  let cola = Promise.resolve();

  sock.sendMessage = (jid, contenido, ...resto) => {
    const tarea = cola.then(async () => {
      const texto = typeof contenido?.text === 'string' ? contenido.text : '';
      if (texto) {
        try {
          await sock.sendPresenceUpdate?.('composing', jid);
          await esperar(Math.min(3500, 500 + texto.length * 20) * (0.8 + azar() * 0.4));
        } catch { /* el indicador "escribiendo" es opcional */ }
      }
      const r = await original(jid, contenido, ...resto);
      if (texto) { try { await sock.sendPresenceUpdate?.('paused', jid); } catch { /* opcional */ } }
      if (r?.key?.id) alEnviar?.(r.key.id);
      await esperar(pausaMinMs + azar() * (pausaMaxMs - pausaMinMs));
      return r;
    });
    cola = tarea.catch(() => {}); // un envío fallido no bloquea los siguientes
    return tarea;
  };
  return sock;
}
