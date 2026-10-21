// Simulador de conversación: prueba el bot desde la terminal, SIN WhatsApp y SIN escribir en la base de datos.
// Lee la agenda y los tratamientos reales; las citas, pacientes y notificaciones solo se muestran en pantalla.
//   Uso:  node simulador.js 04141234567        (escribe como si fueras ese número; "salir" para terminar)
import 'dotenv/config';
import readline from 'node:readline/promises';
import { createClient } from '@supabase/supabase-js';
import { crearRepo } from './handlers/repo.js';
import { procesar } from './handlers/conversacion.js';
import { normalizarTelefono } from './handlers/telefono.js';
import { avisoDeLlave } from './handlers/llave.js';

const tel = normalizarTelefono(process.argv[2] ?? '');
if (!tel) {
  console.log('Uso: node simulador.js 04141234567');
  process.exit(1);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.log('Faltan SUPABASE_URL y SUPABASE_SERVICE_KEY en el archivo .env');
  process.exit(1);
}

const avisoLlave = avisoDeLlave(process.env.SUPABASE_SERVICE_KEY);
if (avisoLlave) {
  console.log('⚠️ ' + avisoLlave);
  process.exit(1);
}
console.log('✅ Llave service_role detectada.');

const real = crearRepo(createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY), { appUrl: process.env.APP_URL });
const sesiones = new Map();
const nota = (...a) => console.log('   \x1b[2m[simulación]', ...a, '\x1b[0m');

const repo = {
  ...real,
  async ajustes() { return { ...(await real.ajustes()), bot_activo: true }; }, // el simulador ignora el interruptor
  async sesion(c) { return sesiones.get(c) ?? null; },
  async guardarSesion(c, s) { sesiones.set(c, { ...s, actualizado_en: new Date().toISOString() }); },
  async crearPaciente(p) { nota('se registraría al paciente', p); return { id: '00000000-0000-0000-0000-000000000000' }; },
  async crearCita(c) { nota(`se crearía la cita ${c.inicio.toISOString()} · ${c.duracion} min · estado ${c.estado}`); return 'simulada'; },
  async cancelarCita(id) { nota('se cancelaría la cita', id); },
  async notificar(tipo, mensaje) { nota(`notificación en la app (${tipo}): ${mensaje}`); },
  async crearFicha() { nota('se crearía el enlace de la ficha de ingreso'); return 'https://dra-mayela-gonzalez.vercel.app/f/EJEMPLO'; },
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(`Simulando al paciente ${tel}. Escribe "salir" para terminar.\n`);
for (;;) {
  const texto = (await rl.question('Paciente > ')).trim();
  if (texto.toLowerCase() === 'salir') break;
  try {
    const { respuestas, motivo } = await procesar(repo, { clave: tel, telefono: tel, texto });
    if (!respuestas.length) console.log(`   (el bot no responde: ${motivo})`);
    for (const r of respuestas) console.log(`\nBot >\n${r}\n`);
  } catch (e) {
    console.log('   Error:', e.message);
  }
}
rl.close();
