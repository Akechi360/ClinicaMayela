import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL o SUPABASE_SERVICE_KEY no están definidos en las variables de entorno (.env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

const CLINIC_SETTINGS = {
  bot_activo:          false,
  bot_conectado:       false,
  bot_qr_base64:       null,
  hora_recordatorio:   '09:00:00',
  mensaje_bienvenida:  '👋 Hola, soy el asistente de *Clínica Mayela*. ¿En qué te puedo ayudar?',
};

async function migrate() {
  console.log('\n🚀 Iniciando migración a Supabase...\n');

  // 1. Doctor Profile
  console.log('👩‍⚕️  Insertando perfil de doctora...');
  const { error: eDoc } = await supabase
    .from('doctor_profile')
    .upsert(DOCTOR_PROFILE, { onConflict: 'cedula' });
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

  // 3. Obtener tratamiento semilla para asociar FKs
  console.log('💊  Obteniendo ID de tratamiento semilla...');
  const { data: treatments, error: eTreat } = await supabase
    .from('tratamientos')
    .select('id')
    .eq('nombre', 'Toxina Botulínica (Botox)')
    .limit(1);
  if (eTreat) throw new Error(`tratamientos query: ${eTreat.message}`);
  if (!treatments || treatments.length === 0) {
    throw new Error("No se encontró el tratamiento 'Toxina Botulínica (Botox)' en Supabase. Corre schema.sql primero.");
  }
  const tratamientoId = treatments[0].id;
  console.log(`   ✅ ID de Tratamiento obtenido: ${tratamientoId}`);

  // 4. Paciente de prueba
  console.log('👤  Insertando paciente de prueba...');
  const { data: pacienteData, error: ePac } = await supabase
    .from('pacientes')
    .insert(PACIENTE_PRUEBA)
    .select('id')
    .single();
  if (ePac) throw new Error(`pacientes: ${ePac.message}`);
  const pacienteId = pacienteData.id;
  console.log(`   ✅ Paciente creado con UUID: ${pacienteId}`);

  // 5. Historial clínico
  console.log('📋  Insertando historial clínico...');
  const coordenadas = [
    { x: 0.12, y: 0.72, z: 0.18, zona: 'Frontal', producto: 'Toxina Botulínica (Botox)', dosis: 10 },
    { x: -0.10, y: 0.68, z: 0.20, zona: 'Glabela', producto: 'Toxina Botulínica (Botox)', dosis: 8 },
  ];

  const { error: eHis } = await supabase
    .from('historial_clinico')
    .insert({
      paciente_id: pacienteId,
      tratamiento_id: tratamientoId,
      fecha: new Date().toISOString().split('T')[0],
      producto: 'Toxina Botulínica (Botox)',
      cantidad: '18 U',
      lote: 'LOTE-BOTOX-2026',
      tecnica: 'Técnica rusa / 3 puntos',
      notas_medicas: 'Primera aplicación. Sin antecedentes alérgicos.',
      mapa_facial_coordenadas: coordenadas
    });
  if (eHis) throw new Error(`historial_clinico: ${eHis.message}`);
  console.log('   ✅ Historial clínico insertado.');

  // 6. Cita de prueba
  console.log('📅  Insertando cita de prueba...');
  const { error: eCit } = await supabase
    .from('citas')
    .insert({
      paciente_id: pacienteId,
      tratamiento_id: tratamientoId,
      fecha_hora: new Date(Date.now() + 86400000 * 3).toISOString(),
      estado: 'pendiente',
      notas: 'Primera cita de seguimiento post-migración.'
    });
  if (eCit) throw new Error(`citas: ${eCit.message}`);
  console.log('   ✅ Cita de prueba insertada.');

  console.log('\n🎉 Migración completada exitosamente.\n');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n❌ Error en migración:', err.message);
  process.exit(1);
});
