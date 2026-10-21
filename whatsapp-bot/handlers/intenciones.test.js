import test from 'node:test';
import assert from 'node:assert/strict';
import { detectarIntencion, diaMencionado } from './intenciones.js';
import { elegir, rellenar, FRASES } from './frases.js';
import { procesar } from './conversacion.js';
import { mismoTelefono } from './telefono.js';

// Lunes 19 de octubre de 2026, 09:00 Caracas
const AHORA = new Date('2026-10-19T13:00:00Z');
const TARDE = new Date('2026-10-19T19:00:00Z'); // 15:00
const CONSULTA = { id: 't1', nombre: 'Consulta de valoración', duracion_minutos: 60, aprobacion_whatsapp: false };
const WILLIAN = { id: 'p1', nombre: 'Willian', apellido: 'Blanco', telefono: '0414-433.4584' };
const KEY = '584144334584';

function repoFalso({ pacientes = [] } = {}) {
  const sesiones = {};
  const log = { notificaciones: [] };
  return {
    log,
    async ajustes() { return { bot_activo: true, mensaje_bienvenida: 'Bienvenido(a) a la clínica.' }; },
    async sesion(c) { return sesiones[c] ?? null; },
    async guardarSesion(c, s) { sesiones[c] = { ...s, actualizado_en: AHORA.toISOString() }; },
    async pacientePorTelefono(tel) { return pacientes.find((p) => mismoTelefono(p.telefono, tel)) ?? null; },
    async tratamientosReservables() { return [CONSULTA]; },
    async ocupados() { return []; },
    async citasFuturas() { return []; },
    async notificar(tipo, mensaje) { log.notificaciones.push({ tipo, mensaje }); },
  };
}
const dec = (repo, texto, ahora = AHORA) => procesar(repo, { clave: KEY, telefono: KEY, texto, ahora, azar: () => 0 });
const junto = (r) => r.respuestas.join('\n');

test('entiende distintas formas de pedir lo mismo', () => {
  const casos = {
    agendar: ['quiero una cita', 'Quisiera agendar una consulta', 'necesito sacar cita para el jueves', 'tienen disponibilidad?', 'deseo una valoración'],
    ver_citas: ['cuándo es mi cita', 'tengo cita?', 'ver mis citas'],
    cancelar: ['quiero cancelar mi cita', 'ya no puedo ir', 'anular la cita'],
    cambiar: ['quiero cambiar mi cita', 'necesito reprogramar la cita'],
    info: ['a qué hora abren', 'dónde están ubicados', 'cuánto cuesta el botox', 'qué tratamientos tienen'],
    doctora: ['quiero hablar con la doctora', 'necesito hablar con una persona'],
    gracias: ['muchas gracias', 'gracias!', 'muy amable'],
    despedida: ['adiós', 'hasta luego', 'eso es todo'],
  };
  for (const [id, frases] of Object.entries(casos)) {
    for (const f of frases) assert.equal(detectarIntencion(f), id, f);
  }
  for (const f of ['asdf', '1', '', 'jajaja']) assert.equal(detectarIntencion(f), null, f);
});

test('cancelar tiene prioridad sobre ver/agendar cuando dice "cancelar mi cita"', () => {
  assert.equal(detectarIntencion('quiero cancelar mi cita'), 'cancelar');
  assert.equal(detectarIntencion('cambiar mi cita'), 'cambiar');
});

test('reconoce el día pedido', () => {
  assert.equal(diaMencionado('para mañana', '2026-10-19'), '2026-10-20');
  assert.equal(diaMencionado('pasado mañana', '2026-10-19'), '2026-10-21');
  assert.equal(diaMencionado('el jueves', '2026-10-19'), '2026-10-22');
  assert.equal(diaMencionado('el lunes', '2026-10-19'), '2026-10-26'); // dicho un lunes = el próximo
  assert.equal(diaMencionado('el miércoles por la tarde', '2026-10-19'), '2026-10-21');
  assert.equal(diaMencionado('hoy', '2026-10-19'), '2026-10-19');
  assert.equal(diaMencionado('quiero una cita', '2026-10-19'), null);
});

test('frases: elegir y rellenar', () => {
  assert.equal(elegir(['a', 'b', 'c'], () => 0), 'a');
  assert.equal(elegir(['a', 'b', 'c'], () => 0.99), 'c');
  assert.equal(rellenar('Hola {nombre}', { nombre: 'Ana' }), 'Hola Ana');
  for (const k of ['gracias', 'despedida', 'noEntendi', 'cambiarCita', 'diaEntendido', 'diaNoDisponible']) assert.ok(FRASES[k].length >= 2, k);
});

test('saludo según la hora y con el nombre del paciente conocido', async () => {
  let r = await dec(repoFalso({ pacientes: [WILLIAN] }), 'hola');
  assert.match(junto(r), /^Buenos días, Willian\. Bienvenido/);
  r = await dec(repoFalso({ pacientes: [WILLIAN] }), 'buenas tardes', TARDE);
  assert.match(junto(r), /^Buenas tardes, Willian\./);
  r = await dec(repoFalso(), 'hola');
  assert.match(junto(r), /^Buenos días\. Bienvenido/);
  assert.doesNotMatch(junto(r), /Agendar una cita/); // sin menú en el saludo
});

test('"quiero una cita para el jueves" salta directo a los horarios de ese día', async () => {
  const repo = repoFalso({ pacientes: [WILLIAN] });
  const r = await dec(repo, 'Quiero una cita para el jueves');
  assert.match(junto(r), /horarios del \*jueves 22 de octubre\*|horarios para el \*jueves 22 de octubre\*/);
  assert.match(junto(r), /Horarios disponibles/);
});

test('día sin disponibilidad: lo dice y ofrece los días libres', async () => {
  const repo = repoFalso({ pacientes: [WILLIAN] });
  const r = await dec(repo, 'quiero una cita para el sábado');
  assert.match(junto(r), /(no tengo horarios|no hay horarios)/i);
  assert.match(junto(r), /Qué día prefiere/);
});

test('texto libre: cancelar, gracias y no entendido', async () => {
  const repo = repoFalso({ pacientes: [WILLIAN] });
  await dec(repo, 'hola');
  let r = await dec(repo, 'ya no puedo ir a mi cita');
  assert.match(junto(r), /No tiene citas próximas para cancelar/);
  r = await dec(repo, 'muchas gracias');
  assert.match(junto(r), /Con mucho gusto/);
  r = await dec(repo, 'blablabla');
  assert.match(junto(r), /no logré entender/);
  assert.match(junto(r), /Agendar una cita/);
});

test('"cambiar mi cita" explica el procedimiento', async () => {
  const repo = repoFalso({ pacientes: [WILLIAN] });
  await dec(repo, 'hola');
  const r = await dec(repo, 'quiero cambiar mi cita');
  assert.match(junto(r), /cancel/i);
});

test('pedir hablar con la doctora sigue avisando y pausando', async () => {
  const repo = repoFalso({ pacientes: [WILLIAN] });
  await dec(repo, 'hola');
  const r = await dec(repo, 'necesito hablar con la doctora');
  assert.match(junto(r), /notificado a la doctora/);
  assert.equal(repo.log.notificaciones[0].tipo, 'chat_whatsapp');
});
