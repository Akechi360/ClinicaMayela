-- Ya aplicada en Supabase (20261006011157). Se versiona aquí para que el repo coincida con la base.
-- La verificación pública solo muestra al paciente como "Nombre A." (privacidad).
create or replace function public.verificar_recipe(p_id uuid, p_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r public.recipes_medicos%rowtype; d public.doctor_profile%rowtype; pac text;
begin
  select * into r from public.recipes_medicos where id = p_id;
  if not found or r.hash_sha256 is distinct from p_hash or public.fn_recipe_hash(r) is distinct from r.hash_sha256 then
    return jsonb_build_object('valido', false);
  end if;
  select * into d from public.doctor_profile limit 1;
  select nombre || coalesce(' ' || left(apellido, 1) || '.', '') into pac from public.pacientes where id = r.paciente_id;
  return jsonb_build_object(
    'valido', true,
    'fecha', r.fecha,
    'medicamentos', r.medicamentos,
    'indicaciones', r.indicaciones,
    'paciente', pac,
    'doctor_nombre', r.doctor_nombre,
    'doctor_mpps', r.doctor_mpps,
    'doctor_col', r.doctor_col,
    'especialidad', d.especialidad,
    'firma', d.firma_base64,
    'sello', d.sello_base64);
end;
$$;
revoke all on function public.verificar_recipe(uuid, text) from public;
grant execute on function public.verificar_recipe(uuid, text) to anon, authenticated;
