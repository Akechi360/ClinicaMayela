// Acceso a Supabase para la conversación del bot (llave de servicio). Mantiene fuera de conversacion.js todo lo de la base de datos.
import { mismoTelefono } from './telefono.js';

const ESTADOS_LIBRES = '(cancelado,completado)';

export function crearRepo(supabase, { appUrl = 'https://dra-mayela-gonzalez.vercel.app' } = {}) {
  let cacheAjustes = { t: 0, v: null };

  const unico = (x) => (Array.isArray(x) ? x[0] : x);

  return {
    /** Ajustes de la clínica (se refrescan cada 30 s para que un cambio en la app se note rápido). */
    async ajustes() {
      if (cacheAjustes.v && Date.now() - cacheAjustes.t < 30_000) return cacheAjustes.v;
      const { data, error } = await supabase.from('clinic_settings').select('*').limit(1).maybeSingle();
      if (error) throw new Error(`No se pudieron leer los ajustes: ${error.message}`);
      cacheAjustes = { t: Date.now(), v: data ?? { bot_activo: false } };
      return cacheAjustes.v;
    },

    async sesion(clave) {
      const { data } = await supabase.from('bot_sesiones').select('*').eq('telefono', clave).maybeSingle();
      return data;
    },

    async guardarSesion(clave, { paso, datos, pausado_hasta = null }) {
      const { error } = await supabase
        .from('bot_sesiones')
        .upsert({ telefono: clave, paso, datos, pausado_hasta, actualizado_en: new Date().toISOString() });
      if (error) throw new Error(`No se pudo guardar la sesión: ${error.message}`);
    },

    /** Silencia el bot en un chat (la doctora respondió a mano). Conserva el estado de la conversación. */
    async pausar(clave, hasta) {
      const { data } = await supabase.from('bot_sesiones').select('paso, datos').eq('telefono', clave).maybeSingle();
      await supabase.from('bot_sesiones').upsert({
        telefono: clave, paso: data?.paso ?? 'menu', datos: data?.datos ?? {}, pausado_hasta: hasta.toISOString(), actualizado_en: new Date().toISOString(),
      });
    },

    /** Paciente activo cuyo teléfono coincide con el número de WhatsApp (sin importar cómo se escribió en la app). */
    async pacientePorTelefono(tel) {
      if (!tel) return null;
      const { data } = await supabase.from('pacientes').select('id, nombre, apellido, telefono').eq('activo', true).not('telefono', 'is', null).limit(5000);
      return (data ?? []).find((p) => mismoTelefono(p.telefono, tel)) ?? null;
    },

    async tratamientosReservables() {
      const { data } = await supabase
        .from('tratamientos')
        .select('id, nombre, duracion_minutos, aprobacion_whatsapp')
        .eq('reservable_whatsapp', true)
        .order('nombre');
      return data ?? [];
    },

    /** Citas que ocupan agenda entre dos instantes. */
    async ocupados(desdeISO, hastaISO) {
      const { data, error } = await supabase
        .from('citas')
        .select('fecha_hora, duracion_minutos, tratamiento:tratamientos(duracion_minutos)')
        .not('estado', 'in', ESTADOS_LIBRES)
        .gte('fecha_hora', new Date(new Date(desdeISO).getTime() - 8 * 3_600_000).toISOString())
        .lte('fecha_hora', hastaISO)
        .limit(2000);
      if (error) throw new Error(`No se pudo leer la agenda: ${error.message}`);
      return data ?? [];
    },

    async citasFuturas(pacienteId) {
      const { data } = await supabase
        .from('citas')
        .select('id, fecha_hora, estado, tratamiento:tratamientos(nombre)')
        .eq('paciente_id', pacienteId)
        .not('estado', 'in', ESTADOS_LIBRES)
        .gte('fecha_hora', new Date().toISOString())
        .order('fecha_hora', { ascending: true })
        .limit(10);
      return (data ?? []).map((c) => ({ ...c, tratamiento: unico(c.tratamiento) }));
    },

    /** Solo al confirmar una cita: no se crean pacientes por cualquier número que escriba. */
    async crearPaciente({ nombre, telefono }) {
      const partes = String(nombre).trim().split(/\s+/);
      const apellido = partes.length > 1 ? partes.pop() : '';
      const { data, error } = await supabase
        .from('pacientes')
        .insert({ nombre: partes.join(' '), apellido, telefono })
        .select('id')
        .single();
      if (error) throw new Error(`No se pudo registrar al paciente: ${error.message}`);
      return data;
    },

    async crearCita({ pacienteId, tratamientoId, inicio, duracion, estado, notas }) {
      const { data, error } = await supabase.rpc('bot_crear_cita', {
        p_paciente_id: pacienteId, p_tratamiento_id: tratamientoId, p_fecha_hora: inicio.toISOString(),
        p_duracion: duracion, p_estado: estado, p_notas: notas,
      });
      if (error) throw new Error(error.message);
      return data;
    },

    async cancelarCita(id) {
      const { error } = await supabase.rpc('cancelar_cita', { p_cita_id: id });
      if (error) throw new Error(error.message);
    },

    async notificar(tipo, mensaje, metadata) {
      const { error } = await supabase.from('notificaciones').insert({ tipo, mensaje, metadata });
      if (error) console.error('No se pudo crear la notificación:', error.message);
    },

    /** Enlace de la ficha de ingreso para un paciente nuevo (un solo uso, 7 días). */
    async crearFicha(pacienteId) {
      const { data, error } = await supabase.from('fichas_ingreso').insert({ paciente_id: pacienteId, token: 'pendiente' }).select('token').single();
      if (error || !data) { console.error('No se pudo crear la ficha:', error?.message); return null; }
      return `${appUrl.replace(/\/+$/, '')}/f/${data.token}`;
    },
  };
}
