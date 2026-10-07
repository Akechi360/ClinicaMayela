// Ejecutar con: node --test handlers/
import test from 'node:test';
import assert from 'node:assert/strict';
import { enVentanaHoraria, normalizarTelefono, sendPendingFollowups } from './followupJob.js';

test('ventana horaria de Caracas (UTC-4): 7:00 a 21:00', () => {
  assert.equal(enVentanaHoraria(new Date('2026-10-07T11:00:00Z')), true); // 07:00 Caracas
  assert.equal(enVentanaHoraria(new Date('2026-10-07T10:59:00Z')), false); // 06:59
  assert.equal(enVentanaHoraria(new Date('2026-10-08T00:59:00Z')), true); // 20:59
  assert.equal(enVentanaHoraria(new Date('2026-10-08T01:00:00Z')), false); // 21:00
});

test('normaliza teléfonos venezolanos', () => {
  assert.equal(normalizarTelefono('0414-433.4584'), '584144334584');
  assert.equal(normalizarTelefono('+58 414 4334584'), '584144334584');
  assert.equal(normalizarTelefono('4144334584'), '584144334584');
  assert.equal(normalizarTelefono(null), '');
});

function falsoSupabase(filas) {
  const updates = [];
  return {
    updates,
    from() {
      const q = {
        select: () => q, eq: () => q, lte: () => q, order: () => q,
        limit: () => Promise.resolve({ data: filas, error: null }),
        update: (v) => ({ eq: (_c, id) => { updates.push({ id, ...v }); return Promise.resolve({ error: null }); } }),
      };
      return q;
    },
  };
}

test('envía los pendientes, marca enviado y reporta errores por paciente sin teléfono', async () => {
  const enviados = [];
  const sock = { sendMessage: async (jid, c) => { enviados.push([jid, c.text]); } };
  const sb = falsoSupabase([
    { id: 'a', mensaje: 'Hola A', intentos: 0, paciente: { nombre: 'A', telefono: '0414 1112233' } },
    { id: 'b', mensaje: 'Hola B', intentos: 0, paciente: { nombre: 'B', telefono: '' } },
  ]);
  // 12:00 hora de Caracas → dentro de la ventana
  const n = await sendPendingFollowups(sock, sb, new Date('2026-10-07T16:00:00Z'), 0);
  assert.equal(n, 1);
  assert.deepEqual(enviados, [['584141112233@s.whatsapp.net', 'Hola A']]);
  assert.equal(sb.updates.find((u) => u.id === 'a').estado, 'enviado');
  assert.equal(sb.updates.find((u) => u.id === 'b').estado, 'error');
});

test('fuera de horario no envía nada', async () => {
  const sock = { sendMessage: async () => { throw new Error('no debería enviar'); } };
  assert.equal(await sendPendingFollowups(sock, falsoSupabase([]), new Date('2026-10-07T03:00:00Z')), 0);
});
