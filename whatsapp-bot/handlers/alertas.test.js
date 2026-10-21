import test from 'node:test';
import assert from 'node:assert/strict';
import { esSilencio, configAlertas, clasificar, textoAlerta, textoResumen, procesarAlertas, _pruebas } from './alertas.js';
import { detectarUrgencia } from './conversacion.js';
import { procesar } from './conversacion.js';
import { norm } from './textos.js';

// Caracas = UTC-4. Martes 20 oct 2026
const DIA = new Date('2026-10-20T16:00:00Z'); // 12:00 Caracas
const NOCHE = new Date('2026-10-21T01:00:00Z'); // 21:00 Caracas del 20
const MADRUGADA = new Date('2026-10-20T08:00:00Z'); // 04:00 Caracas
const MANANA = new Date('2026-10-20T11:30:00Z'); // 07:30 Caracas

const AJ = { alerta_activa: true, alerta_telefono: '+58 424-5500042', alerta_silencio_desde: '19:00:00', alerta_silencio_hasta: '07:00:00', alerta_ultimo_resumen: null };

function repoFalso({ ajustes = AJ, pendientes = [], agenda = [] } = {}) {
  const log = { alertadas: [], fallos: [], resumen: null };
  return {
    log,
    async ajustes() { return ajustes; },
    async notificacionesSinAlertar() { return pendientes.filter((n) => !log.alertadas.includes(n.id)); },
    async marcarAlertadas(ids) { log.alertadas.push(...ids); },
    async registrarFalloAlerta(id) { log.fallos.push(id); },
    async agendaDelDia() { return agenda; },
    async marcarResumen(d) { log.resumen = d; ajustes = { ...ajustes, alerta_ultimo_resumen: d }; },
  };
}
const notif = (id, tipo, creada, extra = {}) => ({ id, tipo, mensaje: `msg ${id}`, created_at: creada.toISOString(), metadata: { nombre: 'Ana Pérez', telefono: '0414 1234567', ...extra } });

test('silencio de 19:00 a 07:00 (cruza la medianoche, hora de Caracas)', () => {
  assert.equal(esSilencio(DIA), false);
  assert.equal(esSilencio(NOCHE), true);
  assert.equal(esSilencio(MADRUGADA), true);
  assert.equal(esSilencio(MANANA), false);
  assert.equal(esSilencio(new Date('2026-10-20T23:00:00Z')), true); // 19:00 exactas
  assert.equal(esSilencio(new Date('2026-10-20T10:59:00Z')), true); // 06:59
  assert.equal(esSilencio(new Date('2026-10-20T11:00:00Z')), false); // 07:00 exactas
});

test('configuración con valores por defecto y número normalizado', () => {
  const c = configAlertas({});
  assert.equal(c.activa, true);
  assert.equal(c.desde, '19:00');
  assert.equal(c.hasta, '07:00');
  assert.equal(configAlertas(AJ).telefono, '584245500042');
});

test('clasificación por tipo, hora y preferencias', () => {
  const cfg = configAlertas(AJ);
  assert.equal(clasificar(notif(1, 'cita_nueva_whatsapp', DIA), cfg).modo, 'inmediata');
  assert.equal(clasificar(notif(2, 'cita_nueva_whatsapp', NOCHE), cfg).modo, 'resumen');
  assert.equal(clasificar(notif(3, 'ficha_recibida', DIA), cfg).modo, 'resumen');
  assert.equal(clasificar(notif(4, 'tipo_raro', DIA), cfg).modo, 'ignorar');
  assert.deepEqual(clasificar(notif(5, 'sintomas_urgentes', NOCHE), cfg), { modo: 'inmediata', urgente: true });
  assert.equal(clasificar(notif(6, 'cita_cancelada_whatsapp', DIA), configAlertas({ ...AJ, alerta_cancelaciones: false })).modo, 'ignorar');
  assert.equal(clasificar(notif(7, 'cita_por_aprobar_whatsapp', DIA), configAlertas({ ...AJ, alerta_citas: false })).modo, 'ignorar');
});

test('textos de alerta en trato formal con paciente y teléfono', () => {
  const t = textoAlerta(notif(1, 'cita_nueva_whatsapp', DIA, { tratamiento: 'Consulta de valoración', cuando: 'martes 20 oct, 3:00 p. m.' }));
  assert.match(t, /Nueva cita agendada/);
  assert.match(t, /Ana Pérez/);
  assert.match(t, /Consulta de valoración/);
  assert.match(t, /0414 1234567/);
  const u = textoAlerta(notif(2, 'sintomas_urgentes', DIA, { texto: 'tengo la cara muy hinchada' }));
  assert.match(u, /Síntomas urgentes/);
  assert.match(u, /muy hinchada/);
  assert.match(textoAlerta(notif(3, 'chat_whatsapp', DIA)), /desea hablar con usted/);
});

test('de día: envía al instante (tras el resumen) y marca como alertada', async () => {
  const repo = repoFalso({ ajustes: { ...AJ, alerta_ultimo_resumen: '2026-10-20' }, pendientes: [notif(1, 'cita_nueva_whatsapp', DIA)] });
  const enviados = [];
  const r = await procesarAlertas({ repo, enviar: async (jid, t) => enviados.push({ jid, t }), ahora: DIA });
  assert.equal(r.enviados, 1);
  assert.equal(enviados[0].jid, '584245500042@s.whatsapp.net');
  assert.deepEqual(repo.log.alertadas, [1]);
});

test('de noche: lo normal espera; lo urgente sale siempre', async () => {
  const repo = repoFalso({ pendientes: [notif(1, 'cita_nueva_whatsapp', NOCHE), notif(2, 'sintomas_urgentes', NOCHE, { texto: 'no puedo respirar' })] });
  const enviados = [];
  await procesarAlertas({ repo, enviar: async (jid, t) => enviados.push(t), ahora: NOCHE });
  assert.equal(enviados.length, 1);
  assert.match(enviados[0], /Síntomas urgentes/);
  assert.deepEqual(repo.log.alertadas, [2]); // la cita sigue pendiente para la mañana
});

test('primer ciclo tras el silencio: un solo resumen con pendientes y agenda, una vez al día', async () => {
  const agenda = [{ fecha_hora: '2026-10-20T14:00:00Z', estado: 'confirmado', paciente: { nombre: 'Willian', apellido: 'Blanco' }, tratamiento: { nombre: 'Consulta de valoración' } }];
  const repo = repoFalso({ pendientes: [notif(1, 'cita_nueva_whatsapp', NOCHE), notif(2, 'ficha_recibida', NOCHE)], agenda });
  const enviados = [];
  await procesarAlertas({ repo, enviar: async (jid, t) => enviados.push(t), ahora: MANANA });
  assert.equal(enviados.length, 1);
  assert.match(enviados[0], /Buenos días, Dra\. Mayela/);
  assert.match(enviados[0], /Pendientes/);
  assert.match(enviados[0], /Willian Blanco/);
  assert.deepEqual(repo.log.alertadas.sort(), [1, 2]);
  assert.equal(repo.log.resumen, '2026-10-20');
  await procesarAlertas({ repo, enviar: async (jid, t) => enviados.push(t), ahora: new Date(MANANA.getTime() + 60_000) });
  assert.equal(enviados.length, 1); // no repite el resumen
});

test('sin nada pendiente ni agenda no envía resumen vacío', async () => {
  const repo = repoFalso();
  const enviados = [];
  await procesarAlertas({ repo, enviar: async (jid, t) => enviados.push(t), ahora: MANANA });
  assert.equal(enviados.length, 0);
  assert.equal(repo.log.resumen, '2026-10-20');
});

test('desactivadas o sin número: no envía nada', async () => {
  for (const aj of [{ ...AJ, alerta_activa: false }, { ...AJ, alerta_telefono: '' }]) {
    const repo = repoFalso({ ajustes: aj, pendientes: [notif(1, 'sintomas_urgentes', DIA)] });
    const enviados = [];
    await procesarAlertas({ repo, enviar: async (jid, t) => enviados.push(t), ahora: DIA });
    assert.equal(enviados.length, 0);
  }
});

test('un envío fallido suma intento y no marca como alertada; el resumen espera para reintentar', async () => {
  _pruebas.reiniciarFallos();
  const repo = repoFalso({ ajustes: { ...AJ, alerta_ultimo_resumen: '2026-10-20' }, pendientes: [notif(1, 'chat_whatsapp', DIA)] });
  await procesarAlertas({ repo, enviar: async () => { throw new Error('sin conexión'); }, ahora: DIA });
  assert.deepEqual(repo.log.fallos, [1]);
  assert.deepEqual(repo.log.alertadas, []);
});

test('tipos desconocidos o desactivados se marcan sin enviar', async () => {
  const repo = repoFalso({ ajustes: { ...AJ, alerta_ultimo_resumen: '2026-10-20' }, pendientes: [notif(1, 'tipo_raro', DIA)] });
  const enviados = [];
  await procesarAlertas({ repo, enviar: async (jid, t) => enviados.push(t), ahora: DIA });
  assert.equal(enviados.length, 0);
  assert.deepEqual(repo.log.alertadas, [1]);
});

test('textoResumen lista pendientes y agenda', () => {
  const t = textoResumen({ items: [notif(1, 'cita_cancelada_whatsapp', NOCHE, { cuando: 'mañana' })], agenda: [], dia: '2026-10-20' });
  assert.match(t, /Cancelación/);
});

// ── Detección de síntomas urgentes en la conversación ─────────────────
test('detecta síntomas urgentes y no confunde "urgente" a secas', () => {
  for (const f of ['Tengo la cara muy hinchada', 'me cuesta respirar', 'siento un dolor muy fuerte', 'tengo fiebre desde ayer', 'mi labio está morado', 'me salió una ampolla', 'veo borroso', 'estoy sangrando', 'es una emergencia']) {
    assert.equal(detectarUrgencia(norm(f)), true, f);
  }
  for (const f of ['necesito una cita urgente', 'hola', '1', 'quiero agendar', 'María Pérez', 'cuánto cuesta el botox', 'buenos días']) {
    assert.equal(detectarUrgencia(norm(f)), false, f);
  }
});

test('conversación: síntoma urgente avisa a la doctora, orienta al paciente y pausa el chat', async () => {
  const log = { n: [] };
  const sesiones = {};
  const repo = {
    async ajustes() { return { bot_activo: true }; },
    async sesion(c) { return sesiones[c] ?? null; },
    async guardarSesion(c, s) { sesiones[c] = s; },
    async pacientePorTelefono() { return { id: 'p1', nombre: 'Willian', apellido: 'Blanco' }; },
    async notificar(tipo, mensaje, metadata) { log.n.push({ tipo, mensaje, metadata }); },
  };
  const r = await procesar(repo, { clave: '584144334584', telefono: '584144334584', texto: 'Tengo la cara muy hinchada y me duele mucho', ahora: DIA });
  assert.equal(log.n[0].tipo, 'sintomas_urgentes');
  assert.equal(log.n[0].metadata.nombre, 'Willian');
  assert.match(log.n[0].metadata.texto, /muy hinchada/);
  assert.match(r.respuestas.join(' '), /centro de salud/);
  assert.ok(sesiones['584144334584'].pausado_hasta);
});
