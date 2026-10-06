-- 011: Auditoría completa (bitácora de solo-anexar) para datos clínicos, de acceso y de configuración.
--      Inspirada en IHE ATNA / ISO 27799: quién, qué, cuándo y sobre qué paciente; sin UPDATE/DELETE posibles.
--      Pensada para el tier gratuito: los textos largos (firmas, fotos en base64) se resumen para no inflar la base.

-- 1) Nueva acción: LECTURA (consulta de una ficha)
alter table public.audit_log drop constraint if exists audit_log_accion_check;
alter table public.audit_log add constraint audit_log_accion_check
  check (accion in ('INSERT', 'UPDATE', 'DELETE', 'LECTURA'));

create index if not exists audit_log_tabla_registro_idx on public.audit_log (tabla, registro_id, created_at desc);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- 2) Resume valores muy largos (base64 de firmas/fotos, coordenadas) para ahorrar espacio
create or replace function public.fn_audit_reducir(j jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select case when j is null then null else (
    select coalesce(jsonb_object_agg(k,
      case when length(v::text) > 2000 then to_jsonb('[omitido: ' || length(v::text) || ' caracteres]'::text) else v end), '{}'::jsonb)
    from jsonb_each(j) as t(k, v)
  ) end;
$$;

-- 3) Trigger genérico (reemplaza al anterior): ignora actualizaciones sin cambios, resume campos largos
create or replace function public.fn_audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  v_user   text  := coalesce(v_claims ->> 'email', v_claims ->> 'role', session_user);
begin
  if TG_OP = 'INSERT' then
    insert into public.audit_log (tabla, registro_id, accion, datos_despues, usuario_email)
    values (TG_TABLE_NAME, (to_jsonb(NEW) ->> 'id')::uuid, 'INSERT', public.fn_audit_reducir(to_jsonb(NEW)), v_user);
    return NEW;
  elsif TG_OP = 'UPDATE' then
    if to_jsonb(OLD) = to_jsonb(NEW) then return NEW; end if;
    insert into public.audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_email)
    values (TG_TABLE_NAME, (to_jsonb(NEW) ->> 'id')::uuid, 'UPDATE',
            public.fn_audit_reducir(to_jsonb(OLD)), public.fn_audit_reducir(to_jsonb(NEW)), v_user);
    return NEW;
  elsif TG_OP = 'DELETE' then
    insert into public.audit_log (tabla, registro_id, accion, datos_antes, usuario_email)
    values (TG_TABLE_NAME, (to_jsonb(OLD) ->> 'id')::uuid, 'DELETE', public.fn_audit_reducir(to_jsonb(OLD)), v_user);
    return OLD;
  end if;
  return null;
end;
$$;
revoke all on function public.fn_audit_trigger() from public, anon, authenticated;
revoke all on function public.fn_audit_reducir(jsonb) from public, anon, authenticated;

-- 4) Triggers en TODAS las tablas con datos clínicos o de configuración
--    (pacientes, citas, transacciones e historial_clinico ya los tenían y siguen usando esta función)
do $$
declare t text;
begin
  foreach t in array array['recipes_medicos', 'consentimientos', 'examenes_laboratorio', 'protocolos_peptidos',
                           'composicion_corporal', 'doctor_profile', 'clinic_settings', 'tratamientos']
  loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$I', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete on public.%1$I
                    for each row execute function public.fn_audit_trigger()', t);
  end loop;
end $$;

-- 5) Bitácora de solo-anexar: nadie (ni service_role ni el panel) puede modificar o borrar entradas
create or replace function public.fn_audit_solo_anexar()
returns trigger
language plpgsql
as $$
begin
  raise exception 'La bitácora de auditoría es de solo lectura (no se puede % registros).', lower(TG_OP);
end;
$$;
revoke all on function public.fn_audit_solo_anexar() from public, anon, authenticated;

drop trigger if exists trg_audit_log_inmutable on public.audit_log;
create trigger trg_audit_log_inmutable before update or delete on public.audit_log
  for each row execute function public.fn_audit_solo_anexar();
drop trigger if exists trg_audit_log_no_truncate on public.audit_log;
create trigger trg_audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.fn_audit_solo_anexar();

-- Solo escriben los triggers y registrar_acceso (SECURITY DEFINER); el personal ya no puede insertar filas a mano
drop policy if exists staff_insert on public.audit_log;

-- 6) Registro de lecturas (el frontend lo llama al abrir la ficha de un paciente)
create or replace function public.registrar_acceso(p_tabla text, p_registro uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  v_user   text  := v_claims ->> 'email';
begin
  if not public.fn_es_personal() then
    raise exception 'No autorizado';
  end if;
  if p_tabla not in ('pacientes', 'historial_clinico', 'recipes_medicos', 'consentimientos',
                     'examenes_laboratorio', 'protocolos_peptidos', 'composicion_corporal') then
    raise exception 'Tabla no auditable: %', p_tabla;
  end if;
  -- una sola entrada por usuario y registro cada 10 minutos (evita ruido por recargas)
  if exists (select 1 from public.audit_log
              where accion = 'LECTURA' and tabla = p_tabla and registro_id = p_registro
                and usuario_email is not distinct from v_user and created_at > now() - interval '10 minutes') then
    return;
  end if;
  insert into public.audit_log (tabla, registro_id, accion, usuario_email)
  values (p_tabla, p_registro, 'LECTURA', v_user);
end;
$$;
revoke all on function public.registrar_acceso(text, uuid) from public, anon;
grant execute on function public.registrar_acceso(text, uuid) to authenticated;
