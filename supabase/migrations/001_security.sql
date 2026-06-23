-- ============================================
-- MIGRACIÓN 001: SEGURIDAD
-- ============================================

-- 1A. Hacer buckets privados
UPDATE storage.buckets SET public = false WHERE id IN ('examenes', 'pacientes-fotos');

-- Reemplazar policy de lectura pública por lectura autenticada
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('examenes', 'pacientes-fotos')
    AND auth.jwt() ->> 'email' LIKE '%@clinicamayela.com'
  );

-- 1D. Reemplazar policies FOR ALL por policies granulares con WITH CHECK
-- Patrón: SELECT (USING), INSERT (WITH CHECK), UPDATE (USING + WITH CHECK), DELETE (USING)

-- tratamientos
DROP POLICY IF EXISTS "Allow authenticated staff" ON tratamientos;
CREATE POLICY "staff_select" ON tratamientos FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON tratamientos FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON tratamientos FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON tratamientos FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- pacientes
DROP POLICY IF EXISTS "Allow authenticated staff" ON pacientes;
CREATE POLICY "staff_select" ON pacientes FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON pacientes FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON pacientes FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON pacientes FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- citas
DROP POLICY IF EXISTS "Allow authenticated staff" ON citas;
CREATE POLICY "staff_select" ON citas FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON citas FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON citas FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON citas FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- historial_clinico
DROP POLICY IF EXISTS "Allow authenticated staff" ON historial_clinico;
CREATE POLICY "staff_select" ON historial_clinico FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON historial_clinico FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON historial_clinico FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON historial_clinico FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- transacciones
DROP POLICY IF EXISTS "Allow authenticated staff" ON transacciones;
CREATE POLICY "staff_select" ON transacciones FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON transacciones FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON transacciones FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON transacciones FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- doctor_profile
DROP POLICY IF EXISTS "Allow authenticated staff" ON doctor_profile;
CREATE POLICY "staff_select" ON doctor_profile FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON doctor_profile FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON doctor_profile FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON doctor_profile FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- clinic_settings
DROP POLICY IF EXISTS "Allow authenticated staff" ON clinic_settings;
CREATE POLICY "staff_select" ON clinic_settings FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON clinic_settings FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON clinic_settings FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON clinic_settings FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- examenes_laboratorio
DROP POLICY IF EXISTS "Allow authenticated staff" ON examenes_laboratorio;
CREATE POLICY "staff_select" ON examenes_laboratorio FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON examenes_laboratorio FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON examenes_laboratorio FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON examenes_laboratorio FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- recipes_medicos
DROP POLICY IF EXISTS "Allow authenticated staff" ON recipes_medicos;
CREATE POLICY "staff_select" ON recipes_medicos FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON recipes_medicos FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON recipes_medicos FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON recipes_medicos FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- consentimientos
DROP POLICY IF EXISTS "Allow authenticated staff" ON consentimientos;
CREATE POLICY "staff_select" ON consentimientos FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON consentimientos FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON consentimientos FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON consentimientos FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- composicion_corporal
DROP POLICY IF EXISTS "Allow authenticated staff" ON composicion_corporal;
CREATE POLICY "staff_select" ON composicion_corporal FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON composicion_corporal FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON composicion_corporal FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON composicion_corporal FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
