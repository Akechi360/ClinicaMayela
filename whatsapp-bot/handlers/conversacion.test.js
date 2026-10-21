import test from 'node:test';
import assert from 'node:assert/strict';
import { procesar } from './conversacion.js';
import { mismoTelefono } from './telefono.js';

// Lunes 19 de octubre de 2026, 09:00 Caracas
const AHORA = new Date('2026-10-19T13:00:00Z');
const CONSULTA = { id: 't1', nombre: 'Consulta de valoración', duracion_minutos: 60, aprobacion_whatsapp: false };

/** Base de datos simulada con la misma interfaz que repo.js */
function crearRepoFalso({ pacientes = [], citas = [], tratamientos = [CONSULTA], ajustes = {}, sesiones = {} } = {}) {
  const log = { notificaciones: [], citasCreadas: [], canceladas: [], pacientesCreados: [], fichas: [] };
  return {
    log,
    sesiones,
    async ajustes() { return { bot_activo: true, ...ajustes }; },
    async sesion(clave) { return sesiones[clave] ?? null; },
    async guardarSesion(clave, s) { sesiones[clave] = { ...s, actualizado_en: AHORA.toISOString() }; },
    async pacientePorTelefono(tel) { return pacientes.find((p) => mismoTelefono(p.telefono, tel)) ?? null; },
    async tratamientosReservables() { return tratamientos; },
    async ocupados() { return citas.filter((c) => !['cancelado', 'completado'].includes(c.estado)); },
    async citasFuturas(id) { return citas.filter((c) => c.paciente_id === id && !['cancelado', 'completado'].includes(c.estado) && new Date(c.fecha_hora) > AHORA); },
    async crearPaciente(p) { const n = { id: 'nuevo-' + log.pacientesCreados.length, ...p }; log.pacientesCreados.push(n); return n; },
    async crearCita(c) {
      log.citasCreadas.push(c);
      citas.push({ id: 'c' + citas.length, paciente_id: c.pacienteId, fecha_hora: c.inicio.toISOString(), duracion_minutos: c.duracion, estado: c.estado, tratamiento: { duracion_minutos: c.duracion } });
      return 'c-ok';
    },
    async cancelarCita(id) { log.canceladas.push(id); },
    async notificar(tipo, mensaje) { log.notificaciones.push({ tipo, mensaje }); },
    async crearFicha(pid) { log.fichas.push(pid); return 'https://app.test/f/TOKEN'; },
  };
}

const KEY = '584144334584';
const decir = (repo, texto, extra = {}) => procesar(repo, { clave: KEY, telefono: KEY, texto, ahora: AHORA, ...extra });
const junto = (r) => r.respuestas.join('\n');

const WILLIAN = { id: 'p1', nombre: 'Willian', apellido: 'Blanco', telefono: '0414-433.4584' };

test('bot apagado: no responde nada', async () => {
  const repo = crearRepoFalso({ ajustes: { bot_activo: false } });
  const r = await decir(repo, 'hola');
  assert.deepEqual(r.respuestas, []);
  assert.equal(r.motivo, 'bot_inactivo');
});

test('saludo muestra el menú', async () => {
  const repo = crearRepoFalso();
  const r = await decir(repo, 'Hola');
  assert.match(junto(r), /Agendar una cita/);
  assert.match(junto(r), /Hablar con la doctora/);
});

test('paciente existente (teléfono en otro formato) agenda y queda confirmada', async () => {
  const repo = crearRepoFalso({ pacientes: [WILLIAN] });
  await decir(repo, 'hola');
  let r = await decir(repo, '1');
  assert.match(junto(r), /gusto saludarle, Willian/);
  assert.match(junto(r), /Qué día prefiere/); // un solo servicio: se salta la elección
  r = await decir(repo, '1'); // primer día disponible (hoy a partir de las 12:00)
  assert.match(junto(r), /Horarios disponibles/);
  r = await decir(repo, '1');
  assert.match(junto(r), /Confirmar/);
  r = await decir(repo, '1');
  assert.match(junto(r), /cita ha sido confirmada/);
  assert.equal(repo.log.citasCreadas.length, 1);
  assert.equal(repo.log.citasCreadas[0].estado, 'confirmado');
  assert.equal(repo.log.citasCreadas[0].pacienteId, 'p1');
  assert.equal(repo.log.pacientesCreados.length, 0); // no se duplica el paciente
  assert.equal(repo.log.fichas.length, 0); // no es nuevo: no se envía ficha
  assert.equal(repo.log.notificaciones[0].tipo, 'cita_nueva_whatsapp');
});

test('paciente nuevo: pide nombre y apellido, lo registra solo al confirmar y envía la ficha', async () => {
  const repo = crearRepoFalso();
  await decir(repo, 'hola');
  let r = await decir(repo, '1');
  assert.match(junto(r), /nombre y apellido/);
  r = await decir(repo, 'María');
  assert.match(junto(r), /nombre y apellido/); // una sola palabra no basta
  assert.equal(repo.log.pacientesCreados.length, 0);
  await decir(repo, 'María Pérez');
  await decir(repo, '1');
  await decir(repo, '1');
  assert.equal(repo.log.pacientesCreados.length, 0); // aún no confirmó
  r = await decir(repo, '1');
  assert.equal(repo.log.pacientesCreados.length, 1);
  assert.equal(repo.log.pacientesCreados[0].telefono, '04144334584');
  assert.match(junto(r), /ficha de ingreso/);
  assert.match(junto(r), /https:\/\/app\.test\/f\/TOKEN/);
});

test('no ofrece horarios ocupados', async () => {
  // Martes 20, cita de 10:00 a 11:00 (Caracas)
  const repo = crearRepoFalso({ pacientes: [WILLIAN], citas: [{ id: 'x', paciente_id: 'otro', fecha_hora: '2026-10-20T14:00:00Z', duracion_minutos: 60, estado: 'confirmado' }] });
  await decir(repo, '1'); // agendar: muestra los días
  const r = await decir(repo, '2'); // segundo día = martes 20
  assert.match(junto(r), /martes 20 de octubre/);
  assert.doesNotMatch(junto(r), /10:00 a\. m\./);
  assert.match(junto(r), /11:00 a\. m\./);
});

test('límite de citas próximas por paciente', async () => {
  const futuras = [1, 2].map((n) => ({ id: 'f' + n, paciente_id: 'p1', fecha_hora: `2026-10-2${n}T15:00:00Z`, estado: 'confirmado', duracion_minutos: 30 }));
  const repo = crearRepoFalso({ pacientes: [WILLIAN], citas: futuras });
  const r = await decir(repo, '1');
  assert.match(junto(r), /máximo/);
  assert.equal(repo.log.citasCreadas.length, 0);
});

test('tratamiento que requiere aprobación queda como solicitud', async () => {
  const repo = crearRepoFalso({ pacientes: [WILLIAN], tratamientos: [{ ...CONSULTA, aprobacion_whatsapp: true }] });
  await decir(repo, '1'); // días
  await decir(repo, '1'); // horas
  let r = await decir(repo, '1'); // resumen
  assert.match(junto(r), /solicitud/i);
  r = await decir(repo, '1');
  assert.match(junto(r), /solicitud ha sido recibida/);
  assert.equal(repo.log.citasCreadas[0].estado, 'pendiente');
  assert.equal(repo.log.notificaciones[0].tipo, 'cita_por_aprobar_whatsapp');
});

test('varios servicios: el paciente elige uno', async () => {
  const repo = crearRepoFalso({ pacientes: [WILLIAN], tratamientos: [CONSULTA, { id: 't2', nombre: 'Control', duracion_minutos: 30, aprobacion_whatsapp: false }] });
  const r = await decir(repo, '1');
  assert.match(junto(r), /Qué servicio desea agendar/);
  assert.match(junto(r), /Control/);
  const r2 = await decir(repo, '2');
  assert.match(junto(r2), /Qué día prefiere/);
});

test('cancelar: una cita lejana se cancela con confirmación', async () => {
  const cita = { id: 'c9', paciente_id: 'p1', fecha_hora: '2026-10-23T15:00:00Z', estado: 'confirmado', duracion_minutos: 30, tratamiento: { nombre: 'Consulta' } };
  const repo = crearRepoFalso({ pacientes: [WILLIAN], citas: [cita] });
  let r = await decir(repo, '3');
  assert.match(junto(r), /Confirma que desea cancelar/);
  r = await decir(repo, '1');
  assert.match(junto(r), /ha sido cancelada/);
  assert.deepEqual(repo.log.canceladas, ['c9']);
  assert.equal(repo.log.notificaciones[0].tipo, 'cita_cancelada_whatsapp');
});

test('cancelar: una cita muy próxima se deriva a la doctora', async () => {
  const cita = { id: 'c8', paciente_id: 'p1', fecha_hora: '2026-10-19T20:00:00Z', estado: 'confirmado', duracion_minutos: 30, tratamiento: { nombre: 'Consulta' } }; // en 7 h
  const repo = crearRepoFalso({ pacientes: [WILLIAN], citas: [cita] });
  const r = await decir(repo, '3');
  assert.match(junto(r), /menos de 12 horas/);
  assert.deepEqual(repo.log.canceladas, []);
});

test('ver mis citas', async () => {
  const cita = { id: 'c7', paciente_id: 'p1', fecha_hora: '2026-10-23T15:00:00Z', estado: 'confirmado', duracion_minutos: 30, tratamiento: { nombre: 'Consulta' } };
  const repo = crearRepoFalso({ pacientes: [WILLIAN], citas: [cita] });
  const r = await decir(repo, '2');
  assert.match(junto(r), /viernes 23 de octubre/);
  assert.match(junto(r), /confirmada/);
});

test('hablar con la doctora: avisa en la app y el bot se calla en ese chat', async () => {
  const repo = crearRepoFalso({ pacientes: [WILLIAN] });
  let r = await decir(repo, '5');
  assert.match(junto(r), /notificado a la doctora/);
  assert.equal(repo.log.notificaciones[0].tipo, 'chat_whatsapp');
  r = await decir(repo, 'hola, puedes verme hoy?');
  assert.deepEqual(r.respuestas, []);
  assert.equal(r.motivo, 'pausado');
  // Pasadas las 3 horas vuelve a responder
  const luego = new Date(AHORA.getTime() + 3.1 * 3_600_000);
  repo.sesiones[KEY].actualizado_en = luego.toISOString();
  r = await decir(repo, 'hola', { ahora: luego });
  assert.match(junto(r), /Agendar una cita/);
});

test('la sesión vence a los 30 minutos y vuelve al menú', async () => {
  const repo = crearRepoFalso({ pacientes: [WILLIAN] });
  await decir(repo, '1'); // queda esperando el día
  const tarde = new Date(AHORA.getTime() + 31 * 60_000);
  const r = await decir(repo, '1', { ahora: tarde }); // un "1" tras 31 min NO elige el día 1: reinicia el trámite
  assert.match(junto(r), /gusto saludarle, Willian/);
});

test('sin teléfono en el identificador (@lid): lo pide y continúa', async () => {
  const repo = crearRepoFalso({ pacientes: [WILLIAN] });
  const clave = '1234567890@lid';
  const dec = (t) => procesar(repo, { clave, telefono: null, texto: t, ahora: AHORA });
  await dec('hola');
  let r = await dec('1');
  assert.match(junto(r), /número de teléfono/);
  r = await dec('abc');
  assert.match(junto(r), /No pude interpretar/);
  r = await dec('0414 433 4584');
  assert.match(junto(r), /gusto saludarle, Willian/); // reconoce al paciente por el número que escribió
});

test('opción inválida: no rompe el flujo', async () => {
  const repo = crearRepoFalso({ pacientes: [WILLIAN] });
  await decir(repo, 'hola');
  const r = await decir(repo, 'blabla');
  assert.match(junto(r), /(logré (entender|interpretar)|no estoy seguro)/i);
});

test('horario e información usa el horario configurado', async () => {
  const repo = crearRepoFalso();
  const r = await decir(repo, '4');
  assert.match(junto(r), /lunes a viernes de 10:00 a\. m\. a 5:00 p\. m\./);
  const repo2 = crearRepoFalso({ ajustes: { bot_info: 'Estamos en el Edif. Ejemplo, piso 2.' } });
  assert.match(junto(await decir(repo2, '4')), /Edif\. Ejemplo/);
});
