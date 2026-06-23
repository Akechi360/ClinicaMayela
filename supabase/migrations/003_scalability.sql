-- ============================================
-- MIGRACIÓN 003: PREPARACIÓN PARA ESCALABILIDAD
-- Estas tablas están vacías y sin uso activo.
-- Se crean ahora para que el esquema esté listo cuando se
-- implemente el portal de pacientes y el sistema de roles.
-- ============================================

-- 3A. Perfiles de usuario con rol (admin vs patient)
-- Cuando se active: cambiar RLS de todas las tablas para consultar esta tabla
-- en lugar de verificar el email directamente.
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'patient')),
  paciente_id UUID REFERENCES pacientes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede leer su propio perfil
CREATE POLICY "users_read_own" ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Solo admins pueden gestionar perfiles
CREATE POLICY "admin_manage" ON user_profiles FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
  );

-- 3B. Slots de reserva pública (para futuro auto-agendamiento de pacientes)
-- La Dra. Mayela podrá publicar horarios disponibles y los pacientes
-- seleccionarán directamente desde un portal web.
CREATE TABLE IF NOT EXISTS public_booking_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_hora     TIMESTAMPTZ NOT NULL,
  disponible     BOOLEAN NOT NULL DEFAULT true,
  tratamiento_id UUID REFERENCES tratamientos(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public_booking_slots ENABLE ROW LEVEL SECURITY;

-- Lectura pública (pacientes podrán ver slots disponibles)
CREATE POLICY "anyone_read_available" ON public_booking_slots FOR SELECT TO authenticated
  USING (disponible = true);

-- Solo staff puede crear/modificar slots
CREATE POLICY "staff_manage" ON public_booking_slots FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@clinicamayela.com');
