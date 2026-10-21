import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { applyAntibanMiddleware } from 'baileys-antiban';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import pino from 'pino';
import { handleIncomingMessage, identificar, esChatIgnorado, crearLimitador } from './handlers/messageHandler.js';
import { crearRepo } from './handlers/repo.js';
import { PAUSA_HUMANO_HORAS } from './handlers/conversacion.js';
import { sendDailyReminders } from './handlers/reminderJob.js';
import { sendPendingFollowups } from './handlers/followupJob.js';
import { ahoraCaracas, correspondenRecordatorios } from './handlers/reminderSchedule.js';
import 'dotenv/config';

const logger = pino({ level: 'silent' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const repo = crearRepo(supabase, { appUrl: process.env.APP_URL });
const limitador = crearLimitador();
// Ids de los mensajes que envía el propio bot: los demás mensajes "propios" los escribió una persona desde el teléfono
const idsDelBot = new Set();

let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000;
let botStatus = 'starting';
// Conexión vigente: se reemplaza en cada reconexión; los cron la leen en vez de capturar una conexión vieja
let currentSock = null;
let jobsStarted = false;
let ultimoDiaRecordatorios = null; // día (Caracas) en que ya se enviaron los recordatorios
let horaRecordatorio = '09:00:00'; // clinic_settings.hora_recordatorio (se refresca cada 5 min)
let ultimaLecturaAjustes = 0;
let primerTick = true;

function getReconnectDelay() {
  const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  return delay;
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_session');

  let sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['Clinica Mayela', 'Chrome', '120.0.0'],
  });

  applyAntibanMiddleware(sock);
  // Registra el id de todo lo que envía el bot (respuestas, recordatorios, seguimientos) para distinguirlo de lo que escribe la doctora
  const enviarOriginal = sock.sendMessage.bind(sock);
  sock.sendMessage = async (...args) => {
    const r = await enviarOriginal(...args);
    if (r?.key?.id) { idsDelBot.add(r.key.id); if (idsDelBot.size > 500) idsDelBot.delete(idsDelBot.values().next().value); }
    return r;
  };
  currentSock = sock;

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
      await supabase
        .from('clinic_settings')
        .update({ bot_qr_base64: qr, bot_conectado: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      botStatus = 'waiting_qr';
      console.log('📱 Escanea el QR con WhatsApp → Dispositivos vinculados');
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado a WhatsApp');
      reconnectAttempts = 0;
      botStatus = 'connected';
      await supabase
        .from('clinic_settings')
        .update({ bot_conectado: true, bot_qr_base64: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      const delay = getReconnectDelay();
      botStatus = 'disconnected';
      console.log(`⚠️ Conexión cerrada. Reconectando en ${delay / 1000}s (intento ${reconnectAttempts})`);

      await supabase
        .from('clinic_settings')
        .update({ bot_conectado: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (shouldReconnect) {
        setTimeout(startBot, delay);
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      // Mensajes viejos (historial o pendientes de cuando el bot estuvo apagado): no se responden ni se tratan como en vivo
      const ts = Number(msg.messageTimestamp?.low ?? msg.messageTimestamp ?? 0);
      if (ts && Date.now() / 1000 - ts > 300) continue;
      if (type !== 'notify' && !msg.key.fromMe) continue;
      if (msg.key.fromMe) {
        // Si la doctora escribe desde el teléfono, el bot se calla en ese chat un rato (toma de control humana)
        const { jid, clave } = identificar(msg);
        if (esChatIgnorado(jid) || !clave) continue;
        const id = msg.key.id;
        setTimeout(() => {
          if (idsDelBot.has(id)) return;
          repo.pausar(clave, new Date(Date.now() + PAUSA_HUMANO_HORAS * 3_600_000)).catch((e) => console.error('No se pudo pausar el chat:', e.message));
        }, 2500);
        continue;
      }
      try {
        await handleIncomingMessage(sock, msg, repo, limitador);
      } catch (err) {
        console.error('Error processing message:', err);
      }
    }
  });

  // Las tareas programadas se crean UNA sola vez (antes se duplicaban en cada reconexión)
  if (!jobsStarted) {
    jobsStarted = true;
    // Recordatorios de citas de mañana a la hora configurada en Ajustes (hora de Caracas), una vez por día
    cron.schedule('* * * * *', async () => {
      if (botStatus !== 'connected') return;
      try {
        if (Date.now() - ultimaLecturaAjustes > 5 * 60_000) {
          ultimaLecturaAjustes = Date.now();
          const { data } = await supabase.from('clinic_settings').select('hora_recordatorio').limit(1).maybeSingle();
          if (data?.hora_recordatorio) horaRecordatorio = data.hora_recordatorio;
        }
        // Tras un reinicio o redespliegue a mitad del día se asume que los recordatorios de hoy ya salieron (evita duplicarlos)
        if (primerTick) {
          primerTick = false;
          if (correspondenRecordatorios(new Date(), horaRecordatorio, null)) ultimoDiaRecordatorios = ahoraCaracas().dia;
        }
        if (correspondenRecordatorios(new Date(), horaRecordatorio, ultimoDiaRecordatorios)) {
          ultimoDiaRecordatorios = ahoraCaracas().dia;
          await sendDailyReminders(currentSock, supabase);
        }
      } catch (err) {
        console.error('Error sending reminders:', err);
      }
    });
    // Cuidados post-tratamiento, chequeos 24/72 h, controles y dosis de péptidos: cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      if (botStatus !== 'connected') return;
      sendPendingFollowups(currentSock, supabase).catch(err => console.error('Error sending follow-ups:', err));
    });
  }
}

// Health check HTTP server para Render
const PORT = process.env.PORT || 3000;
createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      bot: botStatus,
      uptime: process.uptime(),
      reconnectAttempts,
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`🏥 Health check server running on port ${PORT}`);
});

startBot();
