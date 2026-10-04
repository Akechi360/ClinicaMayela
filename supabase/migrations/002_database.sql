-- ============================================
-- MIGRACIÓN 002: ÍNDICES, TABLAS FALTANTES, FUNCIONES ATÓMICAS
-- ============================================

-- 2A. Índices en columnas FK y de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_historial_paciente ON historial_clinico(paciente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_paciente ON transacciones(paciente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_cita ON transacciones(cita_id);
CREATE INDEX IF NOT EXISTS idx_examenes_paciente ON examenes_laboratorio(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consentimientos_paciente ON consentimientos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_composicion_paciente ON composicion_corporal(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recipes_paciente ON recipes_medicos(paciente_id);

-- 2B. Tabla protocolos_peptidos (usada en peptidesService.ts pero faltante en schema)
CREATE TABLE IF NOT EXISTS protocolos_peptidos (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id               UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  doctor_id                 UUID REFERENCES doctor_profile(id),
  fecha_inicio              DATE,
  duracion_semanas          INTEGER NOT NULL DEFAULT 8,
  peptidos_seleccionados    JSONB NOT NULL DEFAULT '[]',
  intervalo_seguimiento     INTEGER NOT NULL DEFAULT 4,
  notas_medico              TEXT,
  estado                    TEXT NOT NULL DEFAULT 'borrador'
                            CHECK (estado IN ('borrador','activo','completado','cancelado')),
  consentimiento_firmado    BOOLEAN NOT NULL DEFAULT false,
  fecha_consentimiento      DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_protocolos_paciente ON protocolos_peptidos(paciente_id);
ALTER TABLE protocolos_peptidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_select" ON protocolos_peptidos FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON protocolos_peptidos FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON protocolos_peptidos FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_delete" ON protocolos_peptidos FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- 2C. Tabla audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla         TEXT NOT NULL,
  registro_id   UUID NOT NULL,
  accion        TEXT NOT NULL CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  datos_antes   JSONB,
  datos_despues JSONB,
  usuario_email TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_tabla ON audit_log(tabla);
CREATE INDEX IF NOT EXISTS idx_audit_registro ON audit_log(registro_id);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_select" ON audit_log FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');

-- Función trigger genérica de auditoría
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, datos_despues, usuario_email)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_setting('request.jwt.claims', true)::jsonb ->> 'email');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, datos_despues, usuario_email)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_setting('request.jwt.claims', true)::jsonb ->> 'email');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tabla, registro_id, accion, datos_antes, usuario_email)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_setting('request.jwt.claims', true)::jsonb ->> 'email');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Aplicar trigger a tablas críticas
CREATE TRIGGER trg_audit_pacientes AFTER INSERT OR UPDATE OR DELETE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_citas AFTER INSERT OR UPDATE OR DELETE ON citas
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_transacciones AFTER INSERT OR UPDATE OR DELETE ON transacciones
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
CREATE TRIGGER trg_audit_historial AFTER INSERT OR UPDATE OR DELETE ON historial_clinico
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

-- 2D. Funciones atómicas (RPC)

-- Crear cita + transacción en una sola transacción
CREATE OR REPLACE FUNCTION crear_cita_con_transaccion(
  p_paciente_id UUID,
  p_tratamiento_id UUID,
  p_fecha_hora TIMESTAMPTZ,
  p_notas TEXT DEFAULT NULL,
  p_precio NUMERIC DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cita_id UUID;
  v_precio NUMERIC;
BEGIN
  IF p_precio IS NULL THEN
    SELECT precio INTO v_precio FROM tratamientos WHERE id = p_tratamiento_id;
  ELSE
    v_precio := p_precio;
  END IF;

  INSERT INTO citas (paciente_id, tratamiento_id, fecha_hora, notas)
    VALUES (p_paciente_id, p_tratamiento_id, p_fecha_hora, p_notas)
    RETURNING id INTO v_cita_id;

  INSERT INTO transacciones (paciente_id, cita_id, fecha, monto, estado, metodo_pago)
    VALUES (p_paciente_id, v_cita_id, p_fecha_hora::date, COALESCE(v_precio, 0), 'pendiente', 'efectivo');

  RETURN v_cita_id;
END;
$$;

-- Cancelar cita + transacción en una sola transacción
CREATE OR REPLACE FUNCTION cancelar_cita(p_cita_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE citas SET estado = 'cancelado' WHERE id = p_cita_id;
  UPDATE transacciones SET estado = 'cancelado' WHERE cita_id = p_cita_id;
END;
$$;

-- Verificar conflicto de horario
CREATE OR REPLACE FUNCTION check_appointment_conflict(
  p_fecha_hora TIMESTAMPTZ,
  p_duracion_minutos INTEGER DEFAULT 30
) RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM citas c
    JOIN tratamientos t ON c.tratamiento_id = t.id
    WHERE c.estado NOT IN ('cancelado', 'completado')
    AND tstzrange(c.fecha_hora, c.fecha_hora + (t.duracion_minutos || ' minutes')::interval)
        && tstzrange(p_fecha_hora, p_fecha_hora + (p_duracion_minutos || ' minutes')::interval)
  );
$$;

-- 2E. Tabla de notificaciones (para Fase 4 - integraciones)
CREATE TABLE IF NOT EXISTS notificaciones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo       TEXT NOT NULL,
  mensaje    TEXT NOT NULL,
  leida      BOOLEAN NOT NULL DEFAULT false,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_select" ON notificaciones FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_insert" ON notificaciones FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
CREATE POLICY "staff_update" ON notificaciones FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
-- Habilitar Realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
