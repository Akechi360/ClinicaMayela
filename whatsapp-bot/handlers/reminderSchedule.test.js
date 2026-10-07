// Ejecutar con: node --test handlers/
import test from 'node:test';
import assert from 'node:assert/strict';
import { ahoraCaracas, correspondenRecordatorios, diaSiguiente, fechaHoraCaracas, textoFechaHora } from './reminderSchedule.js';

test('día y hora de Caracas desde UTC', () => {
  assert.deepEqual(ahoraCaracas(new Date('2026-10-07T13:05:00Z')), { dia: '2026-10-07', hora: '09:05' });
  assert.deepEqual(ahoraCaracas(new Date('2026-10-07T02:30:00Z')), { dia: '2026-10-06', hora: '22:30' });
});

test('día siguiente cruzando mes', () => {
  assert.equal(diaSiguiente('2026-10-31'), '2026-11-01');
});

test('una cita escrita como 10:00 por el paciente se guarda como 10:00 de Caracas (14:00 UTC)', () => {
  assert.equal(fechaHoraCaracas('2026-10-07', '10', '00').toISOString(), '2026-10-07T14:00:00.000Z');
  assert.equal(fechaHoraCaracas('2026-10-07', '25', '00'), null);
  assert.equal(fechaHoraCaracas('2026-10-07', '10', '75'), null);
  assert.equal(fechaHoraCaracas('07/10/2026', '10', '00'), null);
});

test('muestra la hora en Caracas aunque el servidor esté en UTC', () => {
  assert.match(textoFechaHora('2026-10-07T14:00:00.000Z'), /10:00/);
});

test('recordatorios: a la hora configurada y una sola vez por día', () => {
  const nueve = new Date('2026-10-07T13:00:00Z'); // 09:00 Caracas
  assert.equal(correspondenRecordatorios(nueve, '09:00:00', null), true);
  assert.equal(correspondenRecordatorios(new Date('2026-10-07T12:59:00Z'), '09:00:00', null), false);
  assert.equal(correspondenRecordatorios(nueve, '09:00:00', '2026-10-07'), false);
  assert.equal(correspondenRecordatorios(new Date('2026-10-07T15:00:00Z'), '09:00:00', null), true); // se reconectó más tarde
  assert.equal(correspondenRecordatorios(nueve, '10:30:00', null), false);
});
