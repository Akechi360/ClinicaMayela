import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarAntibloqueo } from './antibloqueo.js';

function crearSocketFalso({ fallarEn = -1 } = {}) {
  const eventos = [];
  let n = 0;
  return {
    eventos,
    async sendMessage(jid, contenido) {
      const i = n++;
      eventos.push(`envia:${jid}:${contenido.text ?? ''}`);
      if (i === fallarEn) throw new Error('fallo de red');
      return { key: { id: `ID${i}` } };
    },
    async sendPresenceUpdate(tipo, jid) { eventos.push(`presencia:${tipo}:${jid}`); },
  };
}

const pruebaOpts = (extra = {}) => ({ esperar: async () => {}, azar: () => 0.5, ...extra });

test('envía en orden, con "escribiendo" antes y registra el id de cada mensaje', async () => {
  const sock = crearSocketFalso();
  const ids = [];
  aplicarAntibloqueo(sock, pruebaOpts({ alEnviar: (id) => ids.push(id) }));
  await Promise.all([sock.sendMessage('a@s.whatsapp.net', { text: 'uno' }), sock.sendMessage('b@s.whatsapp.net', { text: 'dos' })]);
  assert.deepEqual(sock.eventos, [
    'presencia:composing:a@s.whatsapp.net', 'envia:a@s.whatsapp.net:uno', 'presencia:paused:a@s.whatsapp.net',
    'presencia:composing:b@s.whatsapp.net', 'envia:b@s.whatsapp.net:dos', 'presencia:paused:b@s.whatsapp.net',
  ]);
  assert.deepEqual(ids, ['ID0', 'ID1']);
});

test('un envío que falla no bloquea los siguientes', async () => {
  const sock = crearSocketFalso({ fallarEn: 0 });
  aplicarAntibloqueo(sock, pruebaOpts());
  const primero = sock.sendMessage('a@s.whatsapp.net', { text: 'uno' });
  const segundo = sock.sendMessage('b@s.whatsapp.net', { text: 'dos' });
  await assert.rejects(primero, /fallo de red/);
  const r = await segundo;
  assert.equal(r.key.id, 'ID1');
});

test('espera entre mensajes (pausa aleatoria) y proporcional al texto', async () => {
  const sock = crearSocketFalso();
  const esperas = [];
  aplicarAntibloqueo(sock, { esperar: async (ms) => { esperas.push(ms); }, azar: () => 0.5, pausaMinMs: 1000, pausaMaxMs: 3000 });
  await sock.sendMessage('a@s.whatsapp.net', { text: 'x'.repeat(100) });
  assert.equal(esperas.length, 2);
  assert.equal(esperas[0], (500 + 100 * 20) * 1); // escribiendo: 2500 ms con azar 0.5
  assert.equal(esperas[1], 2000); // pausa entre mensajes
});

test('mensajes sin texto (multimedia) no simulan escritura', async () => {
  const sock = crearSocketFalso();
  aplicarAntibloqueo(sock, pruebaOpts());
  await sock.sendMessage('a@s.whatsapp.net', { image: Buffer.from('x') });
  assert.ok(!sock.eventos.some((e) => e.startsWith('presencia')));
});
