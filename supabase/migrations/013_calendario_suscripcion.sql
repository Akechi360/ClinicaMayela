-- 013: Suscripción de la agenda a Google Calendar (feed iCal protegido por token secreto).
--      La función Edge `calendario` lee el token con service_role; la app lo muestra a la doctora y puede rotarlo.

alter table public.clinic_settings add column if not exists calendar_token text;

-- Genera (o rota) el token: 192 bits aleatorios. Solo personal autorizado.
create or replace function public.rotar_calendar_token()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare t text;
begin
  if not public.fn_es_personal() then
    raise exception 'No autorizado';
  end if;
  t := encode(extensions.gen_random_bytes(24), 'hex');
  update public.clinic_settings set calendar_token = t, updated_at = now() where id is not null;
  return t;
end;
$$;
revoke all on function public.rotar_calendar_token() from public, anon;
grant execute on function public.rotar_calendar_token() to authenticated;
