const MENU_PRINCIPAL = `
👋 Hola, soy el asistente de *Clínica Mayela*.

¿En qué te puedo ayudar?
1️⃣ Agendar una cita
2️⃣ Ver mi próxima cita
3️⃣ Cancelar una cita
4️⃣ Hablar con la doctora
`;

const SESSION = new Map();

async function findOrCreatePatient(supabase, phone, nombre) {
  const { data: existing } = await supabase
    .from('pacientes')
    .select('id, nombre')
    .eq('telefono', phone)
    .eq('activo', true)
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: newPac, error } = await supabase
    .from('pacientes')
    .insert({ nombre: nombre || phone, telefono: phone })
    .select('id, nombre')
    .single();
  if (error) throw new Error(error.message);
  return newPac;
}

async function getDefaultTratamiento(supabase) {
  const { data } = await supabase
    .from('tratamientos')
    .select('id')
    .ilike('nombre', '%consulta%')
    .limit(1)
    .single();
  if (data) return data.id;

  const { data: first } = await supabase
    .from('tratamientos')
    .select('id')
    .limit(1)
    .single();
  return first?.id;
}

export async function handleIncomingMessage(sock, msg, supabase) {
  const jid = msg.key.remoteJid;
  const phone = jid.replace('@s.whatsapp.net', '');
  const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
  const estado = SESSION.get(phone) || { step: 'menu' };

  const reply = async (txt) => sock.sendMessage(jid, { text: txt });

  if (jid.endsWith('@g.us')) return;

  try {
    switch (estado.step) {
      case 'menu':
        await reply(MENU_PRINCIPAL);
        SESSION.set(phone, { step: 'esperando_opcion' });
        break;

      case 'esperando_opcion':
        if (text === '1') {
          await reply('📝 ¿Cuál es tu nombre completo?');
          SESSION.set(phone, { step: 'esperando_nombre' });
        } else if (text === '2') {
          const { data } = await supabase
            .from('citas')
            .select('fecha_hora, tratamiento:tratamientos(nombre), paciente:pacientes!inner(id)')
            .eq('paciente.telefono', phone)
            .eq('estado', 'pendiente')
            .order('fecha_hora', { ascending: true })
            .limit(1);
          const cita = data?.[0];
          await reply(cita
            ? `📋 Tu próxima cita es el *${new Date(cita.fecha_hora).toLocaleString('es-MX')}*\nTratamiento: ${cita.tratamiento?.nombre || 'Consulta'}`
            : '❌ No tienes citas pendientes.');
          SESSION.delete(phone);
        } else if (text === '3') {
          const { data } = await supabase
            .from('citas')
            .select('id, fecha_hora, tratamiento:tratamientos(nombre), paciente:pacientes!inner(id)')
            .eq('paciente.telefono', phone)
            .eq('estado', 'pendiente')
            .order('fecha_hora', { ascending: true })
            .limit(1);
          if (data?.[0]) {
            const cita = data[0];
            await supabase.rpc('cancelar_cita', { p_cita_id: cita.id });
            await reply(`✅ Tu cita del *${new Date(cita.fecha_hora).toLocaleString('es-MX')}* ha sido cancelada.`);

            await supabase.from('notificaciones').insert({
              tipo: 'cita_cancelada_whatsapp',
              mensaje: `Cita cancelada desde WhatsApp por ${phone}`,
              metadata: { cita_id: cita.id, telefono: phone }
            });
          } else {
            await reply('❌ No tienes citas pendientes para cancelar.');
          }
          SESSION.delete(phone);
        } else if (text === '4') {
          await reply('📞 Te comunicamos con la Dra. Mayela. Por favor espera.');
          SESSION.delete(phone);
        } else {
          await reply('Por favor escribe *1*, *2*, *3* o *4*.');
        }
        break;

      case 'esperando_nombre': {
        if (!text || text.length < 2) {
          await reply('❌ Por favor escribe tu nombre completo.');
          return;
        }
        SESSION.set(phone, { step: 'esperando_fecha', nombre: text });
        await reply('📅 ¿Para qué fecha quieres tu cita? Escríbela así: *DD/MM/AAAA*');
        break;
      }

      case 'esperando_fecha': {
        const [d, m, y] = text.split('/');
        const fecha = new Date(`${y}-${m}-${d}`);
        if (isNaN(fecha.getTime())) {
          await reply('❌ Fecha inválida. Escríbela así: *DD/MM/AAAA*');
          return;
        }
        if (fecha < new Date(new Date().toDateString())) {
          await reply('❌ No puedes agendar en una fecha pasada. Intenta de nuevo.');
          return;
        }
        SESSION.set(phone, { ...estado, step: 'esperando_hora', fecha: fecha.toISOString() });
        await reply('🕐 ¿A qué hora? Escribe la hora así: *10:00* o *15:30*');
        break;
      }

      case 'esperando_hora': {
        const match = text.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
          await reply('❌ Formato de hora inválido. Escríbela así: *10:00* o *15:30*');
          return;
        }
        const [, hh, mm] = match;
        const fechaHora = new Date(estado.fecha);
        fechaHora.setHours(parseInt(hh), parseInt(mm), 0, 0);

        const paciente = await findOrCreatePatient(supabase, phone, estado.nombre);
        const tratamientoId = await getDefaultTratamiento(supabase);

        if (!tratamientoId) {
          await reply('❌ Error interno: no se encontró ningún tratamiento disponible.');
          SESSION.delete(phone);
          return;
        }

        await supabase.rpc('crear_cita_con_transaccion', {
          p_paciente_id: paciente.id,
          p_tratamiento_id: tratamientoId,
          p_fecha_hora: fechaHora.toISOString(),
          p_notas: `Agendada por WhatsApp desde ${phone}`,
        });

        await supabase.from('notificaciones').insert({
          tipo: 'cita_nueva_whatsapp',
          mensaje: `Nueva cita agendada desde WhatsApp por ${estado.nombre || phone}`,
          metadata: { telefono: phone, fecha: fechaHora.toISOString() }
        });

        await reply(`✅ ¡Cita agendada!\n📅 Fecha: *${fechaHora.toLocaleString('es-MX')}*\n\nTe enviaremos un recordatorio el día anterior. ¡Hasta pronto!`);
        SESSION.delete(phone);
        break;
      }

      default:
        SESSION.delete(phone);
        await reply(MENU_PRINCIPAL);
    }
  } catch (err) {
    console.error(`Error handling message from ${phone}:`, err);
    await reply('❌ Ocurrió un error procesando tu solicitud. Por favor intenta de nuevo.');
    SESSION.delete(phone);
  }
}
