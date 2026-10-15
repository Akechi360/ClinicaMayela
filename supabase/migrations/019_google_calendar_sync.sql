-- Sincronización automática de citas con Google Calendar (cuenta de servicio). SOLO AGREGA y está inactiva
-- hasta que la Dra. configure su calendario: sin clinic_settings.google_calendar_id el disparador no hace nada.

create extension if not exists pg_net;

alter table public.clinic_settings
  add column if not exists google_calendar_id text,
  add column if not exists google_sync_token  text not null default encode(extensions.gen_random_bytes(24), 'hex');

alter table public.citas
  add column if not exists google_event_id   text,
  add column if not exists google_sync_error text;

-- Avisa a la Edge Function (asíncrono, tras confirmar la transacción). Jamás bloquea ni rompe la agenda.
create or replace function public.fn_cita_google_sync()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cal  text;
  v_tok  text;
  v_body jsonb;
begin
  select google_calendar_id, google_sync_token into v_cal, v_tok from public.clinic_settings limit 1;
  if v_cal is null or btrim(v_cal) = '' or v_tok is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.google_event_id is null then return old; end if;
    v_body := jsonb_build_object('op', 'borrar', 'event_id', old.google_event_id);
  else
    v_body := jsonb_build_object('op', 'cita', 'cita_id', new.id);
  end if;

  perform net.http_post(
    url     := 'https://hytrretjngjlbkkcoeoi.supabase.co/functions/v1/calendario-google',
    body    := v_body,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-token', v_tok)
  );
  return coalesce(new, old);
exception when others then
  return coalesce(new, old);
end;
$$;
revoke all on function public.fn_cita_google_sync() from public, anon, authenticated;

drop trigger if exists trg_cita_google_ins on public.citas;
create trigger trg_cita_google_ins after insert on public.citas
  for each row execute function public.fn_cita_google_sync();

-- Solo cuando cambia algo que se ve en el calendario (así la propia escritura de google_event_id no la reactiva)
drop trigger if exists trg_cita_google_upd on public.citas;
create trigger trg_cita_google_upd after update of fecha_hora, estado, notas, tratamiento_id, paciente_id, duracion_minutos on public.citas
  for each row execute function public.fn_cita_google_sync();

drop trigger if exists trg_cita_google_del on public.citas;
create trigger trg_cita_google_del after delete on public.citas
  for each row execute function public.fn_cita_google_sync();
