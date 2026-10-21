-- Alertas a la doctora por WhatsApp (el bot le escribe a su número cuando hay algo que atender). SOLO AGREGA.

alter table public.clinic_settings
  add column if not exists alerta_activa         boolean not null default true,
  add column if not exists alerta_telefono       text    default '+58 424-5500042',
  add column if not exists alerta_silencio_desde time    not null default '19:00',
  add column if not exists alerta_silencio_hasta time    not null default '07:00',
  add column if not exists alerta_citas          boolean not null default true,   -- citas nuevas y solicitudes por aprobar
  add column if not exists alerta_cancelaciones  boolean not null default true,
  add column if not exists alerta_fichas         boolean not null default true,   -- fichas de ingreso recibidas (en el resumen de la mañana)
  add column if not exists alerta_ultimo_resumen date;

alter table public.notificaciones
  add column if not exists alertado_en    timestamptz,
  add column if not exists alerta_intentos int not null default 0;

-- Lo anterior no se reenvía: solo se avisa de lo que ocurra desde ahora
update public.notificaciones set alertado_en = now() where alertado_en is null;
create index if not exists idx_notificaciones_sin_alertar on public.notificaciones (created_at) where alertado_en is null;

-- Cuando un paciente envía su ficha de ingreso, queda una notificación (se verá en la campana y en el resumen de la mañana)
create or replace function public.fn_notificar_ficha_recibida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'recibida' and old.estado is distinct from 'recibida' then
    insert into public.notificaciones (tipo, mensaje, metadata)
    values ('ficha_recibida',
            'Ficha de ingreso recibida: ' || btrim(coalesce(new.datos->>'nombre', '') || ' ' || coalesce(new.datos->>'apellido', '')),
            jsonb_build_object('ficha_id', new.id, 'paciente_id', new.paciente_id));
  end if;
  return new;
end;
$$;
revoke all on function public.fn_notificar_ficha_recibida() from public, anon, authenticated;

drop trigger if exists trg_notificar_ficha_recibida on public.fichas_ingreso;
create trigger trg_notificar_ficha_recibida after update of estado on public.fichas_ingreso
  for each row execute function public.fn_notificar_ficha_recibida();
