import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { applyAntibanMiddleware } from 'baileys-antiban';
import { createClient } from '@supabase/supabase-js';
import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import pino from 'pino';
import { handleIncomingMessage } from './handlers/messageHandler.js';
import { sendDailyReminders } from './handlers/reminderJob.js';
import 'dotenv/config';

const logger = pino({ level: 'silent' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_session');

  let sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['Clinica Mayela', 'Chrome', '120.0.0'],
  });

  // Aplicar middleware anti-ban
  applyAntibanMiddleware(sock);

  // Generar QR y subirlo a Supabase para mostrarlo en la app
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
      // Subir QR a Supabase para que ClinicSettings.tsx lo muestre
      await supabase
        .from('clinic_settings')
        .update({ bot_qr_base64: qr, bot_conectado: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      console.log('📱 Escanea el QR con WhatsApp → Dispositivos vinculados');
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado a WhatsApp');
      await supabase
        .from('clinic_settings')
        .update({ bot_conectado: true, bot_qr_base64: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ Conexión cerrada. Reconectando:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startBot, 5000); // reconexión automática
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Escuchar mensajes entrantes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message) {
        await handleIncomingMessage(sock, msg, supabase);
      }
    }
  });

  // Recordatorios automáticos diarios a las 9am
  cron.schedule('0 9 * * *', () => sendDailyReminders(sock, supabase));
}

startBot();
