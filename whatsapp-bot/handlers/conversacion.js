// Conversación del bot con el paciente: agendar con disponibilidad real, ver y cancelar citas, información y
// traspaso a la doctora. No toca WhatsApp ni Supabase directamente: usa un "repo" (ver repo.js), por eso se prueba con un repo falso.
import { ahoraCaracas, fechaHoraCaracas } from './reminderSchedule.js';
import { configDesdeAjustes, diasDisponibles, intervalosOcupados, slotsDelDia } from './disponibilidad.js';
import { hora12, norm, textoCita, textoDia, textoHorario } from './textos.js';
import { formatoLocal, normalizarTelefono } from './telefono.js';

export const EXPIRA_MIN = 30;
export const PAUSA_HUMANO_HORAS = 3;

const SALUDOS = new Set(['menu', 'inicio', 'hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'ayuda', '0']);

const MENU = [
  '1️⃣ Agendar una cita',
  '2️⃣ Ver mis citas',
  '3️⃣ Cancelar una cita',
  '4️⃣ Horario e información',
  '5️⃣ Hablar con la doctora',
  '',
  'Escribe el número de la opción. Cuando quieras volver aquí, escribe *menu*.',
].join('\n');

const saludo = (aj) => `${(aj?.mensaje_bienvenida || '👋 Hola, soy el asistente de *Clínica Dra. Mayela González*. ¿En qué te puedo ayudar?').trim()}\n\n${MENU}`;

const esNumero = (t, max) => {
  if (!/^\d{1,2}$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= max ? n : null;
};

// textoHorario ya termina en "p. m.": evita el doble punto final
const fin = (t) => (t.endsWith('.') ? t : `${t}.`);
const lista = (items) => items.map((x, i) => `${i + 1}️⃣ ${x}`).join('\n');
const SEPARADOR_DIAS = 24 * 3_600_000;

/**
 * Procesa un mensaje entrante y devuelve lo que hay que responder.
 * @returns {{ respuestas: string[], motivo?: string }}
 */
export async function procesar(repo, { clave, telefono, texto, ahora = new Date() }) {
  const aj = await repo.ajustes();
  if (!aj?.bot_activo) return { respuestas: [], motivo: 'bot_inactivo' };
  const cfg = configDesdeAjustes(aj);

  const ses = await repo.sesion(clave);
  if (ses?.pausado_hasta && new Date(ses.pausado_hasta) > ahora) return { respuestas: [], motivo: 'pausado' };
  const vencida = !ses?.actualizado_en || ahora.getTime() - new Date(ses.actualizado_en).getTime() > EXPIRA_MIN * 60_000;

  let paso = vencida ? 'menu' : ses.paso;
  let datos = vencida ? {} : { ...(ses.datos ?? {}) };
  let pausarHasta = null;
  let tel = telefono ?? datos.telefono ?? null;
  const respuestas = [];
  const decir = (...m) => respuestas.push(...m);
  const t = norm(texto);

  const hoy = () => ahoraCaracas(ahora).dia;
  const nombrePaciente = async () => (tel ? (await repo.pacientePorTelefono(tel))?.nombre : null);

  // ── Pasos reutilizables ──────────────────────────────────────────────
  // Al terminar un trámite se limpian los datos, pero se conserva el teléfono si el paciente tuvo que escribirlo
  const limpiar = () => { datos = tel && !telefono ? { telefono: tel } : {}; };
  const irMenu = () => { paso = 'opcion'; limpiar(); decir(saludo(aj)); };

  async function mostrarTratamientos() {
    const trat = await repo.tratamientosReservables();
    if (!trat.length) {
      decir('Por ahora no hay servicios para agendar por este medio. Escribe *5* para hablar con la doctora.');
      paso = 'opcion';
      return;
    }
    if (trat.length === 1) { datos.tratamiento = trat[0]; return mostrarDias(); }
    const visibles = trat.slice(0, 15);
    datos.tratamientos = visibles;
    decir(`¿Qué quieres agendar?\n\n${lista(visibles.map((x) => x.nombre))}`);
    paso = 'tratamiento';
  }

  async function ocupadosDelHorizonte() {
    const desde = ahora.toISOString();
    const hasta = new Date(ahora.getTime() + (cfg.horizonteDias + 1) * SEPARADOR_DIAS).toISOString();
    return intervalosOcupados(await repo.ocupados(desde, hasta));
  }

  async function mostrarDias() {
    const dur = datos.tratamiento.duracion_minutos || 30;
    const dias = diasDisponibles({ desde: hoy(), config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: dur, ahora, max: 6 });
    if (!dias.length) {
      decir(`No hay horarios libres en los próximos ${cfg.horizonteDias} días. Escribe *5* para hablar con la doctora.`);
      paso = 'opcion';
      return;
    }
    datos.dias = dias.map((d) => d.dia);
    decir(`📅 ¿Qué día prefieres?\n\n${lista(dias.map((d) => `${textoDia(d.dia)} (${d.slots.length} horarios)`))}`);
    paso = 'dia';
  }

  async function mostrarHoras(dia) {
    const dur = datos.tratamiento.duracion_minutos || 30;
    const slots = slotsDelDia({ dia, config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: dur, ahora });
    if (!slots.length) {
      decir('Ese día se llenó mientras escribías 😕 Elige otro día:');
      return mostrarDias();
    }
    datos.dia = dia;
    datos.horas = slots.map((s) => s.hora);
    decir(`🕐 Horarios libres el *${textoDia(dia)}*:\n\n${lista(slots.map((s) => hora12(s.hora)))}`);
    paso = 'hora';
  }

  function resumenCita() {
    const inicio = fechaHoraCaracas(datos.dia, ...datos.hora.split(':'));
    const aprob = datos.tratamiento.aprobacion_whatsapp;
    decir(
      `Esto es lo que vas a agendar:\n\n📅 *${textoCita(inicio)}*\n💆 ${datos.tratamiento.nombre}\n👤 ${datos.nombre}\n` +
      `${aprob ? '\n⚠️ Quedará como *solicitud*: la doctora la confirmará.\n' : ''}\n1️⃣ Confirmar\n2️⃣ Elegir otro horario`,
    );
    paso = 'confirmar';
  }

  async function iniciarAgendar() {
    const paciente = await repo.pacientePorTelefono(tel);
    if (paciente) {
      const futuras = await repo.citasFuturas(paciente.id);
      if (futuras.length >= cfg.maxCitasFuturas) {
        decir(`Ya tienes ${futuras.length} citas próximas (el máximo por este medio es ${cfg.maxCitasFuturas}). Escribe *2* para verlas, *3* para cancelar alguna o *5* para hablar con la doctora.`);
        paso = 'opcion';
        return;
      }
      datos.pacienteId = paciente.id;
      datos.nombre = [paciente.nombre, paciente.apellido].filter(Boolean).join(' ');
      decir(`¡Hola, ${paciente.nombre}! 😊`);
      return mostrarTratamientos();
    }
    decir('📝 Para agendar, escribe tu *nombre y apellido*.');
    paso = 'nombre';
  }

  async function crear() {
    const dur = datos.tratamiento.duracion_minutos || 30;
    const inicio = fechaHoraCaracas(datos.dia, ...datos.hora.split(':'));
    const libre = slotsDelDia({ dia: datos.dia, config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: dur, ahora }).some((s) => s.hora === datos.hora);
    if (!libre) { decir('Ese horario acaba de ocuparse 😕 Elige otro:'); return mostrarHoras(datos.dia); }

    let pacienteId = datos.pacienteId;
    const nuevo = !pacienteId;
    if (nuevo) pacienteId = (await repo.crearPaciente({ nombre: datos.nombre, telefono: formatoLocal(tel) })).id;

    const aprob = !!datos.tratamiento.aprobacion_whatsapp;
    try {
      await repo.crearCita({
        pacienteId, tratamientoId: datos.tratamiento.id, inicio, duracion: dur,
        estado: aprob ? 'pendiente' : 'confirmado', notas: `Agendada por WhatsApp (${formatoLocal(tel)})`,
      });
    } catch (e) {
      if (String(e.message).includes('horario_ocupado')) { decir('Ese horario acaba de ocuparse 😕 Elige otro:'); return mostrarHoras(datos.dia); }
      throw e;
    }

    await repo.notificar(
      aprob ? 'cita_por_aprobar_whatsapp' : 'cita_nueva_whatsapp',
      `${aprob ? 'Solicitud de cita' : 'Nueva cita'} por WhatsApp: ${datos.nombre} · ${datos.tratamiento.nombre} · ${textoCita(inicio)}`,
      { telefono: formatoLocal(tel), paciente_id: pacienteId, fecha: inicio.toISOString() },
    );
    decir(
      aprob
        ? `✅ ¡Solicitud recibida!\n📅 *${textoCita(inicio)}*\n\nLa doctora la revisará y te confirmaremos por este medio. ¡Gracias!`
        : `✅ ¡Cita confirmada!\n📅 *${textoCita(inicio)}*\n💆 ${datos.tratamiento.nombre}\n\nTe enviaremos un recordatorio el día anterior. Si necesitas cambiarla, escribe *menu*.`,
    );
    if (nuevo) {
      const enlace = await repo.crearFicha(pacienteId);
      if (enlace) decir(`📋 Como es tu primera vez, ayúdanos a prepararte: completa tu ficha de ingreso (3 minutos) aquí:\n${enlace}`);
    }
    paso = 'opcion';
    limpiar();
  }

  async function misCitas() {
    const paciente = await repo.pacientePorTelefono(tel);
    if (!paciente) { decir('No encontramos tu número registrado. Agenda tu primera cita con la opción *1*.'); return; }
    const futuras = await repo.citasFuturas(paciente.id);
    if (!futuras.length) { decir('No tienes citas próximas. Escribe *1* para agendar una.'); return; }
    decir(`📋 Tus próximas citas:\n\n${futuras.slice(0, 5).map((c) => `• *${textoCita(c.fecha_hora)}* — ${c.tratamiento?.nombre || 'Consulta'} (${c.estado === 'confirmado' ? 'confirmada' : 'por confirmar'})`).join('\n')}`);
  }

  async function iniciarCancelar() {
    const paciente = await repo.pacientePorTelefono(tel);
    if (!paciente) { decir('No encontramos tu número registrado.'); return; }
    const futuras = await repo.citasFuturas(paciente.id);
    if (!futuras.length) { decir('No tienes citas próximas para cancelar.'); return; }
    datos.citas = futuras.slice(0, 5).map((c) => ({ id: c.id, fecha_hora: c.fecha_hora, nombre: c.tratamiento?.nombre || 'Consulta' }));
    if (datos.citas.length === 1) return pedirConfirmarCancelacion(datos.citas[0]);
    decir(`¿Cuál cita quieres cancelar?\n\n${lista(datos.citas.map((c) => `${textoCita(c.fecha_hora)} — ${c.nombre}`))}`);
    paso = 'cancelar_elegir';
  }

  function pedirConfirmarCancelacion(cita) {
    const horas = (new Date(cita.fecha_hora).getTime() - ahora.getTime()) / 3_600_000;
    if (horas < cfg.cancelarHoras) {
      decir(`Tu cita del *${textoCita(cita.fecha_hora)}* es en menos de ${cfg.cancelarHoras} horas, así que no puedo cancelarla por aquí. Escribe *5* para hablar con la doctora.`);
      paso = 'opcion';
      return;
    }
    datos.cancelar = cita;
    decir(`¿Seguro que quieres cancelar tu cita del *${textoCita(cita.fecha_hora)}*?\n\n1️⃣ Sí, cancelarla\n2️⃣ No, mantenerla`);
    paso = 'cancelar_confirmar';
  }

  async function hablarConDoctora() {
    const nombre = (await nombrePaciente()) ?? (datos.nombre || 'Un paciente');
    await repo.notificar('chat_whatsapp', `${nombre} quiere hablar con la doctora por WhatsApp (${tel ? formatoLocal(tel) : clave}).`, { telefono: tel ?? clave });
    pausarHasta = new Date(ahora.getTime() + PAUSA_HUMANO_HORAS * 3_600_000);
    decir(`Listo 🙌 Avisé a la doctora; te responderá por aquí en cuanto pueda. Atendemos ${fin(textoHorario(cfg))}`);
    paso = 'opcion';
    limpiar();
  }

  async function ejecutarOpcion(op) {
    if (['1', '2', '3'].includes(op) && !tel) {
      datos.siguiente = op;
      decir('Para continuar necesito tu número de teléfono (con código de área). Escríbelo, por ejemplo: *0414 1234567*');
      paso = 'pedir_telefono';
      return;
    }
    switch (op) {
      case '1': return iniciarAgendar();
      case '2': return misCitas();
      case '3': return iniciarCancelar();
      case '4':
        decir(aj.bot_info?.trim() || `🕘 Atendemos ${fin(textoHorario(cfg))}\n\nPara más información escribe *5* y la doctora te responderá.`);
        return;
      case '5': return hablarConDoctora();
      default:
        decir(`No entendí tu mensaje 😅\n\n${MENU}`);
    }
  }

  // ── Máquina de estados ───────────────────────────────────────────────
  if (SALUDOS.has(t) && paso !== 'menu') {
    irMenu();
  } else {
    switch (paso) {
      case 'menu':
        if (/^[1-5]$/.test(t)) { paso = 'opcion'; await ejecutarOpcion(t); } else if (/doctora|hablar con/.test(t)) { await hablarConDoctora(); } else irMenu();
        break;

      case 'opcion':
        if (/doctora|hablar con/.test(t)) await hablarConDoctora(); else await ejecutarOpcion(t);
        break;

      case 'pedir_telefono': {
        const n = normalizarTelefono(texto);
        if (n.length < 11 || n.length > 15) { decir('No pude leer ese número 🤔 Escríbelo con código de área, por ejemplo: *0414 1234567*'); break; }
        tel = n;
        datos.telefono = n;
        const op = datos.siguiente;
        delete datos.siguiente;
        paso = 'opcion';
        await ejecutarOpcion(op);
        break;
      }

      case 'nombre': {
        const nombre = String(texto ?? '').replace(/\s+/g, ' ').trim();
        if (nombre.split(' ').length < 2 || nombre.length < 5) { decir('Por favor escribe tu *nombre y apellido* (por ejemplo: María Pérez).'); break; }
        datos.nombre = nombre.slice(0, 80);
        await mostrarTratamientos();
        break;
      }

      case 'tratamiento': {
        const n = esNumero(t, datos.tratamientos?.length ?? 0);
        if (!n) { decir(`Elige una opción escribiendo su número.\n\n${lista((datos.tratamientos ?? []).map((x) => x.nombre))}`); break; }
        datos.tratamiento = datos.tratamientos[n - 1];
        delete datos.tratamientos;
        await mostrarDias();
        break;
      }

      case 'dia': {
        const n = esNumero(t, datos.dias?.length ?? 0);
        if (!n) { decir('Elige un día escribiendo su número, o *menu* para volver.'); break; }
        await mostrarHoras(datos.dias[n - 1]);
        break;
      }

      case 'hora': {
        const n = esNumero(t, datos.horas?.length ?? 0);
        if (!n) { decir('Elige un horario escribiendo su número, o *menu* para volver.'); break; }
        datos.hora = datos.horas[n - 1];
        resumenCita();
        break;
      }

      case 'confirmar':
        if (t === '1') await crear();
        else if (t === '2') await mostrarHoras(datos.dia);
        else decir('Escribe *1* para confirmar o *2* para elegir otro horario.');
        break;

      case 'cancelar_elegir': {
        const n = esNumero(t, datos.citas?.length ?? 0);
        if (!n) { decir('Elige la cita escribiendo su número, o *menu* para volver.'); break; }
        pedirConfirmarCancelacion(datos.citas[n - 1]);
        break;
      }

      case 'cancelar_confirmar':
        if (t === '1') {
          const c = datos.cancelar;
          await repo.cancelarCita(c.id);
          await repo.notificar('cita_cancelada_whatsapp', `Cita cancelada por WhatsApp (${tel ? formatoLocal(tel) : clave}): ${textoCita(c.fecha_hora)}`, { cita_id: c.id, telefono: tel ?? clave });
          decir(`✅ Tu cita del *${textoCita(c.fecha_hora)}* fue cancelada. Escribe *1* si quieres agendar otra.`);
          paso = 'opcion';
          limpiar();
        } else if (t === '2') {
          decir('Perfecto, tu cita sigue en pie 👍');
          paso = 'opcion';
          limpiar();
        } else decir('Escribe *1* para cancelar la cita o *2* para mantenerla.');
        break;

      default:
        irMenu();
    }
  }

  await repo.guardarSesion(clave, { paso, datos, pausado_hasta: pausarHasta ? pausarHasta.toISOString() : null });
  return { respuestas };
}
