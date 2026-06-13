// scripts/migrate_db.js
// Ejecutar con: node scripts/migrate_db.js
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service_role key (no la anon)
);

// ─────────────────────────────────────────────
// DATOS DE PRUEBA
// ─────────────────────────────────────────────
const PACIENTE_PRUEBA = {
  nombre:     'Ana',
  apellido:   'García López',
  cedula:     'V-12345678',
  telefono:   '584141234567',
  correo:     'ana.garcia@email.com',
  fecha_nac:  '1990-05-14',
  notas:      'Paciente de prueba generada por migración inicial.',
};

const HISTORIAL_PRUEBA = (paciente_id) => ([
  {
    paciente_id,
    tratamiento:             'Toxina Botulínica — Frente',
    notas_medicas:           'Primera aplicación. Sin antecedentes alérgicos.',
    antecedentes:            'Ninguno relevante.',
    foto_antes:              null,
    foto_despues:            null,
    mapa_facial_coordenadas: [
      { x: 0.12, y: 0.72, z: 0.18, zona: 'Frontal', producto: 'Toxina Botulínica (Botox)', dosis: 10 },
      { x: -0.10, y: 0.68, z: 0.20, zona: 'Glabela', producto: 'Toxina Botulínica (Botox)', dosis: 8 },
    ],
    productos_usados: [
      { nombre: 'Toxina Botulínica (Botox)', dosis: 18, unidad: 'U' }
    ],
  }
]);

const CITA_PRUEBA = (paciente_id) => ({
  paciente_id,
  fecha_hora: new Date(Date.now() + 86400000 * 3).toISOString(), // en 3 días
  tipo:       'Seguimiento Botox',
  estado:     'pendiente',
  origen:     'manual',
  notas:      'Primera cita de seguimiento post-migración.',
});

const DOCTOR_PROFILE = {
  nombre:      'Dra. Mayela',
  especialidad:'Medicina Estética',
  cedula_prof: 'ME-00001',
  correo:      'dra.mayela@clinicamayela.com',
  telefono:    '584140000000',
  biografia:   'Especialista en medicina estética y tratamientos no invasivos.',
  horario:     { lunes: '09:00-17:00', martes: '09:00-17:00', miercoles: '09:00-14:00', jueves: '09:00-17:00', viernes: '09:00-15:00' },
};

const CLINIC_SETTINGS = {
  bot_activo:          false,
  bot_conectado:       false,
  bot_qr_base64:       null,
  hora_recordatorio:   '09:00:00',
  mensaje_bienvenida:  '👋 Hola, soy el asistente de *Clínica Mayela*. ¿En qué te puedo ayudar?',
};

// ─────────────────────────────────────────────
// MIGRACIÓN
// ─────────────────────────────────────────────
async function migrate() {
  console.log('\n🚀 Iniciando migración a Supabase...\n');

  // 1. Doctor Profile
  console.log('👩⚕️  Insertando perfil de doctora...');
  const { error: eDoc } = await supabase
    .from('doctor_profile')
    .upsert(DOCTOR_PROFILE, { onConflict: 'cedula_prof' });
  if (eDoc) throw new Error(`doctor_profile: ${eDoc.message}`);
  console.log('   ✅ Perfil de doctora insertado.');

  // 2. Clinic Settings
  console.log('⚙️   Insertando configuración de clínica...');
  const { data: existingSettings } = await supabase
    .from('clinic_settings')
    .select('id')
    .limit(1);

  if (!existingSettings?.length) {
    const { error: eSet } = await supabase
      .from('clinic_settings')
      .insert(CLINIC_SETTINGS);
    if (eSet) throw new Error(`clinic_settings: ${eSet.message}`);
    console.log('   ✅ Configuración inicial insertada.');
  } else {
    console.log('   ⚠️  Configuración ya existe, omitiendo.');
  }

  // 3. Paciente de prueba
  console.log('👤  Insertando paciente de prueba...');
  const { data: pacienteData, error: ePac } = await supabase
    .from('pacientes')
    .insert(PACIENTE_PRUEBA)
    .select('id')
    .single();
  if (ePac) throw new Error(`pacientes: ${ePac.message}`);
  const pacienteId = pacienteData.id;
  console.log(`   ✅ Paciente creado con UUID: ${pacienteId}`);

  // 4. Historial clínico
  console.log('📋  Insertando historial clínico...');
  const { error: eHis } = await supabase
    .from('historial_clinico')
    .insert(HISTORIAL_PRUEBA(pacienteId));
  if (eHis) throw new Error(`historial_clinico: ${eHis.message}`);
  console.log('   ✅ Historial clínico insertado.');

  // 5. Cita de prueba
  console.log('📅  Insertando cita de prueba...');
  const { error: eCit } = await supabase
    .from('citas')
    .insert(CITA_PRUEBA(pacienteId));
  if (eCit) throw new Error(`citas: ${eCit.message}`);
  console.log('   ✅ Cita de prueba insertada.');

  console.log('\n🎉 Migración completada exitosamente.\n');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n❌ Error en migración:', err.message);
  process.exit(1);
});
