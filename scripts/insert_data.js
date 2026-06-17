import pkg from 'pg';
import 'dotenv/config';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL no está definida en las variables de entorno (.env)');
  process.exit(1);
}

const client = new Client({ connectionString });

const PACIENTE_PRUEBA = {
  nombre:           'Ana',
  apellido:         'García López',
  cedula:           'V-12345678',
  telefono:         '584141234567',
  email:            'ana.garcia@email.com',
  fecha_nacimiento: '1990-05-14',
  notas:            'Paciente de prueba generada por migración inicial.',
  antecedentes:     'Ninguno relevante.',
  alergias:         'Ninguna conocida.'
};

const DOCTOR_PROFILE = {
  nombre:       'Dra. Mayela Silva',
  especialidad: 'Medicina Estética & Bienestar',
  cedula:       'ME-00001',
  email:        'dra.mayela@clinicamayela.com',
  telefono:     '584140000000',
  biografia:    'Especialista en medicina estética y tratamientos no invasivos.',
  horario:      'Lunes a Viernes de 9:00 a 17:00, Sábados de 9:00 a 14:00',
};

async function run() {
  try {
    await client.connect();
    console.log('\n🚀 Iniciando inserción de datos semilla a Postgres...\n');

    // 1. Doctor Profile
    console.log('👩‍⚕️  Insertando perfil de doctora...');
    await client.query(`
      INSERT INTO doctor_profile (nombre, especialidad, cedula, email, telefono, biografia, horario)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [DOCTOR_PROFILE.nombre, DOCTOR_PROFILE.especialidad, DOCTOR_PROFILE.cedula, DOCTOR_PROFILE.email, DOCTOR_PROFILE.telefono, DOCTOR_PROFILE.biografia, DOCTOR_PROFILE.horario]);
    console.log('   ✅ Perfil de doctora insertado.');

    // 2. Obtener tratamiento para referenciar
    console.log('💊  Obteniendo ID de tratamiento semilla...');
    const { rows: tRows } = await client.query(`
      SELECT id FROM tratamientos WHERE nombre = 'Toxina Botulínica (Botox)' LIMIT 1
    `);
    if (tRows.length === 0) {
      throw new Error("No se encontró el tratamiento 'Toxina Botulínica (Botox)' en la base de datos. Asegúrate de correr schema.sql primero.");
    }
    const tratamientoId = tRows[0].id;
    console.log(`   ✅ ID de Tratamiento obtenido: ${tratamientoId}`);

    // 3. Paciente de prueba
    console.log('👤  Insertando paciente de prueba...');
    let pacienteId;
    const { rows: pRows } = await client.query(`
      INSERT INTO pacientes (nombre, apellido, cedula, telefono, email, fecha_nacimiento, notas, antecedentes, alergias)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (cedula) DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id
    `, [
      PACIENTE_PRUEBA.nombre,
      PACIENTE_PRUEBA.apellido,
      PACIENTE_PRUEBA.cedula,
      PACIENTE_PRUEBA.telefono,
      PACIENTE_PRUEBA.email,
      PACIENTE_PRUEBA.fecha_nacimiento,
      PACIENTE_PRUEBA.notas,
      PACIENTE_PRUEBA.antecedentes,
      PACIENTE_PRUEBA.alergias
    ]);
    pacienteId = pRows[0].id;
    console.log(`   ✅ Paciente creado con UUID: ${pacienteId}`);

    // 4. Historial clínico
    console.log('📋  Insertando historial clínico...');
    const coordenadas = JSON.stringify([
      { x: 0.12, y: 0.72, z: 0.18, zona: 'Frontal', producto: 'Toxina Botulínica (Botox)', dosis: 10 },
      { x: -0.10, y: 0.68, z: 0.20, zona: 'Glabela', producto: 'Toxina Botulínica (Botox)', dosis: 8 },
    ]);
    
    await client.query(`
      INSERT INTO historial_clinico (paciente_id, tratamiento_id, fecha, producto, cantidad, lote, tecnica, notas_medicas, mapa_facial_coordenadas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      pacienteId,
      tratamientoId,
      new Date().toISOString().split('T')[0],
      'Toxina Botulínica (Botox)',
      '18 U',
      'LOTE-BOTOX-2026',
      'Técnica rusa / 3 puntos',
      'Primera aplicación. Sin antecedentes alérgicos.',
      coordenadas
    ]);
    console.log('   ✅ Historial clínico insertado.');

    // 5. Cita de prueba
    console.log('📅  Insertando cita de prueba...');
    const fechaCita = new Date(Date.now() + 86400000 * 3).toISOString();
    await client.query(`
      INSERT INTO citas (paciente_id, tratamiento_id, fecha_hora, estado, notas)
      VALUES ($1, $2, $3, $4, $5)
    `, [pacienteId, tratamientoId, fechaCita, 'pendiente', 'Primera cita de seguimiento post-migración.']);
    console.log('   ✅ Cita de prueba insertada.');

    console.log('\n🎉 Datos semilla insertados exitosamente.\n');
  } catch (err) {
    console.error('\n❌ Error en inserción:', err);
  } finally {
    await client.end();
  }
}

run();
