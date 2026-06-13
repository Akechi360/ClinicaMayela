import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.hytrretjngjlbkkcoeoi:Mayela36048*@aws-1-us-west-2.pooler.supabase.com:6543/postgres';

const client = new Client({ connectionString });

const PACIENTE_PRUEBA = {
  nombre:     'Ana',
  apellido:   'García López',
  cedula:     'V-12345678',
  telefono:   '584141234567',
  correo:     'ana.garcia@email.com',
  fecha_nac:  '1990-05-14',
  notas:      'Paciente de prueba generada por migración inicial.',
};

const DOCTOR_PROFILE = {
  nombre:      'Dra. Mayela',
  especialidad:'Medicina Estética',
  cedula_prof: 'ME-00001',
  correo:      'dra.mayela@clinicamayela.com',
  telefono:    '584140000000',
  biografia:   'Especialista en medicina estética y tratamientos no invasivos.',
  horario:     JSON.stringify({ lunes: '09:00-17:00', martes: '09:00-17:00', miercoles: '09:00-14:00', jueves: '09:00-17:00', viernes: '09:00-15:00' }),
};

const CLINIC_SETTINGS = {
  bot_activo:          false,
  bot_conectado:       false,
  bot_qr_base64:       null,
  hora_recordatorio:   '09:00:00',
  mensaje_bienvenida:  '👋 Hola, soy el asistente de *Clínica Mayela*. ¿En qué te puedo ayudar?',
};

async function run() {
  try {
    await client.connect();
    console.log('\n🚀 Iniciando inserción de datos semilla a Postgres...\n');

    // 1. Doctor Profile
    console.log('👩⚕️  Insertando perfil de doctora...');
    await client.query(`
      INSERT INTO doctor_profile (nombre, especialidad, cedula_prof, correo, telefono, biografia, horario)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [DOCTOR_PROFILE.nombre, DOCTOR_PROFILE.especialidad, DOCTOR_PROFILE.cedula_prof, DOCTOR_PROFILE.correo, DOCTOR_PROFILE.telefono, DOCTOR_PROFILE.biografia, DOCTOR_PROFILE.horario]);
    console.log('   ✅ Perfil de doctora insertado.');

    // 2. Clinic Settings
    console.log('⚙️   Insertando configuración de clínica...');
    const { rows: settings } = await client.query('SELECT id FROM clinic_settings LIMIT 1');
    if (settings.length === 0) {
      await client.query(`
        INSERT INTO clinic_settings (bot_activo, bot_conectado, bot_qr_base64, hora_recordatorio, mensaje_bienvenida)
        VALUES ($1, $2, $3, $4, $5)
      `, [CLINIC_SETTINGS.bot_activo, CLINIC_SETTINGS.bot_conectado, CLINIC_SETTINGS.bot_qr_base64, CLINIC_SETTINGS.hora_recordatorio, CLINIC_SETTINGS.mensaje_bienvenida]);
      console.log('   ✅ Configuración inicial insertada.');
    } else {
      console.log('   ⚠️  Configuración ya existe, omitiendo.');
    }

    // 3. Paciente de prueba
    console.log('👤  Insertando paciente de prueba...');
    let pacienteId;
    const { rows: pRows } = await client.query(`
      INSERT INTO pacientes (nombre, apellido, cedula, telefono, correo, fecha_nac, notas)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (cedula) DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id
    `, [PACIENTE_PRUEBA.nombre, PACIENTE_PRUEBA.apellido, PACIENTE_PRUEBA.cedula, PACIENTE_PRUEBA.telefono, PACIENTE_PRUEBA.correo, PACIENTE_PRUEBA.fecha_nac, PACIENTE_PRUEBA.notas]);
    pacienteId = pRows[0].id;
    console.log(`   ✅ Paciente creado con UUID: ${pacienteId}`);

    // 4. Historial clínico
    console.log('📋  Insertando historial clínico...');
    const coordenadas = JSON.stringify([
      { x: 0.12, y: 0.72, z: 0.18, zona: 'Frontal', producto: 'Toxina Botulínica (Botox)', dosis: 10 },
      { x: -0.10, y: 0.68, z: 0.20, zona: 'Glabela', producto: 'Toxina Botulínica (Botox)', dosis: 8 },
    ]);
    const productos = JSON.stringify([{ nombre: 'Toxina Botulínica (Botox)', dosis: 18, unidad: 'U' }]);
    
    await client.query(`
      INSERT INTO historial_clinico (paciente_id, tratamiento, notas_medicas, antecedentes, mapa_facial_coordenadas, productos_usados)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [pacienteId, 'Toxina Botulínica — Frente', 'Primera aplicación. Sin antecedentes alérgicos.', 'Ninguno relevante.', coordenadas, productos]);
    console.log('   ✅ Historial clínico insertado.');

    // 5. Cita de prueba
    console.log('📅  Insertando cita de prueba...');
    const fechaCita = new Date(Date.now() + 86400000 * 3).toISOString();
    await client.query(`
      INSERT INTO citas (paciente_id, fecha_hora, tipo, estado, origen, notas)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [pacienteId, fechaCita, 'Seguimiento Botox', 'pendiente', 'manual', 'Primera cita de seguimiento post-migración.']);
    console.log('   ✅ Cita de prueba insertada.');

    console.log('\n🎉 Migración completada exitosamente.\n');
  } catch (err) {
    console.error('\n❌ Error en migración:', err);
  } finally {
    await client.end();
  }
}

run();
