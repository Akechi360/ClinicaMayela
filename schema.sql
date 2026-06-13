-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- TABLA: pacientes
create table if not exists pacientes (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  apellido      text not null,
  cedula        text unique,
  telefono      text,
  correo        text,
  fecha_nac     date,
  foto_perfil   text,
  notas         text,
  created_at    timestamptz default now()
);

-- TABLA: historial_clinico
create table if not exists historial_clinico (
  id                      uuid primary key default uuid_generate_v4(),
  paciente_id             uuid references pacientes(id) on delete cascade,
  fecha                   timestamptz default now(),
  tratamiento             text not null,
  notas_medicas           text,
  antecedentes            text,
  foto_antes              text,
  foto_despues            text,
  mapa_facial_coordenadas jsonb default '[]',
  productos_usados        jsonb default '[]',
  created_at              timestamptz default now()
);

-- TABLA: citas
create table if not exists citas (
  id           uuid primary key default uuid_generate_v4(),
  paciente_id  uuid references pacientes(id) on delete cascade,
  fecha_hora   timestamptz not null,
  tipo         text,
  estado       text default 'pendiente',
  notas        text,
  origen       text default 'manual', -- 'manual' | 'whatsapp'
  created_at   timestamptz default now()
);

-- TABLA: doctor_profile
create table if not exists doctor_profile (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text,
  especialidad  text,
  cedula_prof   text,
  correo        text,
  telefono      text,
  foto          text,
  biografia     text,
  horario       jsonb,
  updated_at    timestamptz default now()
);

-- TABLA: clinic_settings (incluye QR del bot)
create table if not exists clinic_settings (
  id                  uuid primary key default uuid_generate_v4(),
  bot_activo          boolean default false,
  bot_qr_base64       text,      -- QR en tiempo real del bot
  bot_conectado       boolean default false,
  hora_recordatorio   time default '09:00',
  mensaje_bienvenida  text,
  updated_at          timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table pacientes          enable row level security;
alter table historial_clinico  enable row level security;
alter table citas              enable row level security;
alter table doctor_profile     enable row level security;
alter table clinic_settings    enable row level security;

-- Eliminar políticas previas si existieran para evitar errores
DO $$
BEGIN
    DROP POLICY IF EXISTS "pacientes_solo_autenticada" ON pacientes;
    DROP POLICY IF EXISTS "historial_solo_autenticada" ON historial_clinico;
    DROP POLICY IF EXISTS "citas_solo_autenticada" ON citas;
    DROP POLICY IF EXISTS "doctor_profile_solo_autenticada" ON doctor_profile;
    DROP POLICY IF EXISTS "Solo clinica autenticada lee settings" ON clinic_settings;
    DROP POLICY IF EXISTS "Solo service_role escribe settings" ON clinic_settings;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- POLÍTICAS: Nombres únicos por tabla para mantenibilidad
create policy "pacientes_solo_autenticada"
  on pacientes for all using (auth.role() = 'authenticated');

create policy "historial_solo_autenticada"
  on historial_clinico for all using (auth.role() = 'authenticated');

create policy "citas_solo_autenticada"
  on citas for all using (auth.role() = 'authenticated');

create policy "doctor_profile_solo_autenticada"
  on doctor_profile for all using (auth.role() = 'authenticated');

-- clinic_settings: Seguridad Reforzada
create policy "Solo clinica autenticada lee settings"
  on clinic_settings for select using (auth.role() = 'authenticated');

create policy "Solo service_role escribe settings"
  on clinic_settings for update using (auth.role() = 'service_role');
