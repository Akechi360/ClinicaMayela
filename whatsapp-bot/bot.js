import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { applyAntibanMiddleware } from 'baileys-antiban';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import pino from 'pino';
import { handleIncomingMessage } from './handlers/messageHandler.js';
import { sendDailyReminders } from './handlers/reminderJob.js';
import { sendPendingFollowups } from './handlers/followupJob.js';
import 'dotenv/config';

const logger = pino({ level: 'silent' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 60000;
let botStatus = 'starting';
// Conexión vigente: se reemplaza en cada reconexión; los cron la leen en vez de capturar una conexión vieja
let currentSock = null;
let jobsStarted = false;

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

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        try {
          await handleIncomingMessage(sock, msg, supabase);
        } catch (err) {
          console.error('Error processing message:', err);
        }
      }
    }
  });

  // Las tareas programadas se crean UNA sola vez (antes se duplicaban en cada reconexión)
  if (!jobsStarted) {
    jobsStarted = true;
    // Recordatorios de citas de mañana: 9:00 hora de Caracas
    cron.schedule('0 9 * * *', () => {
      if (botStatus !== 'connected') return;
      sendDailyReminders(currentSock, supabase).catch(err => console.error('Error sending reminders:', err));
    }, { timezone: 'America/Caracas' });
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
