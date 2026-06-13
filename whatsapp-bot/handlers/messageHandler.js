const MENU_PRINCIPAL = `
👋 Hola, soy el asistente de *Clínica Mayela*.

¿En qué te puedo ayudar?
1️⃣ Agendar una cita
2️⃣ Ver mi próxima cita
3️⃣ Cancelar una cita
4️⃣ Hablar con la doctora
`;

const SESSION = new Map(); // estado por número de teléfono

export async function handleIncomingMessage(sock, msg, supabase) {
  const jid    = msg.key.remoteJid;
  const phone  = jid.replace('@s.whatsapp.net', '');
  const text   = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
  const estado = SESSION.get(phone) || { step: 'menu' };

  const reply = async (txt) => sock.sendMessage(jid, { text: txt });

  // Anti-spam: ignorar grupos
  if (jid.endsWith('@g.us')) return;

  switch (estado.step) {
    case 'menu':
      await reply(MENU_PRINCIPAL);
      SESSION.set(phone, { step: 'esperando_opcion' });
      break;

    case 'esperando_opcion':
      if (text === '1') {
        await reply('📅 ¿Para qué fecha quieres tu cita? Escríbela así: *DD/MM/AAAA*');
        SESSION.set(phone, { step: 'esperando_fecha' });
      } else if (text === '2') {
        const { data } = await supabase
          .from('citas')
          .select('fecha_hora, tipo')
          .eq('estado', 'pendiente')
          .order('fecha_hora', { ascending: true })
          .limit(1);
        const cita = data?.[0];
        await reply(cita
          ? `📋 Tu próxima cita es el *${new Date(cita.fecha_hora).toLocaleString('es-MX')}*\nTratamiento: ${cita.tipo}`
          : '❌ No tienes citas pendientes.');
        SESSION.delete(phone);
      } else if (text === '4') {
        await reply('📞 Te comunicamos con la Dra. Mayela. Por favor espera.');
        SESSION.delete(phone);
      } else {
        await reply('Por favor escribe *1*, *2*, *3* o *4*.');
      }
      break;

    case 'esperando_fecha': {
      const [d, m, y] = text.split('/');
      const fecha = new Date(`${y}-${m}-${d}`);
      if (isNaN(fecha.getTime())) {
        await reply('❌ Fecha inválida. Escríbela así: *DD/MM/AAAA*');
        return;
      }
      SESSION.set(phone, { step: 'esperando_hora', fecha: fecha.toISOString() });
      await reply('🕐 ¿A qué hora? Escribe la hora así: *10:00* o *15:30*');
      break;
    }

    case 'esperando_hora': {
      const [hh, mm] = text.split(':');
      const fechaHora = new Date(estado.fecha);
      fechaHora.setHours(parseInt(hh), parseInt(mm));

      // Guardar cita en Supabase
      await supabase.from('citas').insert({
        fecha_hora:  fechaHora.toISOString(),
        tipo:        'Consulta (WhatsApp)',
        estado:      'pendiente',
        origen:      'whatsapp',
        notas:       `Agendada por WhatsApp desde ${phone}`,
      });

      await reply(`✅ ¡Cita agendada!\n📅 Fecha: *${fechaHora.toLocaleString('es-MX')}*\n\nTe enviaremos un recordatorio el día anterior. ¡Hasta pronto!`);
      SESSION.delete(phone);
      break;
    }

    default:
      SESSION.delete(phone);
      await reply(MENU_PRINCIPAL);
  }
}
