// Envía los mensajes pendientes de la cola `seguimientos_tratamiento`: cuidados post-tratamiento, chequeos a las
// 24 h y 72 h, recordatorios de control y de dosis de péptidos. El texto ya viene armado desde la aplicación.

const MAX_POR_CICLO = 15;
const MAX_INTENTOS = 3;
const PAUSA_MS = 4000; // espaciado entre mensajes (evita bloqueos de WhatsApp)
const VENTANA = { desde: 7, hasta: 21 }; // solo se envía entre las 7:00 y las 21:00, hora de Caracas

let enCurso = false;

/** ¿Es una hora razonable para escribirle a un paciente? (hora de Caracas) */
export function enVentanaHoraria(fecha = new Date(), { desde, hasta } = VENTANA) {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Caracas', hour: '2-digit', hour12: false }).format(fecha));
  return h >= desde && h < hasta;
}

/** 0414-433.4584 / +58 414… / 414… → 584144334584 */
export function normalizarTelefono(tel) {
  let d = String(tel ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '58' + d.slice(1);
  else if (d.length === 10 && d.startsWith('4')) d = '58' + d;
  return d;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export async function sendPendingFollowups(sock, supabase, ahora = new Date(), pausaMs = PAUSA_MS) {
  if (enCurso || !sock || !enVentanaHoraria(ahora)) return 0;
  enCurso = true;
  let enviados = 0;
  try {
    const { data, error } = await supabase
      .from('seguimientos_tratamiento')
      .select('id, mensaje, intentos, paciente:pacientes(nombre, telefono)')
      .eq('estado', 'pendiente')
      .lte('fecha_programada', ahora.toISOString())
      .order('fecha_programada', { ascending: true })
      .limit(MAX_POR_CICLO);
    if (error) {
      console.error('Error leyendo seguimientos:', error.message);
      return 0;
    }

    for (const s of data ?? []) {
      const paciente = Array.isArray(s.paciente) ? s.paciente[0] : s.paciente;
      const tel = normalizarTelefono(paciente?.telefono);
      if (!tel) {
        await supabase.from('seguimientos_tratamiento').update({ estado: 'error', error: 'El paciente no tiene teléfono registrado' }).eq('id', s.id);
        continue;
      }
      try {
        await sock.sendMessage(`${tel}@s.whatsapp.net`, { text: s.mensaje });
        await supabase
          .from('seguimientos_tratamiento')
          .update({ estado: 'enviado', enviado_en: new Date().toISOString(), intentos: s.intentos + 1, error: null })
          .eq('id', s.id);
        enviados++;
      } catch (err) {
        const intentos = s.intentos + 1;
        console.error(`Error enviando seguimiento ${s.id}:`, err.message);
        await supabase
          .from('seguimientos_tratamiento')
          .update({ intentos, error: String(err.message).slice(0, 200), estado: intentos >= MAX_INTENTOS ? 'error' : 'pendiente' })
          .eq('id', s.id);
      }
      await dormir(pausaMs);
    }
  } finally {
    enCurso = false;
  }
  return enviados;
}
