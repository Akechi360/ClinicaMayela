-- Agenda por WhatsApp (bot): disponibilidad real, sesiones persistentes y creación atómica de citas. SOLO AGREGA.

-- Ajustes de la agenda del bot (valores por defecto; editables desde Ajustes en la app)
alter table public.clinic_settings
  add column if not exists bot_hora_apertura     time not null default '10:00',
  add column if not exists bot_hora_cierre       time not null default '17:00',
  add column if not exists bot_dias              int[] not null default '{1,2,3,4,5}',   -- 1 = lunes … 7 = domingo
  add column if not exists bot_intervalo_min     int not null default 30 check (bot_intervalo_min between 10 and 120),
  add column if not exists bot_anticipacion_horas int not null default 3,
  add column if not exists bot_horizonte_dias    int not null default 21,
  add column if not exists bot_max_citas_futuras int not null default 2,
  add column if not exists bot_cancelar_horas    int not null default 12,
  add column if not exists bot_info              text;

-- Qué tratamientos se pueden pedir por WhatsApp y cuáles requieren aprobación de la doctora
alter table public.tratamientos
  add column if not exists reservable_whatsapp boolean not null default false,
  add column if not exists aprobacion_whatsapp boolean not null default false;

-- No existía ninguna consulta en el catálogo: se agrega una con precio 0 (la Dra. edita nombre, duración y precio)
insert into public.tratamientos (nombre, descripcion, precio, duracion_minutos, reservable_whatsapp)
select 'Consulta de valoración', 'Primera consulta de valoración médica', 0, 60, true
where not exists (select 1 from public.tratamientos where nombre ilike '%consulta%');

-- Estado de cada conversación (persiste si el bot se reinicia). Solo accesible con la llave de servicio (sin políticas).
create table if not exists public.bot_sesiones (
  telefono       text primary key,
  paso           text not null default 'menu',
  datos          jsonb not null default '{}'::jsonb,
  pausado_hasta  timestamptz,
  actualizado_en timestamptz not null default now()
);
alter table public.bot_sesiones enable row level security;

-- Crea una cita de forma atómica: revisa choques con la duración REAL de cada cita y evita carreras entre dos pacientes.
create or replace function public.bot_crear_cita(
  p_paciente_id uuid, p_tratamiento_id uuid, p_fecha_hora timestamptz, p_duracion int, p_estado text, p_notas text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_precio numeric;
  v_dur int := least(greatest(coalesce(p_duracion, 30), 5), 480);
begin
  if not public.fn_es_personal() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if p_estado not in ('pendiente', 'confirmado') then
    raise exception 'Estado inválido';
  end if;

  perform pg_advisory_xact_lock(hashtext('agenda_citas'));

  if exists (
    select 1
    from public.citas c
    left join public.tratamientos t on t.id = c.tratamiento_id
    where c.estado not in ('cancelado', 'completado')
      and tstzrange(c.fecha_hora, c.fecha_hora + make_interval(mins => greatest(coalesce(c.duracion_minutos, 30), coalesce(t.duracion_minutos, 0))))
          && tstzrange(p_fecha_hora, p_fecha_hora + make_interval(mins => v_dur))
  ) then
    raise exception 'horario_ocupado';
  end if;

  select precio into v_precio from public.tratamientos where id = p_tratamiento_id;

  insert into public.citas (paciente_id, tratamiento_id, fecha_hora, notas, estado, origen, duracion_minutos)
  values (p_paciente_id, p_tratamiento_id, p_fecha_hora, p_notas, p_estado, 'whatsapp', v_dur)
  returning id into v_id;

  insert into public.transacciones (paciente_id, cita_id, fecha, monto, estado, metodo_pago)
  values (p_paciente_id, v_id, (p_fecha_hora at time zone 'America/Caracas')::date, coalesce(v_precio, 0), 'pendiente', 'efectivo');

  return v_id;
end;
$$;
revoke all on function public.bot_crear_cita(uuid, uuid, timestamptz, int, text, text) from public, anon, authenticated;
grant execute on function public.bot_crear_cita(uuid, uuid, timestamptz, int, text, text) to service_role;
