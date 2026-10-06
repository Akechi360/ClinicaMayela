-- 010: Storage endurecido. Quita las políticas PÚBLICAS (anon) sobre storage.objects, deja solo personal de la clínica,
--      y crea el bucket privado `pacientes-fotos` que el código ya usaba pero no existía.

-- Bucket privado de fotos antes/después (8 MB, solo imágenes)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pacientes-fotos', 'pacientes-fotos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Políticas públicas (cualquiera con la anon key podía leer/borrar `examenes` y subir a cualquier bucket)
drop policy if exists "Allow deletes" on storage.objects;
drop policy if exists "Allow reads" on storage.objects;
drop policy if exists "Allow uploads" on storage.objects;

-- La subida de usuarios autenticados no validaba que fueran personal ni el bucket
drop policy if exists "Allow authenticated uploads" on storage.objects;
create policy "Staff uploads" on storage.objects for insert to authenticated
  with check (bucket_id in ('examenes', 'pacientes-fotos') and public.fn_es_personal());
