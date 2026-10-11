-- Registrar procedimiento fallaba: historial_clinico.tratamiento (nombre, NOT NULL) no se enviaba desde la app,
-- que solo manda tratamiento_id. El servidor completa el nombre desde el catálogo (copia histórica del nombre).
create or replace function public.fn_historial_nombre_tratamiento()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tratamiento is null or btrim(new.tratamiento) = '' then
    select t.nombre into new.tratamiento from public.tratamientos t where t.id = new.tratamiento_id;
  end if;
  if new.tratamiento is null or btrim(new.tratamiento) = '' then
    new.tratamiento := 'Procedimiento';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_historial_nombre_tratamiento on public.historial_clinico;
create trigger trg_historial_nombre_tratamiento
  before insert on public.historial_clinico
  for each row execute function public.fn_historial_nombre_tratamiento();
