-- 012: Modelo clínico ampliado (un solo usuario: la Dra.; acceso por fn_es_personal()).
--  · pacientes: estatura, peso meta y patologías previas estructuradas
--  · consentimientos: fecha/hora exacta de firma (la fija el servidor) y versión del documento
--  · eventos_adversos: efectos adversos post-tratamiento con seguimiento
--  · seguimientos_tratamiento: cola de mensajes/recordatorios para el bot de WhatsApp (Baileys)
--  · ordenes_laboratorio: órdenes emitidas según el sexo del paciente

-- 1) Pacientes
alter table public.pacientes
  add column if not exists estatura_cm  numeric(5,1) check (estatura_cm is null or estatura_cm between 50 and 250),
  add column if not exists peso_meta_kg numeric(5,1) check (peso_meta_kg is null or peso_meta_kg between 20 and 400),
  add column if not exists patologias   text[] not null default '{}';

-- 2) Consentimientos: la hora de firma la pone el servidor (no el navegador) para que sea confiable
alter table public.consentimientos
  add column if not exists firmado_en timestamptz,
  add column if not exists doc_version text;

create or replace function public.fn_consentimiento_firmado_en()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.firma_base64 is not null and new.firma_base64 <> ''
     and (tg_op = 'INSERT' or old.firma_base64 is distinct from new.firma_base64) then
    new.firmado_en := now();
  end if;
  return new;
end;
$$;
revoke all on function public.fn_consentimiento_firmado_en() from public, anon, authenticated;

drop trigger if exists trg_consentimiento_firmado_en on public.consentimientos;
create trigger trg_consentimiento_firmado_en before insert or update on public.consentimientos
  for each row execute function public.fn_consentimiento_firmado_en();

-- utilidad: updated_at
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.fn_set_updated_at() from public, anon, authenticated;

-- 3) Eventos adversos post-tratamiento
create table if not exists public.eventos_adversos (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references public.pacientes(id) on delete cascade,
  historial_id uuid references public.historial_clinico(id) on delete set null,
  tipo         text not null check (tipo in ('edema_prolongado', 'hematoma', 'nodulo_granuloma', 'infeccion_eritema',
                                             'sufrimiento_vascular', 'asimetria', 'ptosis', 'alergia',
                                             'efecto_gastrointestinal', 'intolerancia_dosis', 'otro')),
  severidad    text not null check (severidad in ('leve', 'moderada', 'severa')),
  fecha_inicio date not null default current_date,
  estado       text not null default 'activo' check (estado in ('activo', 'en_tratamiento', 'resuelto')),
  conducta     text,
  notas        text,
  resuelto_en  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists eventos_adversos_paciente_idx on public.eventos_adversos (paciente_id, fecha_inicio desc);
drop trigger if exists trg_eventos_updated on public.eventos_adversos;
create trigger trg_eventos_updated before update on public.eventos_adversos
  for each row execute function public.fn_set_updated_at();

-- 4) Seguimientos / cola de mensajes para el bot (el bot usa service_role y marca estado/enviado_en)
create table if not exists public.seguimientos_tratamiento (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid not null references public.pacientes(id) on delete cascade,
  cita_id          uuid references public.citas(id) on delete set null,
  protocolo_id     uuid references public.protocolos_peptidos(id) on delete set null,
  tipo             text not null check (tipo in ('cuidados_post', 'recordatorio_24h', 'recordatorio_72h',
                                                 'control_estetico', 'dosis_peptido', 'escalado_dosis')),
  fecha_programada timestamptz not null,
  mensaje          text not null,
  estado           text not null default 'pendiente' check (estado in ('pendiente', 'enviado', 'cancelado', 'error')),
  intentos         int not null default 0,
  enviado_en       timestamptz,
  error            text,
  created_at       timestamptz not null default now()
);
create index if not exists seguimientos_cola_idx on public.seguimientos_tratamiento (estado, fecha_programada);
create index if not exists seguimientos_paciente_idx on public.seguimientos_tratamiento (paciente_id, fecha_programada desc);

-- 5) Órdenes de laboratorio emitidas
create table if not exists public.ordenes_laboratorio (
  id          uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  fecha       date not null default current_date,
  perfil      text not null check (perfil in ('Femenino', 'Masculino')),
  estudios    text[] not null,
  notas       text,
  created_at  timestamptz not null default now()
);
create index if not exists ordenes_lab_paciente_idx on public.ordenes_laboratorio (paciente_id, fecha desc);

-- 6) RLS (solo personal) + auditoría en las tablas nuevas
do $$
declare t text;
begin
  foreach t in array array['eventos_adversos', 'seguimientos_tratamiento', 'ordenes_laboratorio']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists staff_select on public.%I', t);
    execute format('drop policy if exists staff_insert on public.%I', t);
    execute format('drop policy if exists staff_update on public.%I', t);
    execute format('drop policy if exists staff_delete on public.%I', t);
    execute format('create policy staff_select on public.%I for select to authenticated using (public.fn_es_personal())', t);
    execute format('create policy staff_insert on public.%I for insert to authenticated with check (public.fn_es_personal())', t);
    execute format('create policy staff_update on public.%I for update to authenticated using (public.fn_es_personal()) with check (public.fn_es_personal())', t);
    execute format('create policy staff_delete on public.%I for delete to authenticated using (public.fn_es_personal())', t);
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$I', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on public.%1$I
                    for each row execute function public.fn_audit_trigger()', t);
  end loop;
end $$;
