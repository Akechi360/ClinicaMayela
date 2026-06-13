export async function sendDailyReminders(sock, supabase) {
  const mañana = new Date();
  mañana.setDate(mañana.getDate() + 1);
  const inicio = new Date(mañana.setHours(0, 0, 0, 0)).toISOString();
  const fin    = new Date(mañana.setHours(23, 59, 59, 0)).toISOString();

  const { data: citas } = await supabase
    .from('citas')
    .select('fecha_hora, tipo, pacientes(telefono, nombre)')
    .eq('estado', 'pendiente')
    .gte('fecha_hora', inicio)
    .lte('fecha_hora', fin);

  for (const cita of citas || []) {
    const tel  = cita.pacientes?.telefono?.replace(/\D/g, '');
    const hora = new Date(cita.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    if (!tel) continue;

    await sock.sendMessage(`${tel}@s.whatsapp.net`, {
      text: `👋 Hola *${cita.pacientes.nombre}*,\n\nTe recordamos que mañana tienes una cita en *Clínica Mayela* a las *${hora}*.\n\nSi necesitas cancelar o cambiar la hora, responde este mensaje. 😊`
    });

    // Delay entre mensajes para reducir riesgo de ban
    await new Promise(r => setTimeout(r, 3000));
  }
}
