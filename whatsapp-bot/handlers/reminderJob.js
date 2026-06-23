export async function sendDailyReminders(sock, supabase) {
  const mañana = new Date();
  mañana.setDate(mañana.getDate() + 1);
  const inicio = new Date(mañana.setHours(0, 0, 0, 0)).toISOString();
  const fin = new Date(mañana.setHours(23, 59, 59, 0)).toISOString();

  const { data: citas, error } = await supabase
    .from('citas')
    .select('fecha_hora, tratamiento:tratamientos(nombre), paciente:pacientes(telefono, nombre)')
    .eq('estado', 'pendiente')
    .gte('fecha_hora', inicio)
    .lte('fecha_hora', fin);

  if (error) {
    console.error('Error fetching reminders:', error.message);
    return;
  }

  for (const cita of citas || []) {
    const paciente = Array.isArray(cita.paciente) ? cita.paciente[0] : cita.paciente;
    const tratamiento = Array.isArray(cita.tratamiento) ? cita.tratamiento[0] : cita.tratamiento;
    const tel = paciente?.telefono?.replace(/\D/g, '');
    const hora = new Date(cita.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    if (!tel) continue;

    try {
      await sock.sendMessage(`${tel}@s.whatsapp.net`, {
        text: `👋 Hola *${paciente.nombre}*,\n\nTe recordamos que mañana tienes una cita en *Clínica Mayela* a las *${hora}*${tratamiento?.nombre ? ` para *${tratamiento.nombre}*` : ''}.\n\nSi necesitas cancelar o cambiar la hora, responde este mensaje. 😊`
      });
    } catch (err) {
      console.error(`Error sending reminder to ${tel}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 3000));
  }
}
