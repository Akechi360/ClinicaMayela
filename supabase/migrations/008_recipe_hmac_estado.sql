-- Récipe verificable v2:
--  1) El hash pasa a ser HMAC-SHA256 con una clave secreta en Supabase Vault (autenticidad, no solo integridad).
--  2) Estado del récipe: emitido / dispensado / anulado (anular en lugar de borrar).
--  3) El sellado toma SIEMPRE la identidad del médico desde doctor_profile (ignora lo que envíe el cliente).
-- La columna se sigue llamando hash_sha256 (algoritmo: HMAC-SHA256) para no tocar el frontend.

-- 1) Clave secreta (solo existe en el Vault; nunca sale de la base)
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'recipe_hmac_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'recipe_hmac_key', 'Clave HMAC del récipe digital');
  end if;
end $$;

create or replace function public.fn_recipe_hash(r public.recipes_medicos)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare k text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'recipe_hmac_key';
  if k is null then raise exception 'Falta la clave recipe_hmac_key en el Vault'; end if;
  return encode(
    extensions.hmac(
      concat_ws('|', 'v2', r.id::text, r.paciente_id::text, to_char(r.fecha, 'YYYY-MM-DD'),
                coalesce(r.medicamentos, ''), coalesce(r.indicaciones, ''),
                coalesce(r.doctor_nombre, ''), coalesce(r.doctor_mpps, ''), coalesce(r.doctor_col, '')),
      k, 'sha256'),
    'hex');
end;
$$;
-- Quien pueda ejecutarla podría calcular hashes válidos: solo la usan los triggers y verificar_recipe (como propietario)
revoke all on function public.fn_recipe_hash(public.recipes_medicos) from public, anon, authenticated;

-- 2) Estado
alter table public.recipes_medicos
  add column if not exists estado    text not null default 'emitido',
  add column if not exists estado_at timestamptz;
alter table public.recipes_medicos drop constraint if exists recipes_estado_chk;
alter table public.recipes_medicos
  add constraint recipes_estado_chk check (estado in ('emitido', 'dispensado', 'anulado'));

-- 3) Sellado: identidad del médico siempre desde su perfil
create or replace function public.fn_recipe_sellar()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare d public.doctor_profile%rowtype;
begin
  select * into d from public.doctor_profile order by updated_at desc nulls last limit 1;
  new.doctor_nombre := d.nombre;
  new.doctor_mpps   := d.mpps;
  new.doctor_col    := d.col;
  new.estado        := 'emitido';
  new.estado_at     := null;
  new.hash_sha256   := public.fn_recipe_hash(new);
  return new;
end;
$$;

-- Inmutabilidad del contenido; el estado solo avanza (emitido -> dispensado | anulado) y es terminal
create or replace function public.fn_recipe_inmutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.medicamentos, new.indicaciones, new.fecha, new.paciente_id, new.doctor_nombre, new.doctor_mpps, new.doctor_col, new.hash_sha256)
     is distinct from
     (old.medicamentos, old.indicaciones, old.fecha, old.paciente_id, old.doctor_nombre, old.doctor_mpps, old.doctor_col, old.hash_sha256) then
    raise exception 'Un récipe firmado no puede modificarse; anúlelo y emita uno nuevo.';
  end if;
  if new.estado is distinct from old.estado then
    if old.estado <> 'emitido' then
      raise exception 'Un récipe % ya no puede cambiar de estado.', old.estado;
    end if;
    new.estado_at := now();
  else
    new.estado_at := old.estado_at;
  end if;
  return new;
end;
$$;

-- Re-sellar los récipes existentes con el nuevo esquema (si los hubiera)
alter table public.recipes_medicos disable trigger trg_recipe_inmutable;
update public.recipes_medicos r set hash_sha256 = public.fn_recipe_hash(r);
alter table public.recipes_medicos enable trigger trg_recipe_inmutable;

-- Verificación pública: autenticidad + estado. Un récipe anulado no muestra la prescripción.
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
  if r.estado = 'anulado' then
    return jsonb_build_object('valido', true, 'estado', r.estado, 'estado_at', r.estado_at,
                              'fecha', r.fecha, 'doctor_nombre', r.doctor_nombre);
  end if;
  select * into d from public.doctor_profile order by updated_at desc nulls last limit 1;
  select nombre || coalesce(' ' || left(apellido, 1) || '.', '') into pac from public.pacientes where id = r.paciente_id;
  return jsonb_build_object(
    'valido', true,
    'estado', r.estado,
    'estado_at', r.estado_at,
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
