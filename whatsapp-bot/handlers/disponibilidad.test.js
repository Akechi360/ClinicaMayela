import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG_POR_DEFECTO, configDesdeAjustes, diasDisponibles, diaSemanaISO, duracionEfectiva, intervalosOcupados, slotsDelDia } from './disponibilidad.js';

const cfg = { ...CONFIG_POR_DEFECTO };
// Lunes 19 de octubre de 2026, 09:00 en Caracas (13:00 UTC)
const AHORA = new Date('2026-10-19T13:00:00Z');

test('día de la semana ISO', () => {
  assert.equal(diaSemanaISO('2026-10-19'), 1); // lunes
  assert.equal(diaSemanaISO('2026-10-25'), 7); // domingo
});

test('configuración con valores por defecto seguros', () => {
  assert.deepEqual(configDesdeAjustes({}), cfg);
  const c = configDesdeAjustes({ bot_hora_apertura: '09:00:00', bot_hora_cierre: '18:30:00', bot_dias: [1, 2, 9, 0], bot_intervalo_min: 5 });
  assert.equal(c.apertura, '09:00');
  assert.equal(c.cierre, '18:30');
  assert.deepEqual(c.dias, [1, 2]);
  assert.equal(c.intervalo, 10); // mínimo permitido
});

test('horarios libres de un día: respeta apertura, cierre, duración y anticipación', () => {
  const slots = slotsDelDia({ dia: '2026-10-20', config: cfg, ocupados: [], duracionMin: 60, ahora: AHORA });
  assert.equal(slots[0].hora, '10:00');
  assert.equal(slots[slots.length - 1].hora, '16:00'); // una consulta de 60 min que empieza a las 16:00 termina a las 17:00
  assert.equal(slots.length, 13);
});

test('no ofrece horarios dentro de la anticipación mínima ni en el pasado', () => {
  // Hoy lunes 09:00 Caracas, anticipación 3 h → primer horario posible 12:00
  const slots = slotsDelDia({ dia: '2026-10-19', config: cfg, ocupados: [], duracionMin: 30, ahora: AHORA });
  assert.equal(slots[0].hora, '12:00');
});

test('no ofrece fines de semana', () => {
  assert.deepEqual(slotsDelDia({ dia: '2026-10-24', config: cfg, ocupados: [], duracionMin: 30, ahora: AHORA }), []);
});

test('excluye horarios que chocan con citas existentes (con su duración real)', () => {
  // Cita de 90 min (tratamiento) el martes 10:00 Caracas aunque la cita guarde 30 por defecto
  const ocupados = intervalosOcupados([{ fecha_hora: '2026-10-20T14:00:00Z', duracion_minutos: 30, tratamiento: { duracion_minutos: 90 } }]);
  const slots = slotsDelDia({ dia: '2026-10-20', config: cfg, ocupados, duracionMin: 60, ahora: AHORA });
  assert.equal(slots[0].hora, '11:30'); // 10:00–11:30 ocupado; una de 60 min empieza a las 11:30
});

test('una cita contigua no bloquea', () => {
  const ocupados = intervalosOcupados([{ fecha_hora: '2026-10-20T14:00:00Z', duracion_minutos: 60 }]); // 10:00–11:00
  const slots = slotsDelDia({ dia: '2026-10-20', config: cfg, ocupados, duracionMin: 60, ahora: AHORA });
  assert.equal(slots[0].hora, '11:00');
});

test('duración efectiva: la mayor entre la cita y su tratamiento', () => {
  assert.equal(duracionEfectiva({ duracion_minutos: 30, tratamiento: [{ duracion_minutos: 45 }] }), 45);
  assert.equal(duracionEfectiva({ duracion_minutos: 60 }), 60);
  assert.equal(duracionEfectiva({}), 30);
});

test('próximos días disponibles saltan fines de semana y días llenos', () => {
  const dias = diasDisponibles({ desde: '2026-10-19', config: cfg, ocupados: [], duracionMin: 60, ahora: AHORA, max: 6 });
  assert.deepEqual(dias.map((d) => d.dia), ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26']);
});
