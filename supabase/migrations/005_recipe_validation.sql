-- Récipe digital verificable: identidad del médico, hash SHA-256 inmutable, validación pública por QR y plantillas.

-- 1) Firma y sello digitalizados del médico (base64, PNG pequeño)
alter table public.doctor_profile
  add column if not exists firma_base64 text,
  add column if not exists sello_base64 text;

-- 2) Snapshot de identidad + hash en cada récipe
alter table public.recipes_medicos
  add column if not exists doctor_nombre text,
  add column if not exists doctor_mpps   text,
  add column if not exists doctor_col    text,
  add column if not exists hash_sha256   text;

-- Hash canónico del contenido crítico (fármacos, paciente, fecha, médico y matrículas)
create or replace function public.fn_recipe_hash(r public.recipes_medicos)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(
      concat_ws('|', r.id::text, r.paciente_id::text, r.fecha::text,
                coalesce(r.medicamentos, ''), coalesce(r.indicaciones, ''),
                coalesce(r.doctor_nombre, ''), coalesce(r.doctor_mpps, ''), coalesce(r.doctor_col, '')),
      'sha256'),
    'hex');
$$;

-- Al guardar: congela la identidad del médico y calcula el hash
create or replace function public.fn_recipe_sellar()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare d public.doctor_profile%rowtype;
begin
  select * into d from public.doctor_profile limit 1;
  new.doctor_nombre := coalesce(new.doctor_nombre, d.nombre);
  new.doctor_mpps   := coalesce(new.doctor_mpps, d.mpps);
  new.doctor_col    := coalesce(new.doctor_col, d.col);
  new.hash_sha256   := public.fn_recipe_hash(new);
  return new;
end;
$$;

-- Una vez firmado, el contenido no se puede alterar (solo eliminar y reemitir)
create or replace function public.fn_recipe_inmutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.medicamentos, new.indicaciones, new.fecha, new.paciente_id, new.doctor_nombre, new.doctor_mpps, new.doctor_col, new.hash_sha256)
     is distinct from
     (old.medicamentos, old.indicaciones, old.fecha, old.paciente_id, old.doctor_nombre, old.doctor_mpps, old.doctor_col, old.hash_sha256) then
    raise exception 'Un récipe firmado no puede modificarse; elimínelo y emita uno nuevo.';
  end if;
  return new;
end;
$$;

-- Récipes ya existentes: sellarlos con los datos actuales
update public.recipes_medicos r
   set doctor_nombre = d.nombre, doctor_mpps = d.mpps, doctor_col = d.col
  from (select * from public.doctor_profile limit 1) d
 where r.hash_sha256 is null;
update public.recipes_medicos r set hash_sha256 = public.fn_recipe_hash(r) where r.hash_sha256 is null;

drop trigger if exists trg_recipe_sellar on public.recipes_medicos;
create trigger trg_recipe_sellar before insert on public.recipes_medicos
  for each row execute function public.fn_recipe_sellar();

drop trigger if exists trg_recipe_inmutable on public.recipes_medicos;
create trigger trg_recipe_inmutable before update on public.recipes_medicos
  for each row execute function public.fn_recipe_inmutable();

-- 3) Verificación pública (farmacia): devuelve el documento solo si el hash coincide con el guardado
create or replace function public.verificar_recipe(p_id uuid, p_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.recipes_medicos%rowtype; d public.doctor_profile%rowtype; pac text;
begin
  select * into r from public.recipes_medicos where id = p_id;
  if not found or r.hash_sha256 is distinct from p_hash or public.fn_recipe_hash(r) is distinct from r.hash_sha256 then
    return jsonb_build_object('valido', false);
  end if;
  select * into d from public.doctor_profile limit 1;
  select nombre || coalesce(' ' || left(apellido, 1) || '.', '') into pac from public.pacientes where id = r.paciente_id;
  return jsonb_build_object(
    'valido', true,
    'fecha', r.fecha,
    'medicamentos', r.medicamentos,
    'indicaciones', r.indicaciones,
    'paciente', pac,
    'doctor_nombre', r.doctor_nombre,
    'doctor_mpps', r.doctor_mpps,
    'doctor_col', r.doctor_col,
    'especialidad', d.especialidad,
    'firma', d.firma_base64,
    'sello', d.sello_base64);
end;
$$;
revoke all on function public.verificar_recipe(uuid, text) from public;
grant execute on function public.verificar_recipe(uuid, text) to anon, authenticated;

-- 4) Plantillas de regímenes frecuentes
create table if not exists public.recipe_plantillas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  medicamentos  text not null,
  indicaciones  text,
  created_at    timestamptz not null default now()
);
alter table public.recipe_plantillas enable row level security;
create policy staff_select on public.recipe_plantillas for select to authenticated using (true);
create policy staff_insert on public.recipe_plantillas for insert to authenticated with check (true);
create policy staff_update on public.recipe_plantillas for update to authenticated using (true);
create policy staff_delete on public.recipe_plantillas for delete to authenticated using (true);
