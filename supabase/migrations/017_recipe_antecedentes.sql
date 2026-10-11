-- Antecedentes y alergias relevantes dentro del récipe (lo usa la farmacia, el seguro u otro médico).
-- El texto se sella con el récipe (entra al HMAC) y la verificación pública lo muestra igual que el papel.
-- Compatibilidad: los récipes SIN antecedentes conservan exactamente el hash v2 anterior.

alter table public.recipes_medicos add column if not exists antecedentes text;

create or replace function public.fn_recipe_hash(r public.recipes_medicos)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare k text; msg text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'recipe_hmac_key';
  if k is null then raise exception 'Falta la clave recipe_hmac_key en el Vault'; end if;
  if coalesce(btrim(r.antecedentes), '') = '' then
    msg := concat_ws('|', 'v2', r.id::text, r.paciente_id::text, to_char(r.fecha, 'YYYY-MM-DD'),
                     coalesce(r.medicamentos, ''), coalesce(r.indicaciones, ''),
                     coalesce(r.doctor_nombre, ''), coalesce(r.doctor_mpps, ''), coalesce(r.doctor_col, ''));
  else
    msg := concat_ws('|', 'v3', r.id::text, r.paciente_id::text, to_char(r.fecha, 'YYYY-MM-DD'),
                     coalesce(r.medicamentos, ''), coalesce(r.indicaciones, ''),
                     coalesce(r.doctor_nombre, ''), coalesce(r.doctor_mpps, ''), coalesce(r.doctor_col, ''),
                     r.antecedentes);
  end if;
  return encode(extensions.hmac(msg, k, 'sha256'), 'hex');
end;
$$;
revoke all on function public.fn_recipe_hash(public.recipes_medicos) from public, anon, authenticated;

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
  new.antecedentes    := nullif(left(btrim(coalesce(new.antecedentes, '')), 1500), '');
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
  if (new.medicamentos, new.indicaciones, new.antecedentes, new.fecha, new.paciente_id, new.doctor_nombre, new.doctor_mpps, new.doctor_col, new.hash_sha256, new.codigo)
     is distinct from
     (old.medicamentos, old.indicaciones, old.antecedentes, old.fecha, old.paciente_id, old.doctor_nombre, old.doctor_mpps, old.doctor_col, old.hash_sha256, old.codigo) then
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
  if new.reemplazado_por is distinct from old.reemplazado_por
     and not (old.estado = 'emitido' and new.estado = 'anulado' and old.reemplazado_por is null) then
    raise exception 'El enlace de reemplazo solo puede fijarse al anular el récipe.';
  end if;
  return new;
end;
$$;

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
    'antecedentes', r.antecedentes,
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
