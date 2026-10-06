-- Cierra dos brechas: las RPC de citas (SECURITY DEFINER) no comprobaban que el usuario fuera personal de la clínica,
-- y recipe_plantillas permitía acceso a cualquier usuario autenticado.
-- service_role (bot de WhatsApp) sigue permitido.

create or replace function public.fn_es_personal()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(auth.role() = 'service_role', false)
      or coalesce(auth.jwt() ->> 'email', '') like '%@clinicamayela.com';
$$;
revoke all on function public.fn_es_personal() from public, anon;
grant execute on function public.fn_es_personal() to authenticated, service_role;

create or replace function public.cancelar_cita(p_cita_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.fn_es_personal() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  update citas set estado = 'cancelado' where id = p_cita_id;
  update transacciones set estado = 'cancelado' where cita_id = p_cita_id;
end;
$$;

create or replace function public.crear_cita_con_transaccion(
  p_paciente_id uuid, p_tratamiento_id uuid, p_fecha_hora timestamptz,
  p_notas text default null, p_precio numeric default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cita_id uuid;
  v_precio numeric;
begin
  if not public.fn_es_personal() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_precio is null then
    select precio into v_precio from tratamientos where id = p_tratamiento_id;
  else
    v_precio := p_precio;
  end if;

  insert into citas (paciente_id, tratamiento_id, fecha_hora, notas)
    values (p_paciente_id, p_tratamiento_id, p_fecha_hora, p_notas)
    returning id into v_cita_id;

  insert into transacciones (paciente_id, cita_id, fecha, monto, estado, metodo_pago)
    values (p_paciente_id, v_cita_id, p_fecha_hora::date, coalesce(v_precio, 0), 'pendiente', 'efectivo');

  return v_cita_id;
end;
$$;

-- Plantillas de récipe: solo personal de la clínica (igual que el resto de tablas)
drop policy if exists staff_select on public.recipe_plantillas;
drop policy if exists staff_insert on public.recipe_plantillas;
drop policy if exists staff_update on public.recipe_plantillas;
drop policy if exists staff_delete on public.recipe_plantillas;
create policy staff_select on public.recipe_plantillas for select to authenticated
  using ((auth.jwt() ->> 'email') like '%@clinicamayela.com');
create policy staff_insert on public.recipe_plantillas for insert to authenticated
  with check ((auth.jwt() ->> 'email') like '%@clinicamayela.com');
create policy staff_update on public.recipe_plantillas for update to authenticated
  using ((auth.jwt() ->> 'email') like '%@clinicamayela.com')
  with check ((auth.jwt() ->> 'email') like '%@clinicamayela.com');
create policy staff_delete on public.recipe_plantillas for delete to authenticated
  using ((auth.jwt() ->> 'email') like '%@clinicamayela.com');
