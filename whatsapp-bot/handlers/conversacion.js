// Conversación del bot con el paciente: agendar con disponibilidad real, ver y cancelar citas, información y
// traspaso a la doctora. No toca WhatsApp ni Supabase directamente: usa un "repo" (ver repo.js), por eso se prueba con un repo falso.
import { ahoraCaracas, fechaHoraCaracas } from './reminderSchedule.js';
import { configDesdeAjustes, diasDisponibles, intervalosOcupados, slotsDelDia } from './disponibilidad.js';
import { hora12, norm, textoCita, textoDia, textoHorario } from './textos.js';
import { formatoLocal, normalizarTelefono } from './telefono.js';
import { FRASES, elegir, rellenar } from './frases.js';
import { detectarIntencion, opcionDeIntencion, diaMencionado } from './intenciones.js';
import { diaDelMes, elegirPorTexto, esNo, esSi, horaMencionada, horasCercanas } from './entendimiento.js';

export const EXPIRA_MIN = 30;
export const PAUSA_HUMANO_HORAS = 3;

const SALUDOS = new Set(['inicio', 'hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches']);
// Estas palabras sí muestran la lista de opciones
const PIDE_MENU = new Set(['menu', 'ayuda', '0', 'opciones']);

const MENU = [
  '1️⃣ Agendar una cita',
  '2️⃣ Ver mis citas',
  '3️⃣ Cancelar una cita',
  '4️⃣ Horario e información',
  '5️⃣ Hablar con la doctora',
  '',
  'Escriba el número de la opción deseada. Para volver a este menú en cualquier momento, escriba *menu*.',
].join('\n');

// El saludo no lleva menú: el paciente escribe con sus palabras (ver intenciones.js). El menú se muestra al pedirlo o si no se le entiende.
const saludo = (aj) => (aj?.mensaje_bienvenida || 'Bienvenido(a) a la *Clínica Dra. Mayela González*. Soy su asistente de inteligencia artificial y con gusto le atenderé. ¿En qué puedo ayudarle?').trim();
const conMenu = `Con gusto. Estas son las opciones disponibles:\n\n${MENU}`;

// textoHorario ya termina en "p. m.": evita el doble punto final
const fin = (t) => (t.endsWith('.') ? t : `${t}.`);
const SEPARADOR_DIAS = 24 * 3_600_000;

// Señales de posible complicación tras un tratamiento estético. Se evalúan sobre texto normalizado (minúsculas, sin tildes).
// "urgente" a secas NO cuenta (p. ej. "necesito una cita urgente"): debe describir un síntoma.
const PATRONES_URGENCIA = [
  /(no puedo|dificultad(es)?( para| al)?|me cuesta|falta de) (respirar|tragar|aire)|me ahogo|ahogo/,
  /dolor (muy |demasiado |super |bien |tan )?(fuerte|intenso|insoportable|severo|terrible)|insoportable|dolor (que )?(aumenta|va en aumento)/,
  /(cara|labio|labios|lengua|garganta|ojo|ojos|parpado|parpados|cuello) (muy |demasiado |super )?(hinchad|inflamad)|(muy|demasiado|super) hinchad|se me hincho (mucho|la cara|el labio)/,
  /fiebre|escalofrios/,
  /sangr(a|ado|ando|e|an)\b|hemorragia/,
  /(vision|veo) (borros|doble|nublad)|vision doble|perdi (la )?vision|no veo (bien|nada)/,
  /(piel|zona|labio|labios|nariz|frente|mejilla|cara) (esta |se ve |se puso |se ha puesto |me quedo )?(morad|palid|blanquecin|negr|oscur|grisace|amoratad)|necrosis/,
  /ampolla|\bpus\b|supura|secrecion|infeccion|infectad/,
  /reaccion alergica|me dio alergia|ronchas|urticaria|anafilax/,
  /desmay|mareo (muy )?fuerte|dolor (en el )?pecho|presion en el pecho/,
  /emergencia|me siento muy mal|me siento fatal/,
];
export const detectarUrgencia = (t) => t.length > 3 && !/^\d+$/.test(t) && PATRONES_URGENCIA.some((p) => p.test(t));

/**
 * Procesa un mensaje entrante y devuelve lo que hay que responder.
 * @returns {{ respuestas: string[], motivo?: string }}
 */
export async function procesar(repo, { clave, telefono, texto, ahora = new Date(), azar = Math.random }) {
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
  const irMenu = () => { paso = 'opcion'; limpiar(); decir(conMenu); };

  /** Primer contacto o saludo: "Buenos días, Willian." + bienvenida + menú */
  async function irMenuConSaludo() {
    const nombre = (await nombrePaciente())?.trim();
    const h = ahoraCaracas(ahora).hora;
    const momento = h < '12:00' ? 'saludoManana' : h < '19:00' ? 'saludoTarde' : 'saludoNoche';
    const { conNombre, sinNombre } = FRASES[momento];
    const encabezado = rellenar(elegir(nombre ? conNombre : sinNombre, azar), { nombre });
    paso = 'opcion';
    limpiar();
    decir(`${encabezado} ${saludo(aj)}`);
  }

  /** Lo que el paciente quiso decir con palabras propias (ver intenciones.js) */
  async function porIntencion(id) {
    paso = 'opcion';
    switch (id) {
      case 'gracias': return decir(elegir(FRASES.gracias, azar));
      case 'despedida': return decir(elegir(FRASES.despedida, azar));
      case 'cambiar': decir(elegir(FRASES.cambiarCita, azar)); return ejecutarOpcion('3');
      case 'agendar': {
        datos.diaPref = diaMencionado(texto, hoy());
        const h = horaMencionada(texto);
        if (datos.diaPref && h?.explicita) datos.horaPref = h.candidatas;
        return ejecutarOpcion('1');
      }
      default: return ejecutarOpcion(opcionDeIntencion(id));
    }
  }

  async function mostrarTratamientos() {
    const trat = await repo.tratamientosReservables();
    if (!trat.length) {
      decir('Por el momento no hay servicios disponibles para agendar por este medio. Si lo desea, puedo comunicarle con la doctora.');
      paso = 'opcion';
      return;
    }
    if (trat.length === 1) { datos.tratamiento = trat[0]; return mostrarDias(); }
    const visibles = trat.slice(0, 15);
    datos.tratamientos = visibles;
    decir(`¿Qué servicio desea agendar? Contamos con:\n\n${visibles.map((x) => `• ${x.nombre}`).join('\n')}\n\nPuede escribirme el nombre del servicio.`);
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
      decir(`No hay horarios disponibles en los próximos ${cfg.horizonteDias} días. Si lo desea, puedo comunicarle con la doctora.`);
      paso = 'opcion';
      return;
    }
    datos.dias = dias.map((d) => d.dia);
    const pref = datos.diaPref;
    const horaPref = datos.horaPref;
    delete datos.diaPref;
    delete datos.horaPref;
    if (pref) {
      const libres = slotsDelDia({ dia: pref, config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: dur, ahora });
      if (libres.length) {
        const hp = horaPref?.find((c) => libres.some((x) => x.hora === c));
        if (hp) { datos.dia = pref; datos.hora = hp; return resumenCita(); }
        decir(rellenar(elegir(FRASES.diaEntendido, azar), { dia: textoDia(pref) }));
        return mostrarHoras(pref);
      }
      decir(elegir(FRASES.diaNoDisponible, azar));
    }
    decir(`📅 Tengo disponibilidad estos días:\n\n${dias.map((d) => `• ${textoDia(d.dia)}`).join('\n')}\n\n¿Cuál le conviene? Puede decirme, por ejemplo, "el jueves" o "mañana".`);
    paso = 'dia';
  }

  async function mostrarHoras(dia) {
    const dur = datos.tratamiento.duracion_minutos || 30;
    const slots = slotsDelDia({ dia, config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: dur, ahora });
    if (!slots.length) {
      decir('Ese día acaba de completarse. Por favor elija otro día:');
      return mostrarDias();
    }
    datos.dia = dia;
    datos.horas = slots.map((s) => s.hora);
    decir(`🕐 El *${textoDia(dia)}* tengo estos horarios disponibles:\n\n${slots.map((x) => hora12(x.hora)).join(' · ')}\n\n¿A qué hora le conviene? Puede escribirme, por ejemplo, "10" o "3:30 pm".`);
    paso = 'hora';
  }

  function resumenCita() {
    const inicio = fechaHoraCaracas(datos.dia, ...datos.hora.split(':'));
    const aprob = datos.tratamiento.aprobacion_whatsapp;
    decir(
      `Estos son los datos de su cita:\n\n📅 *${textoCita(inicio)}*\n💆 ${datos.tratamiento.nombre}\n👤 ${datos.nombre}\n` +
      `${aprob ? '\nNota: quedará como *solicitud* y la doctora la confirmará a la brevedad.\n' : ''}\n¿Desea confirmarla? Responda *sí* para confirmar, o dígame otro día u hora.`,
    );
    paso = 'confirmar';
  }

  async function iniciarAgendar() {
    const paciente = await repo.pacientePorTelefono(tel);
    if (paciente) {
      const futuras = await repo.citasFuturas(paciente.id);
      if (futuras.length >= cfg.maxCitasFuturas) {
        decir(`Usted ya tiene ${futuras.length} citas próximas (el máximo por este medio es ${cfg.maxCitasFuturas}). Puede pedirme ver sus citas, cancelar alguna o hablar con la doctora.`);
        paso = 'opcion';
        return;
      }
      datos.pacienteId = paciente.id;
      datos.nombre = [paciente.nombre, paciente.apellido].filter(Boolean).join(' ');
      decir(`Es un gusto saludarle, ${paciente.nombre}.`);
      return mostrarTratamientos();
    }
    decir('📝 Para agendar su cita, indíquenos su *nombre y apellido*.');
    paso = 'nombre';
  }

  async function crear() {
    const dur = datos.tratamiento.duracion_minutos || 30;
    const inicio = fechaHoraCaracas(datos.dia, ...datos.hora.split(':'));
    const libre = slotsDelDia({ dia: datos.dia, config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: dur, ahora }).some((s) => s.hora === datos.hora);
    if (!libre) { decir('Ese horario acaba de ser tomado. Por favor elija otro:'); return mostrarHoras(datos.dia); }

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
      if (String(e.message).includes('horario_ocupado')) { decir('Ese horario acaba de ser tomado. Por favor elija otro:'); return mostrarHoras(datos.dia); }
      throw e;
    }

    await repo.notificar(
      aprob ? 'cita_por_aprobar_whatsapp' : 'cita_nueva_whatsapp',
      `${aprob ? 'Solicitud de cita' : 'Nueva cita'} por WhatsApp: ${datos.nombre} · ${datos.tratamiento.nombre} · ${textoCita(inicio)}`,
      { telefono: formatoLocal(tel), paciente_id: pacienteId, fecha: inicio.toISOString(), nombre: datos.nombre, tratamiento: datos.tratamiento.nombre, cuando: textoCita(inicio) },
    );
    decir(
      aprob
        ? `✅ Su solicitud ha sido recibida.\n📅 *${textoCita(inicio)}*\n\nLa doctora la revisará y le confirmaremos por este medio. Gracias por su confianza.`
        : `✅ Su cita ha sido confirmada.\n📅 *${textoCita(inicio)}*\n💆 ${datos.tratamiento.nombre}\n\nLe enviaremos un recordatorio el día anterior. Si necesita modificarla, solo dígamelo.`,
    );
    if (nuevo) {
      const enlace = await repo.crearFicha(pacienteId);
      if (enlace) decir(`📋 Por ser su primera visita, le agradecemos completar su ficha de ingreso (toma unos 3 minutos) en el siguiente enlace:\n${enlace}`);
    }
    paso = 'opcion';
    limpiar();
  }

  async function misCitas() {
    const paciente = await repo.pacientePorTelefono(tel);
    if (!paciente) { decir('No encontramos su número registrado. Con gusto le agendo su primera cita: dígame qué día le conviene.'); return; }
    const futuras = await repo.citasFuturas(paciente.id);
    if (!futuras.length) { decir('No tiene citas próximas. Si desea agendar una, dígame qué día le conviene.'); return; }
    decir(`📋 Sus próximas citas:\n\n${futuras.slice(0, 5).map((c) => `• *${textoCita(c.fecha_hora)}* — ${c.tratamiento?.nombre || 'Consulta'} (${c.estado === 'confirmado' ? 'confirmada' : 'por confirmar'})`).join('\n')}`);
  }

  async function iniciarCancelar() {
    const paciente = await repo.pacientePorTelefono(tel);
    if (!paciente) { decir('No encontramos su número registrado.'); return; }
    const futuras = await repo.citasFuturas(paciente.id);
    if (!futuras.length) { decir('No tiene citas próximas para cancelar.'); return; }
    datos.citas = futuras.slice(0, 5).map((c) => ({ id: c.id, fecha_hora: c.fecha_hora, nombre: c.tratamiento?.nombre || 'Consulta' }));
    if (datos.citas.length === 1) return pedirConfirmarCancelacion(datos.citas[0]);
    decir(`¿Cuál cita desea cancelar?\n\n${datos.citas.map((c) => `• ${textoCita(c.fecha_hora)} — ${c.nombre}`).join('\n')}\n\nPuede decirme el día, o "la primera", "la segunda"…`);
    paso = 'cancelar_elegir';
  }

  function pedirConfirmarCancelacion(cita) {
    const horas = (new Date(cita.fecha_hora).getTime() - ahora.getTime()) / 3_600_000;
    if (horas < cfg.cancelarHoras) {
      decir(`Su cita del *${textoCita(cita.fecha_hora)}* es en menos de ${cfg.cancelarHoras} horas, por lo que no es posible cancelarla por este medio. Si lo desea, puedo comunicarle con la doctora.`);
      paso = 'opcion';
      return;
    }
    datos.cancelar = cita;
    decir(`¿Confirma que desea cancelar su cita del *${textoCita(cita.fecha_hora)}*? Responda *sí* o *no*.`);
    paso = 'cancelar_confirmar';
  }

  async function hablarConDoctora() {
    const nombre = (await nombrePaciente()) ?? (datos.nombre || 'Un paciente');
    await repo.notificar('chat_whatsapp', `${nombre} quiere hablar con la doctora por WhatsApp (${tel ? formatoLocal(tel) : clave}).`, { telefono: tel ? formatoLocal(tel) : clave, nombre });
    pausarHasta = new Date(ahora.getTime() + PAUSA_HUMANO_HORAS * 3_600_000);
    decir(`Hemos notificado a la doctora; le responderá por este medio tan pronto le sea posible. Nuestro horario de atención es ${fin(textoHorario(cfg))}`);
    paso = 'opcion';
    limpiar();
  }

  async function ejecutarOpcion(op) {
    if (['1', '2', '3'].includes(op) && !tel) {
      datos.siguiente = op;
      decir('Para continuar necesitamos su número de teléfono (con código de área). Por favor escríbalo, por ejemplo: *0414 1234567*');
      paso = 'pedir_telefono';
      return;
    }
    switch (op) {
      case '1': return iniciarAgendar();
      case '2': return misCitas();
      case '3': return iniciarCancelar();
      case '4': {
        const c = await repo.consultorio?.();
        const base = aj.bot_info?.trim() || `🕘 Nuestro horario de atención es ${fin(textoHorario(cfg))}`;
        const direccion = c?.direccion && !base.includes(c.direccion) ? `\n📍 ${c.direccion}` : '';
        decir(`${base}${direccion}${aj.bot_info?.trim() ? '' : '\n\nSi necesita más información, puedo comunicarle con la doctora.'}`);
        return;
      }
      case '5': return hablarConDoctora();
      default:
        decir(`${elegir(FRASES.noEntendi, azar)}\n\n${MENU}`);
    }
  }

  async function sintomasUrgentes() {
    const nombre = (await nombrePaciente()) ?? (datos.nombre || 'Un paciente');
    await repo.notificar('sintomas_urgentes', `${nombre} refiere posibles síntomas urgentes por WhatsApp (${tel ? formatoLocal(tel) : clave}).`, {
      telefono: tel ? formatoLocal(tel) : clave, nombre, texto: String(texto).replace(/\s+/g, ' ').trim().slice(0, 300),
    });
    pausarHasta = new Date(ahora.getTime() + PAUSA_HUMANO_HORAS * 3_600_000);
    decir(
      'Lamentamos mucho lo que describe. Hemos avisado de inmediato a la doctora y se comunicará con usted tan pronto le sea posible.\n\n' +
      '⚠️ Si presenta dificultad para respirar o tragar, dolor muy intenso, cambios en la visión o la piel pálida o morada, acuda ahora mismo al centro de salud más cercano.',
    );
    paso = 'opcion';
    limpiar();
  }

  // ── Máquina de estados ───────────────────────────────────────────────
  if (detectarUrgencia(t)) {
    await sintomasUrgentes();
  } else if (PIDE_MENU.has(t)) {
    irMenu();
  } else if (SALUDOS.has(t) && paso !== 'menu') {
    await irMenuConSaludo();
  } else {
    switch (paso) {
      case 'menu':
        if (/^[1-5]$/.test(t)) { paso = 'opcion'; await ejecutarOpcion(t); } else {
          const id = detectarIntencion(texto);
          if (id && id !== 'gracias' && id !== 'despedida') await porIntencion(id); else await irMenuConSaludo();
        }
        break;

      case 'opcion':
        { const id = detectarIntencion(texto); if (id) await porIntencion(id); else await ejecutarOpcion(t); }
        break;

      case 'pedir_telefono': {
        const n = normalizarTelefono(texto);
        if (n.length < 11 || n.length > 15) { decir('No pude interpretar ese número. Por favor escríbalo con código de área, por ejemplo: *0414 1234567*'); break; }
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
        if (nombre.split(' ').length < 2 || nombre.length < 5) { decir('Por favor indíquenos su *nombre y apellido* (por ejemplo: María Pérez).'); break; }
        datos.nombre = nombre.slice(0, 80);
        await mostrarTratamientos();
        break;
      }

      case 'tratamiento': {
        const x = elegirPorTexto(texto, datos.tratamientos ?? [], (i) => i.nombre);
        if (!x) { decir(`No logré identificar el servicio. Puede escribirme su nombre, por ejemplo: "${datos.tratamientos?.[0]?.nombre ?? 'consulta'}".`); break; }
        datos.tratamiento = x;
        delete datos.tratamientos;
        await mostrarDias();
        break;
      }

      case 'dia': {
        const dias = datos.dias ?? [];
        const dur = datos.tratamiento.duracion_minutos || 30;
        const mencionado = diaMencionado(texto, hoy());
        if (mencionado) {
          const libres = slotsDelDia({ dia: mencionado, config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: dur, ahora });
          if (libres.length) { await mostrarHoras(mencionado); break; }
          decir(`${elegir(FRASES.diaNoDisponible, azar)}\n\n${dias.map((d) => `• ${textoDia(d)}`).join('\n')}`);
          break;
        }
        const elegido = diaDelMes(texto, dias);
        if (!elegido) { decir('No logré identificar el día. Puede decirme, por ejemplo, "el jueves", "mañana" o "el 22".'); break; }
        await mostrarHoras(elegido);
        break;
      }

      case 'hora': {
        const horas = datos.horas ?? [];
        const otroDia = diaMencionado(texto, hoy());
        if (otroDia && otroDia !== datos.dia) { await mostrarHoras(otroDia); break; }
        const h = horaMencionada(texto, horas);
        if (!h) { decir('No logré entender la hora. Puede escribirme, por ejemplo, "10" o "3:30 pm".'); break; }
        if (!h.valida) {
          decir(`Ese horario no está disponible. Los más cercanos son ${horasCercanas(h.hora, horas).map(hora12).join(' y ')}. ¿Cuál prefiere?`);
          break;
        }
        datos.hora = h.hora;
        resumenCita();
        break;
      }

      case 'confirmar': {
        if (esSi(texto)) { await crear(); break; }
        if (esNo(texto)) { await mostrarHoras(datos.dia); break; }
        const nuevoDia = diaMencionado(texto, hoy());
        const libres = slotsDelDia({ dia: datos.dia, config: cfg, ocupados: await ocupadosDelHorizonte(), duracionMin: datos.tratamiento.duracion_minutos || 30, ahora }).map((x) => x.hora);
        const h = horaMencionada(texto, libres);
        if (nuevoDia && nuevoDia !== datos.dia) await mostrarHoras(nuevoDia);
        else if (h?.valida && h.explicita) { datos.hora = h.hora; resumenCita(); }
        else decir('¿Desea confirmar su cita? Responda *sí* para confirmar, o dígame otro día u hora.');
        break;
      }

      case 'cancelar_elegir': {
        const citas = datos.citas ?? [];
        const dia = diaMencionado(texto, hoy());
        const c = (dia && citas.find((x) => ahoraCaracas(new Date(x.fecha_hora)).dia === dia)) || elegirPorTexto(texto, citas, (x) => `${textoCita(x.fecha_hora)} ${x.nombre}`);
        if (!c) { decir('No logré identificar cuál cita. Puede decirme el día, o "la primera", "la segunda"…'); break; }
        pedirConfirmarCancelacion(c);
        break;
      }

      case 'cancelar_confirmar':
        if (esSi(texto)) {
          const c = datos.cancelar;
          await repo.cancelarCita(c.id);
          await repo.notificar('cita_cancelada_whatsapp', `Cita cancelada por WhatsApp (${tel ? formatoLocal(tel) : clave}): ${textoCita(c.fecha_hora)}`, { cita_id: c.id, telefono: tel ? formatoLocal(tel) : clave, nombre: (await nombrePaciente()) ?? datos.nombre ?? undefined, cuando: textoCita(c.fecha_hora) });
          decir(`✅ Su cita del *${textoCita(c.fecha_hora)}* ha sido cancelada. Si desea agendar otra, solo dígamelo.`);
          paso = 'opcion';
          limpiar();
        } else if (esNo(texto)) {
          decir('Entendido, su cita se mantiene.');
          paso = 'opcion';
          limpiar();
        } else decir('¿Desea cancelar la cita? Responda *sí* para cancelarla o *no* para mantenerla.');
        break;

      default:
        irMenu();
    }
  }

  await repo.guardarSesion(clave, { paso, datos, pausado_hasta: pausarHasta ? pausarHasta.toISOString() : null });
  return { respuestas };
}
