-- ============================================
-- MIGRACIÓN 004: ENDURECIMIENTO DE SEGURIDAD
-- Aplicada en el proyecto Supabase DrMayela (hytrretjngjlbkkcoeoi) el 2026-07-27.
--
-- Contexto: la base de datos en producción tenía políticas permisivas
-- "Allow all" (rol public, USING true) que exponían TODOS los datos de
-- pacientes (PHI), historiales, finanzas, consentimientos y exámenes a
-- lectura/escritura ANÓNIMA con la anon key pública. Además, las RPC
-- SECURITY DEFINER eran ejecutables por `anon` vía una concesión a PUBLIC.
-- ============================================

-- 4A. Eliminar políticas permisivas (public/anon). Cada tabla conserva su
--     juego staff_* (authenticated + email @clinicamayela.com), verificado
--     completo (SELECT/INSERT/UPDATE/DELETE) antes de aplicar.
DROP POLICY IF EXISTS "Allow all" ON public.pacientes;
DROP POLICY IF EXISTS "pacientes_solo_autenticada" ON public.pacientes;
DROP POLICY IF EXISTS "Allow all" ON public.historial_clinico;
DROP POLICY IF EXISTS "historial_solo_autenticada" ON public.historial_clinico;
DROP POLICY IF EXISTS "Allow all" ON public.citas;
DROP POLICY IF EXISTS "citas_solo_autenticada" ON public.citas;
DROP POLICY IF EXISTS "Allow all" ON public.transacciones;
DROP POLICY IF EXISTS "Allow all" ON public.consentimientos;
DROP POLICY IF EXISTS "Allow all" ON public.examenes_laboratorio;
DROP POLICY IF EXISTS "Allow all" ON public.recipes_medicos;
DROP POLICY IF EXISTS "Allow all" ON public.composicion_corporal;
DROP POLICY IF EXISTS "Acceso total autenticado" ON public.composicion_corporal;
DROP POLICY IF EXISTS "Allow all" ON public.doctor_profile;
DROP POLICY IF EXISTS "doctor_profile_solo_autenticada" ON public.doctor_profile;
DROP POLICY IF EXISTS "Allow all" ON public.tratamientos;
DROP POLICY IF EXISTS "Allow all" ON public.clinic_settings;
DROP POLICY IF EXISTS "Solo clinica autenticada lee settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Solo service_role escribe settings" ON public.clinic_settings;

-- 4B. Fijar search_path en funciones (elimina function_search_path_mutable).
ALTER FUNCTION public.crear_cita_con_transaccion(uuid, uuid, timestamptz, text, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.cancelar_cita(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.check_appointment_conflict(timestamptz, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_audit_trigger() SET search_path = public, pg_temp;

-- 4C. Quitar EXECUTE a anon/PUBLIC en las RPC. El acceso anónimo provenía de
--     una concesión a PUBLIC, por lo que REVOKE ... FROM anon no bastaba.
REVOKE EXECUTE ON FUNCTION public.crear_cita_con_transaccion(uuid, uuid, timestamptz, text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancelar_cita(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_appointment_conflict(timestamptz, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.fn_audit_trigger() FROM PUBLIC, anon, authenticated;

-- Frontend (staff autenticado) y bot (service_role) conservan acceso explícito.
GRANT EXECUTE ON FUNCTION public.crear_cita_con_transaccion(uuid, uuid, timestamptz, text, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_cita(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_appointment_conflict(timestamptz, integer) TO authenticated, service_role;

-- NOTA: crear_cita_con_transaccion y cancelar_cita siguen siendo ejecutables por
-- `authenticated` (lint 0029). Es INTENCIONAL: el staff crea/cancela citas por ahí.
-- El riesgo real (acceso anónimo) queda cerrado.
