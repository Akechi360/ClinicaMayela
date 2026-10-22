import test from 'node:test';
import assert from 'node:assert/strict';
import { esSi, esNo, elegirPorTexto, horaMencionada, horasCercanas, diaDelMes } from './entendimiento.js';
import { procesar } from './conversacion.js';
import { mismoTelefono } from './telefono.js';

const AHORA = new Date('2026-10-19T13:00:00Z'); // lunes 19 oct, 09:00 Caracas
const VALIDAS = ['10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '15:00', '15:30', '16:00'];

test('sí y no con palabras propias', () => {
  for (const f of ['sí', 'Si', 'claro que sí', 'confirmo', 'dale', 'ok', 'perfecto', 'de acuerdo', '1', 'sí, por favor']) assert.equal(esSi(f), true, f);
  for (const f of ['no', 'mejor no', 'otro horario', 'quiero cambiar', '2', 'no gracias']) assert.equal(esNo(f), true, f);
  assert.equal(esSi('no'), false);
  assert.equal(esNo('sí'), false);
  assert.equal(esSi('sinceramente'), false);
});

test('elegir un servicio por nombre, número u orden', () => {
  const items = [{ n: 'Consulta de valoración' }, { n: 'Control post tratamiento' }, { n: 'Bioestimuladores de colágeno' }];
  const n = (x) => x.n;
  assert.equal(elegirPorTexto('la consulta', items, n), items[0]);
  assert.equal(elegirPorTexto('quiero un control', items, n), items[1]);
  assert.equal(elegirPorTexto('colageno', items, n), items[2]);
  assert.equal(elegirPorTexto('2', items, n), items[1]);
  assert.equal(elegirPorTexto('la tercera', items, n), items[2]);
  assert.equal(elegirPorTexto('xyz', items, n), null);
  assert.equal(elegirPorTexto('tratamiento control consulta', items, n), null); // ambiguo
});

test('hora escrita de varias formas', () => {
  const h = (t) => horaMencionada(t, VALIDAS);
  assert.deepEqual({ ...h('10'), candidatas: undefined }, { hora: '10:00', valida: true, explicita: false, candidatas: undefined });
  assert.deepEqual({ ...h('a las 3 pm'), candidatas: undefined }, { hora: '15:00', valida: true, explicita: true, candidatas: undefined });
  assert.equal(h('3:30 pm').hora, '15:30');
  assert.equal(h('3 de la tarde').hora, '15:00');
  assert.equal(h('2').hora, '14:00'); // sin am/pm usa la que esté libre
  assert.equal(h('11 am').hora, '11:00');
  assert.equal(h('a las 11 y media').hora, '11:30');
  assert.equal(h('al mediodía').hora, '12:00');
  assert.equal(h('10 a. m.').hora, '10:00');
  assert.equal(h('4:00 p. m.').hora, '16:00');
  assert.equal(h('a las 9').valida, false);
  assert.equal(h('hola'), null);
});

test('horas más cercanas a una no disponible', () => {
  assert.deepEqual(horasCercanas('12:30', VALIDAS), ['12:00', '13:00']);
});

test('día del mes entre los días ofrecidos', () => {
  const dias = ['2026-10-21', '2026-10-22', '2026-10-23'];
  assert.equal(diaDelMes('el 22', dias), '2026-10-22');
  assert.equal(diaDelMes('22 de octubre', dias), '2026-10-22');
  assert.equal(diaDelMes('el 30', dias), null);
  assert.equal(diaDelMes('a las 3:00', dias), null);
});

// ── Conversación completa con palabras propias ───────────────────────
const CONSULTA = { id: 't1', nombre: 'Consulta de valoración', duracion_minutos: 60, aprobacion_whatsapp: false };
const WILLIAN = { id: 'p1', nombre: 'Willian', apellido: 'Blanco', telefono: '0414-433.4584' };
const KEY = '584144334584';

function repoFalso({ citas = [] } = {}) {
  const sesiones = {};
  const log = { citas: [], canceladas: [], notificaciones: [] };
  return {
    log,
    async ajustes() { return { bot_activo: true, mensaje_bienvenida: 'Bienvenido(a).' }; },
    async sesion(c) { return sesiones[c] ?? null; },
    async guardarSesion(c, s) { sesiones[c] = { ...s, actualizado_en: AHORA.toISOString() }; },
    async pacientePorTelefono(tel) { return mismoTelefono(WILLIAN.telefono, tel) ? WILLIAN : null; },
    async tratamientosReservables() { return [CONSULTA]; },
    async ocupados() { return citas; },
    async citasFuturas() { return citas.filter((c) => c.paciente_id === 'p1'); },
    async crearCita(c) { log.citas.push(c); return 'ok'; },
    async cancelarCita(id) { log.canceladas.push(id); },
    async notificar(tipo, mensaje) { log.notificaciones.push({ tipo, mensaje }); },
    async consultorio() { return { nombre: null, direccion: 'Torre de Consultorios IEQ, Los Mangos, Piso 8, Consultorio 8-5' }; },
  };
}
const dec = (repo, texto) => procesar(repo, { clave: KEY, telefono: KEY, texto, ahora: AHORA, azar: () => 0 });
const junto = (r) => r.respuestas.join('\n');

test('conversación sin números: día, hora y confirmación con palabras', async () => {
  const repo = repoFalso();
  await dec(repo, 'hola');
  let r = await dec(repo, 'quisiera una cita');
  assert.match(junto(r), /Tengo disponibilidad estos días/);
  r = await dec(repo, 'el jueves');
  assert.match(junto(r), /jueves 22 de octubre/);
  r = await dec(repo, 'a las 9 am'); // antes de abrir: ofrece las cercanas
  assert.match(junto(r), /no está disponible/);
  assert.match(junto(r), /10:00 a\. m\. y 10:30 a\. m\./);
  r = await dec(repo, 'la de 1 pm');
  assert.match(junto(r), /¿Desea confirmarla\?/);
  r = await dec(repo, 'perfecto');
  assert.match(junto(r), /cita ha sido confirmada/);
  assert.equal(repo.log.citas[0].inicio.toISOString(), '2026-10-22T17:00:00.000Z');
});

test('en un solo mensaje: "una cita el jueves a las 11" va directo al resumen', async () => {
  const repo = repoFalso();
  const r = await dec(repo, 'quiero una cita para el jueves a las 11');
  assert.match(junto(r), /jueves 22 de octubre, 11:00 a\. m\./);
  assert.match(junto(r), /¿Desea confirmarla\?/);
});

test('en el resumen puede cambiar el horario escribiendo otro', async () => {
  const repo = repoFalso();
  await dec(repo, 'quiero una cita para el jueves a las 11');
  let r = await dec(repo, 'mejor a las 3 pm');
  assert.match(junto(r), /3:00 p\. m\./);
  r = await dec(repo, 'no');
  assert.match(junto(r), /tengo estos horarios disponibles/);
});

test('cancelar con palabras: elige por día y confirma con "sí"', async () => {
  const citas = [
    { id: 'a', paciente_id: 'p1', fecha_hora: '2026-10-23T15:00:00Z', estado: 'confirmado', duracion_minutos: 30, tratamiento: { nombre: 'Consulta' } },
    { id: 'b', paciente_id: 'p1', fecha_hora: '2026-10-27T15:00:00Z', estado: 'confirmado', duracion_minutos: 30, tratamiento: { nombre: 'Control' } },
  ];
  const repo = repoFalso({ citas });
  await dec(repo, 'hola');
  let r = await dec(repo, 'necesito cancelar mi cita');
  assert.match(junto(r), /¿Cuál cita desea cancelar\?/);
  r = await dec(repo, 'la del martes');
  assert.match(junto(r), /martes 27 de octubre/);
  r = await dec(repo, 'sí');
  assert.match(junto(r), /ha sido cancelada/);
  assert.deepEqual(repo.log.canceladas, ['b']);
});

test('horario e información incluye la dirección del consultorio', async () => {
  const r = await dec(repoFalso(), 'dónde están ubicados');
  assert.match(junto(r), /Torre de Consultorios IEQ/);
  assert.match(junto(r), /lunes a viernes/);
});
