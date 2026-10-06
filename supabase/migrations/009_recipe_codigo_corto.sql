-- Verificación por código corto (/v/<codigo>), cédula enmascarada, consultorio y versiones (récipe corregido -> enlace a la vigente).

alter table public.doctor_profile
  add column if not exists consultorio_nombre    text,
  add column if not exists consultorio_direccion text;

alter table public.recipes_medicos
  add column if not exists codigo text,
  add column if not exists reemplazado_por uuid references public.recipes_medicos(id) on delete set null;

-- Código corto aleatorio (16 caracteres, sin símbolos ambiguos). No contiene información del récipe.
create or replace function public.fn_codigo_corto()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  b bytea := extensions.gen_random_bytes(16);
  s text := '';
  i int;
begin
  for i in 0..15 loop
    s := s || substr(alfabeto, (get_byte(b, i) % length(alfabeto)) + 1, 1);
  end loop;
  return s;
end;
$$;
revoke all on function public.fn_codigo_corto() from public, anon, authenticated;

-- Récipes existentes (si los hubiera): asignar código antes de endurecer el trigger
update public.recipes_medicos set codigo = public.fn_codigo_corto() where codigo is null;
alter table public.recipes_medicos alter column codigo set not null;
create unique index if not exists recipes_codigo_uk on public.recipes_medicos (codigo);

create or replace function public.fn_recipe_sellar()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare d public.doctor_profile%rowtype;
begin
  select * into d from public.doctor_profile order by updated_at desc nulls last limit 1;
  new.doctor_nombre   := d.nombre;
  new.doctor_mpps     := d.mpps;
  new.doctor_col      := d.col;
  new.estado          := 'emitido';
  new.estado_at       := null;
  new.reemplazado_por := null;
  new.codigo          := public.fn_codigo_corto();
  new.hash_sha256     := public.fn_recipe_hash(new);
  return new;
end;
$$;

create or replace function public.fn_recipe_inmutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.medicamentos, new.indicaciones, new.fecha, new.paciente_id, new.doctor_nombre, new.doctor_mpps, new.doctor_col, new.hash_sha256, new.codigo)
     is distinct from
     (old.medicamentos, old.indicaciones, old.fecha, old.paciente_id, old.doctor_nombre, old.doctor_mpps, old.doctor_col, old.hash_sha256, old.codigo) then
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
  -- El enlace a la versión que lo reemplaza solo se fija al anular
  if new.reemplazado_por is distinct from old.reemplazado_por
     and not (old.estado = 'emitido' and new.estado = 'anulado' and old.reemplazado_por is null) then
    raise exception 'El enlace de reemplazo solo puede fijarse al anular el récipe.';
  end if;
  return new;
end;
$$;

-- Verificación pública por código corto. El HMAC se recalcula en el servidor y debe coincidir con el guardado.
drop function if exists public.verificar_recipe(uuid, text);

create or replace function public.verificar_recipe_codigo(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r public.recipes_medicos%rowtype;
  d public.doctor_profile%rowtype;
  p public.pacientes%rowtype;
  v_vigente text := null;
  v_digits text;
  v_letra text;
  v_ced text := null;
begin
  select * into r from public.recipes_medicos where codigo = p_codigo;
  if not found or public.fn_recipe_hash(r) is distinct from r.hash_sha256 then
    return jsonb_build_object('valido', false);
  end if;

  if r.reemplazado_por is not null then
    with recursive c as (
      select id, codigo, reemplazado_por, 1 as n from public.recipes_medicos where id = r.reemplazado_por
      union all
      select x.id, x.codigo, x.reemplazado_por, c.n + 1 from public.recipes_medicos x join c on x.id = c.reemplazado_por where c.n < 10
    )
    select codigo into v_vigente from c order by n desc limit 1;
  end if;

  -- Anulado sin reemplazo: no se muestra la prescripción
  if r.estado = 'anulado' and v_vigente is null then
    return jsonb_build_object('valido', true, 'estado', r.estado, 'estado_at', r.estado_at,
                              'fecha', r.fecha, 'doctor_nombre', r.doctor_nombre);
  end if;

  select * into d from public.doctor_profile order by updated_at desc nulls last limit 1;
  select * into p from public.pacientes where id = r.paciente_id;
  v_digits := regexp_replace(coalesce(p.cedula, ''), '\D', '', 'g');
  v_letra  := upper(coalesce(substring(p.cedula from '^\s*([A-Za-z])'), ''));
  if length(v_digits) >= 4 then
    v_ced := case when v_letra <> '' then v_letra || '-' else '' end || '***' || right(v_digits, 4);
  end if;

  return jsonb_build_object(
    'valido', true,
    'estado', r.estado,
    'estado_at', r.estado_at,
    'vigente_codigo', v_vigente,
    'fecha', r.fecha,
    'medicamentos', r.medicamentos,
    'indicaciones', r.indicaciones,
    'paciente', trim(p.nombre || ' ' || coalesce(p.apellido, '')),
    'paciente_cedula', v_ced,
    'doctor_nombre', r.doctor_nombre,
    'doctor_mpps', r.doctor_mpps,
    'doctor_col', r.doctor_col,
    'especialidad', d.especialidad,
    'telefono', d.telefono,
    'consultorio_nombre', d.consultorio_nombre,
    'consultorio_direccion', d.consultorio_direccion,
    'firma', d.firma_base64,
    'sello', d.sello_base64);
end;
$$;
revoke all on function public.verificar_recipe_codigo(text) from public;
grant execute on function public.verificar_recipe_codigo(text) to anon, authenticated;
