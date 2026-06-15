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
  email         text,
  fecha_nac     date,
  foto_perfil   text,
  notas         text,
  genero        text,
  alergias      text,
  antecedentes  text,
  es_vip        boolean default false,
  created_at    timestamptz default now()
);

-- TABLA: tratamientos
create table if not exists tratamientos (
  id               uuid primary key default uuid_generate_v4(),
  nombre           text not null,
  descripcion      text,
  precio           numeric not null,
  duracion_minutos integer not null,
  creado_en        timestamptz default now()
);

-- TABLA: historial_clinico
create table if not exists historial_clinico (
  id                      uuid primary key default uuid_generate_v4(),
  paciente_id             uuid references pacientes(id) on delete cascade,
  fecha                   timestamptz default now(),
  tratamiento             text,
  notas_medicas           text,
  antecedentes            text,
  foto_antes              text,
  foto_despues            text,
  mapa_facial_coordenadas jsonb default '[]',
  productos_usados        jsonb default '[]',
  producto                text,
  cantidad                text,
  lote                    text,
  tecnica                 text,
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
  cedula_prof   text unique,
  correo        text,
  telefono      text,
  foto          text,
  biografia     text,
  horario       jsonb,
  mpps          text,
  col           text,
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

-- TABLA: examenes_laboratorio
create table if not exists examenes_laboratorio (
  id            uuid primary key default uuid_generate_v4(),
  paciente_id   uuid references pacientes(id) on delete cascade,
  titulo        text not null,
  fecha         date not null,
  archivo_url   text, -- Base64
  notas         text,
  created_at    timestamptz default now()
);

-- TABLA: recipes_medicos
create table if not exists recipes_medicos (
  id            uuid primary key default uuid_generate_v4(),
  paciente_id   uuid references pacientes(id) on delete cascade,
  fecha         date not null,
  medicamentos  text not null,
  indicaciones  text,
  created_at    timestamptz default now()
);

-- TABLA: transacciones
create table if not exists transacciones (
  id            uuid primary key default uuid_generate_v4(),
  paciente_id   uuid references pacientes(id) on delete cascade,
  cita_id       uuid references citas(id) on delete set null,
  fecha         date not null,
  monto         numeric not null,
  estado        text default 'pendiente', -- 'completado' | 'pendiente' | 'reembolsado'
  metodo_pago   text,                     -- 'efectivo' | 'tarjeta' | 'transferencia'
  created_at    timestamptz default now()
);

-- ROW LEVEL SECURITY
alter table pacientes            enable row level security;
alter table tratamientos          enable row level security;
alter table historial_clinico    enable row level security;
alter table citas                enable row level security;
alter table doctor_profile       enable row level security;
alter table clinic_settings      enable row level security;
alter table examenes_laboratorio enable row level security;
alter table recipes_medicos      enable row level security;
alter table transacciones        enable row level security;

-- Eliminar políticas previas si existieran para evitar errores
DO $$
BEGIN
    DROP POLICY IF EXISTS "pacientes_solo_autenticada" ON pacientes;
    DROP POLICY IF EXISTS "tratamientos_solo_autenticada" ON tratamientos;
    DROP POLICY IF EXISTS "historial_solo_autenticada" ON historial_clinico;
    DROP POLICY IF EXISTS "citas_solo_autenticada" ON citas;
    DROP POLICY IF EXISTS "doctor_profile_solo_autenticada" ON doctor_profile;
    DROP POLICY IF EXISTS "Solo clinica autenticada lee settings" ON clinic_settings;
    DROP POLICY IF EXISTS "Solo service_role escribe settings" ON clinic_settings;
    DROP POLICY IF EXISTS "examenes_solo_autenticada" ON examenes_laboratorio;
    DROP POLICY IF EXISTS "recipes_solo_autenticada" ON recipes_medicos;
    DROP POLICY IF EXISTS "transacciones_solo_autenticada" ON transacciones;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- POLÍTICAS: Nombres únicos por tabla para mantenibilidad
create policy "pacientes_solo_autenticada"
  on pacientes for all using (auth.role() = 'authenticated');

create policy "tratamientos_solo_autenticada"
  on tratamientos for all using (auth.role() = 'authenticated');

create policy "historial_solo_autenticada"
  on historial_clinico for all using (auth.role() = 'authenticated');

create policy "citas_solo_autenticada"
  on citas for all using (auth.role() = 'authenticated');

create policy "doctor_profile_solo_autenticada"
  on doctor_profile for all using (auth.role() = 'authenticated');

create policy "Solo clinica autenticada lee settings"
  on clinic_settings for select using (auth.role() = 'authenticated');

create policy "Solo service_role escribe settings"
  on clinic_settings for update using (auth.role() = 'service_role');

create policy "examenes_solo_autenticada"
  on examenes_laboratorio for all using (auth.role() = 'authenticated');

create policy "recipes_solo_autenticada"
  on recipes_medicos for all using (auth.role() = 'authenticated');

create policy "transacciones_solo_autenticada"
  on transacciones for all using (auth.role() = 'authenticated');
