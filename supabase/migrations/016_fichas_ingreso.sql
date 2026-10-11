-- Ficha de ingreso del paciente: la Dra. envía un enlace de un solo uso, el paciente llena sus datos y antecedentes
-- desde su teléfono, y la Dra. los carga en la app con un botón (ella revisa y confirma; nada se aplica solo).

create table if not exists public.fichas_ingreso (
  id           uuid primary key default gen_random_uuid(),
  token        text not null unique,
  paciente_id  uuid references public.pacientes(id) on delete cascade,   -- null = paciente nuevo
  estado       text not null default 'pendiente' check (estado in ('pendiente', 'recibida', 'aplicada', 'descartada')),
  expira_en    timestamptz not null default (now() + interval '7 days'),
  datos        jsonb,
  recibida_en  timestamptz,
  aplicada_en  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists idx_fichas_paciente on public.fichas_ingreso (paciente_id);
create index if not exists idx_fichas_estado on public.fichas_ingreso (estado);

alter table public.fichas_ingreso enable row level security;
create policy staff_select on public.fichas_ingreso for select to authenticated using (public.fn_es_personal());
create policy staff_insert on public.fichas_ingreso for insert to authenticated with check (public.fn_es_personal());
create policy staff_update on public.fichas_ingreso for update to authenticated using (public.fn_es_personal()) with check (public.fn_es_personal());
create policy staff_delete on public.fichas_ingreso for delete to authenticated using (public.fn_es_personal());

-- Token aleatorio de 24 caracteres (no adivinable) generado por el servidor
create or replace function public.fn_ficha_token()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  b bytea := extensions.gen_random_bytes(24);
  s text := '';
  i int;
begin
  for i in 0..23 loop
    s := s || substr(alfabeto, (get_byte(b, i) % length(alfabeto)) + 1, 1);
  end loop;
  new.token := s;
  new.estado := 'pendiente';
  new.datos := null;
  new.recibida_en := null;
  new.aplicada_en := null;
  return new;
end;
$$;
revoke all on function public.fn_ficha_token() from public, anon, authenticated;

drop trigger if exists trg_ficha_token on public.fichas_ingreso;
create trigger trg_ficha_token before insert on public.fichas_ingreso
  for each row execute function public.fn_ficha_token();

-- Público: ¿el enlace sirve? Solo devuelve el primer nombre (para saludar) y si está vigente.
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
  return jsonb_build_object('ok', true, 'nombre', v_nombre);
end;
$$;
revoke all on function public.ficha_obtener(text) from public;
grant execute on function public.ficha_obtener(text) to anon, authenticated;

-- Público: el paciente envía su ficha (una sola vez). Se validan y limitan todos los campos en el servidor.
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
begin
  if p_datos is null or jsonb_typeof(p_datos) <> 'object' or length(p_datos::text) > 20000 then
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
  if v_gen not in ('Femenino', 'Masculino') then v_gen := null; end if;

  -- patologías: solo códigos tipo "neoplasia_previa", máximo 40
  select coalesce(jsonb_agg(c), '[]'::jsonb) into v_pat
  from (
    select distinct e.value as c
    from jsonb_array_elements_text(
           case when jsonb_typeof(p_datos->'patologias') = 'array' then p_datos->'patologias' else '[]'::jsonb end
         ) as e(value)
    where e.value ~ '^[a-z0-9_]{1,60}$'
    limit 40
  ) q;

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

  if not (coalesce((d->>'veracidad')::boolean, false) and coalesce((d->>'privacidad')::boolean, false)) then
    return jsonb_build_object('ok', false, 'motivo', 'falta_aceptacion');
  end if;

  update public.fichas_ingreso set estado = 'recibida', datos = d, recibida_en = now() where id = f.id;
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.ficha_enviar(text, jsonb) from public;
grant execute on function public.ficha_enviar(text, jsonb) to anon, authenticated;
