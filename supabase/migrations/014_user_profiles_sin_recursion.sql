-- 014: user_profiles — la política admin_manage consultaba la propia tabla (recursión infinita de RLS) y la app no usa
--      roles todavía (solo la Dra. accede). Se elimina; users_read_own se conserva. Si algún día se incorporan asistentes
--      o pacientes, se diseñan los roles con una función SECURITY DEFINER (sin consultar la tabla dentro de su política).
drop policy if exists admin_manage on public.user_profiles;
