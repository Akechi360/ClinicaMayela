-- Historia clínica de longevidad (anamnesis ampliada). SOLO AGREGA: no modifica ni elimina nada existente.
--  * historias_longevidad: una fila por evaluación (con fecha) de un paciente; los datos van por secciones en jsonb.
--  * fichas_ingreso.incluye_longevidad: la misma ficha/enlace puede pedir también la historia de longevidad.
--  * ficha_obtener / ficha_enviar: compatibles hacia atrás (el formulario actual sigue funcionando).
--  * genero "Otro" permitido en la ficha pública.

create table if not exists public.historias_longevidad (
  id          uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  fecha       date not null default current_date,
  origen      text not null default 'consulta' check (origen in ('consulta', 'ficha')),
  datos       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_historias_longevidad_paciente on public.historias_longevidad (paciente_id, fecha desc);

alter table public.historias_longevidad enable row level security;
create policy staff_select on public.historias_longevidad for select to authenticated using (public.fn_es_personal());
create policy staff_insert on public.historias_longevidad for insert to authenticated with check (public.fn_es_personal());
create policy staff_update on public.historias_longevidad for update to authenticated using (public.fn_es_personal()) with check (public.fn_es_personal());
create policy staff_delete on public.historias_longevidad for delete to authenticated using (public.fn_es_personal());

drop trigger if exists trg_audit_historias_longevidad on public.historias_longevidad;
create trigger trg_audit_historias_longevidad after insert or update or delete on public.historias_longevidad
  for each row execute function public.fn_audit_trigger();

alter table public.fichas_ingreso add column if not exists incluye_longevidad boolean not null default false;

-- Sanea un JSON arbitrario que llega de la página pública: solo claves tipo "sueno_horas", valores simples,
-- profundidad máxima 3, strings de hasta 500 caracteres, hasta 40 claves/elementos por nivel.
create or replace function public.fn_sanear_json(j jsonb, p_depth int default 0)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare out jsonb; k text; v jsonb; n int := 0; s jsonb;
begin
  if j is null or p_depth > 3 then return null; end if;
  case jsonb_typeof(j)
    when 'string' then
      return to_jsonb(left(btrim(j #>> '{}'), 500));
    when 'number' then
      if abs((j #>> '{}')::numeric) > 100000 then return null; end if;
      return j;
    when 'boolean' then
      return j;
    when 'array' then
      out := '[]'::jsonb;
      for v in select value from jsonb_array_elements(j) limit 40 loop
        if jsonb_typeof(v) in ('string', 'number', 'boolean') then
          s := public.fn_sanear_json(v, p_depth + 1);
          if s is not null then out := out || jsonb_build_array(s); end if;
        end if;
      end loop;
      return out;
    when 'object' then
      out := '{}'::jsonb;
      for k, v in select key, value from jsonb_each(j) loop
        n := n + 1;
        exit when n > 40;
        if k ~ '^[a-z0-9_]{1,40}$' then
          s := public.fn_sanear_json(v, p_depth + 1);
          if s is not null then out := out || jsonb_build_object(k, s); end if;
        end if;
      end loop;
      return out;
    else
      return null;
  end case;
end;
$$;
revoke all on function public.fn_sanear_json(jsonb, int) from public, anon, authenticated;

create or replace function public.ficha_obtener(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare f public.fichas_ingreso%rowtype; v_nombre text;
begin
  select * into f from public.fichas_ingreso where token = p_token;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'no_existe'); end if;
  if f.estado <> 'pendiente' then return jsonb_build_object('ok', false, 'motivo', 'ya_enviada'); end if;
  if f.expira_en < now() then return jsonb_build_object('ok', false, 'motivo', 'vencida'); end if;
  if f.paciente_id is not null then
    select split_part(nombre, ' ', 1) into v_nombre from public.pacientes where id = f.paciente_id;
  end if;
  return jsonb_build_object('ok', true, 'nombre', v_nombre, 'incluye_longevidad', f.incluye_longevidad);
end;
$$;
revoke all on function public.ficha_obtener(text) from public;
grant execute on function public.ficha_obtener(text) to anon, authenticated;

create or replace function public.ficha_enviar(p_token text, p_datos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  f public.fichas_ingreso%rowtype;
  d jsonb;
  v_fn date;
  v_est numeric;
  v_gen text;
  v_pat jsonb;
  v_long jsonb;
  v_sec text;
  v_sec_val jsonb;
begin
  if p_datos is null or jsonb_typeof(p_datos) <> 'object' or length(p_datos::text) > 40000 then
    return jsonb_build_object('ok', false, 'motivo', 'datos_invalidos');
  end if;

  select * into f from public.fichas_ingreso where token = p_token for update;
  if not found then return jsonb_build_object('ok', false, 'motivo', 'no_existe'); end if;
  if f.estado <> 'pendiente' then return jsonb_build_object('ok', false, 'motivo', 'ya_enviada'); end if;
  if f.expira_en < now() then return jsonb_build_object('ok', false, 'motivo', 'vencida'); end if;

  if btrim(coalesce(p_datos->>'nombre', '')) = '' or btrim(coalesce(p_datos->>'apellido', '')) = '' then
    return jsonb_build_object('ok', false, 'motivo', 'falta_nombre');
  end if;

  begin v_fn := nullif(p_datos->>'fecha_nacimiento', '')::date; exception when others then v_fn := null; end;
  if v_fn is not null and (v_fn < date '1900-01-01' or v_fn > current_date) then v_fn := null; end if;

  begin v_est := nullif(p_datos->>'estatura_cm', '')::numeric; exception when others then v_est := null; end;
  if v_est is not null and (v_est < 50 or v_est > 250) then v_est := null; end if;

  v_gen := p_datos->>'genero';
  if v_gen is null or v_gen not in ('Femenino', 'Masculino', 'Otro') then v_gen := null; end if;

  select coalesce(jsonb_agg(c), '[]'::jsonb) into v_pat
  from (
    select distinct e.value as c
    from jsonb_array_elements_text(
           case when jsonb_typeof(p_datos->'patologias') = 'array' then p_datos->'patologias' else '[]'::jsonb end
         ) as e(value)
    where e.value ~ '^[a-z0-9_]{1,60}$'
    limit 40
  ) q;

  -- Historia de longevidad: solo si la ficha la pidió; se conservan únicamente las secciones conocidas
  v_long := null;
  if f.incluye_longevidad and jsonb_typeof(p_datos->'longevidad') = 'object' then
    v_long := '{}'::jsonb;
    foreach v_sec in array array['perfil', 'familiares', 'nutricion', 'actividad', 'sueno_estres', 'exposoma', 'patologicos', 'tratamientos_previos'] loop
      if jsonb_typeof(p_datos->'longevidad'->v_sec) = 'object' then
        v_sec_val := public.fn_sanear_json(p_datos->'longevidad'->v_sec, 0);
        if v_sec_val is not null and v_sec_val <> '{}'::jsonb then
          v_long := v_long || jsonb_build_object(v_sec, v_sec_val);
        end if;
      end if;
    end loop;
    if length(v_long::text) > 15000 then v_long := null; end if;
  end if;

  d := jsonb_build_object(
    'nombre',           left(btrim(p_datos->>'nombre'), 80),
    'apellido',         left(btrim(p_datos->>'apellido'), 80),
    'cedula',           left(btrim(coalesce(p_datos->>'cedula', '')), 20),
    'telefono',         left(btrim(coalesce(p_datos->>'telefono', '')), 30),
    'email',            left(btrim(coalesce(p_datos->>'email', '')), 120),
    'fecha_nacimiento', v_fn,
    'genero',           v_gen,
    'estatura_cm',      v_est,
    'patologias',       v_pat,
    'alergias',         left(btrim(coalesce(p_datos->>'alergias', '')), 500),
    'antecedentes',     left(btrim(coalesce(p_datos->>'antecedentes', '')), 1500),
    'medicamentos',     left(btrim(coalesce(p_datos->>'medicamentos', '')), 800),
    'motivo',           left(btrim(coalesce(p_datos->>'motivo', '')), 500),
    'veracidad',        coalesce((p_datos->>'veracidad') = 'true', false),
    'privacidad',       coalesce((p_datos->>'privacidad') = 'true', false)
  );
  if v_long is not null then d := d || jsonb_build_object('longevidad', v_long); end if;

  if not (coalesce((d->>'veracidad')::boolean, false) and coalesce((d->>'privacidad')::boolean, false)) then
    return jsonb_build_object('ok', false, 'motivo', 'falta_aceptacion');
  end if;

  update public.fichas_ingreso set estado = 'recibida', datos = d, recibida_en = now() where id = f.id;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.ficha_enviar(text, jsonb) from public;
grant execute on function public.ficha_enviar(text, jsonb) to anon, authenticated;
