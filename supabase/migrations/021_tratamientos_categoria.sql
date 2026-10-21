-- El catálogo de tratamientos ya tiene un campo "Categoría" en pantalla, pero la columna no existía:
-- al llenarlo el guardado fallaba. Solo agrega la columna (opcional).
alter table public.tratamientos add column if not exists categoria text;
