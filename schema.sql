-- 2.1 Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2.2 tratamientos
CREATE TABLE tratamientos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  descripcion      TEXT,
  precio           NUMERIC(10,2) NOT NULL DEFAULT 0,
  duracion_minutos INTEGER NOT NULL DEFAULT 30,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE tratamientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON tratamientos FOR ALL TO authenticated USING (true);

INSERT INTO tratamientos (nombre, descripcion, precio, duracion_minutos) VALUES
('Toxina Botulínica (Botox)', 'Tratamiento de arrugas de expresión en frente, glabela y patas de gallo.', 450, 30),
('Ácido Hialurónico Labios', 'Perfilado y volumen de labios con técnica rusa o clásica.', 380, 45),
('Marcación Mandibular y Mentón', 'Armonización del contorno mandibular y proyección de mentón.', 1850, 60),
('Peeling Químico Médico', 'Renovación celular profunda para manchas, acné y luminosidad.', 150, 30),
('Radiesse (Bioestimulador)', 'Inducción de colágeno para combatir la flacidez y dar volumen sutil.', 650, 45),
('Endoláser Facial', 'Lifting facial asistido por láser diodo no invasivo.', 1200, 90),
('Armonizacion Facial', 'Tratamiento facial de armonización estética.', 600, 45),
('Adipoestructuración Facial', 'Remodelación y estructuración de la grasa facial.', 750, 60),
('Limpieza de cutis', 'Higiene facial profunda con extracción e hidratación.', 80, 45),
('Rejuvenecimiento facial inteligente', 'Tratamiento inteligente adaptado a las necesidades celulares de la piel.', 500, 45),
('Hilos tensores aptos', 'Lifting biológico sin cirugía mediante hilos tensores reabsorbibles.', 900, 60),
('Bioestimuladores', 'Inductores de colágeno para recuperar firmeza y elasticidad.', 650, 45),
('Polirevitalizantes', 'Cocktail de vitaminas, aminoácidos y minerales para nutrir la dermis.', 300, 30),
('Blending Faciales', 'Mezcla sinérgica de activos adaptada para un brillo inmediato.', 350, 45),
('Exomas', 'Terapia molecular facial regeneradora avanzada.', 450, 30),
('Antienvejecimiento', 'Tratamiento facial preventivo contra el envejecimiento biológico.', 400, 30),
('Ellanse (Bioestimulador de colágeno)', 'Bioestimulador de colágeno y relleno autólogo de larga duración.', 850, 45),
('Hidroxiapatita (Bioestimulador de colágeno)', 'Tratamiento inductor de colágeno con hidroxiapatita de calcio.', 750, 45),
('Rich (Bioestimulador de colágeno)', 'Hidratación y estimulación cutánea profunda.', 480, 30),
('Reversal neo (Bioestimulador de colágeno)', 'Regeneración y reposición de volumen de efecto natural.', 550, 30),
('Pink (Polirevitalizante)', 'Terapia de hidratación profunda y efecto glow rosado.', 250, 30),
('Amber (Polirevitalizante)', 'Acción succínica y ácido hialurónico contra el fotoenvejecimiento.', 280, 30),
('Orquid (Polirevitalizante)', 'Revitalizante e hidratante para pieles deshidratadas.', 260, 30),
('Cristal healer (Polirevitalizante)', 'Nutrición celular y efecto de suavidad de cristal.', 300, 30),
('Polinucleotidos (Polirevitalizante)', 'Reparador de tejido dérmico con polinucleótidos bioactivos.', 380, 30),
('Mesoheal (Polirevitalizante)', 'Mesoterapia revitalizante de efecto tensor y regenerador.', 290, 30),
('Lips soom (Labios)', 'Hidratación y volumen labial exclusivo.', 320, 45),
('Labios ac hialurónico Cristal', 'Modelado y voluminización labial con ácido hialurónico de alta gama.', 390, 45),
('Técnica 4 puntos nariz', 'Rinomodelación no quirúrgica mediante puntos estratégicos de soporte.', 450, 30),
('Armonizacion Facial Técnica 4 puntos malar mandibula', 'Proyección mandibular y definición de pómulos mediante puntos fijos.', 890, 60),
('Peeling', 'Exfoliación médica y peeling para renovación de capas de la piel.', 130, 30),
('Tratamiento exosomas', 'Terapia regenerativa y antiinflamatoria celular con exosomas.', 420, 45),
('Exosomas capilares', 'Regeneración y bioestimulación capilar contra la alopecia.', 480, 45),
('Depilación laser', 'Remoción definitiva del vello mediante tecnología láser.', 90, 30),
('Quemadores de grasa', 'Tratamiento lipolítico localizado.', 160, 30),
('Sueroterapia', 'Infusiones endovenosas para revitalización y desintoxicación.', 200, 45),
('Corporales: Indiba', 'Radiofrecuencia Indiba para reafirmación y modelado corporal.', 120, 45),
('Corporales: Carboxiterapia', 'Infusión subcutánea de CO2 contra la grasa localizada y celulitis.', 95, 30),
('Corporales: Ultracavitacion', 'Ultrasonidos de alta potencia para romper adipocitos rebeldes.', 110, 45),
('Corporales: Radiofrecuencia', 'Radiofrecuencia reafirmante corporal.', 100, 45),
('Péptidos metabólicos (tirzapatida o mountjaro)', 'Control metabólico y reducción ponderal asistida.', 350, 30),
('Péptidos longevidad: G', 'Fórmula peptídica de longevidad regeneradora.', 180, 15),
('Péptidos longevidad: Ghc ku', 'Tratamiento de antienvejecimiento celular.', 190, 15),
('Péptidos longevidad: Glow', 'Péptidos para la luminosidad e hidratación a nivel celular.', 190, 15),
('Péptidos longevidad: Most c', 'Terapia con péptidos para la renovación celular.', 200, 15),
('Péptidos longevidad: Telomerasa', 'Tratamiento antienvejecimiento celular inhibidor de telómeros.', 280, 15),
('Recuperación: Bpc157+tb 500', 'Terapia peptídica regeneradora y antiinflamatoria sistémica.', 240, 15),
('Inmunológicos', 'Suplementación de soporte e inmunorregulación avanzada.', 220, 30),
('Oxigenadores: Semax', 'Péptido regulador neuroprotector y de oxigenación.', 150, 15),
('Sexuales: Pt151', 'Tratamiento peptídico para disfunciones y vitalidad sexual.', 230, 15),
('Hormonales gym: Cj1295+ipamorelin', 'Estimulador de la liberación de hormona de crecimiento.', 300, 15),
('Hormonales gym: Tesamorelin', 'Péptido específico para quema de grasa visceral y definición muscular.', 340, 15);

-- 2.3 pacientes
CREATE TABLE pacientes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  apellido         TEXT,
  cedula           TEXT,
  telefono         TEXT,
  email            TEXT,
  fecha_nacimiento DATE,
  genero           TEXT,
  antecedentes     TEXT,
  alergias         TEXT,
  notas            TEXT,
  es_vip           BOOLEAN NOT NULL DEFAULT false,
  foto_perfil      TEXT,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON pacientes FOR ALL TO authenticated USING (true);

-- 2.4 citas
CREATE TABLE citas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id    UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tratamiento_id UUID NOT NULL REFERENCES tratamientos(id),
  fecha_hora     TIMESTAMPTZ NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente','confirmado','en_sala','completado','cancelado')),
  notas          TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON citas FOR ALL TO authenticated USING (true);

-- 2.5 historial_clinico
CREATE TABLE historial_clinico (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id             UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  cita_id                 UUID REFERENCES citas(id),
  tratamiento_id          UUID REFERENCES tratamientos(id),
  fecha                   DATE NOT NULL,
  producto                TEXT,
  cantidad                TEXT,
  lote                    TEXT,
  tecnica                 TEXT,
  notas_medicas           TEXT,
  mapa_facial_coordenadas JSONB NOT NULL DEFAULT '[]',
  foto_antes              TEXT,
  foto_despues            TEXT,
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE historial_clinico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON historial_clinico FOR ALL TO authenticated USING (true);

-- 2.6 transacciones
CREATE TABLE transacciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  cita_id     UUID REFERENCES citas(id),
  fecha       DATE NOT NULL,
  monto       NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado      TEXT NOT NULL DEFAULT 'pendiente'
              CHECK (estado IN ('pendiente','completado','cancelado')),
  metodo_pago TEXT DEFAULT 'efectivo'
              CHECK (metodo_pago IN ('efectivo','tarjeta','transferencia','zelle','binance','pago_movil')),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON transacciones FOR ALL TO authenticated USING (true);

-- 2.7 doctor_profile
CREATE TABLE doctor_profile (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL DEFAULT 'Dra. Mayela González',
  especialidad TEXT DEFAULT 'Medicina Estética & Bienestar',
  cedula       TEXT,
  mpps         TEXT,
  col          TEXT,
  email        TEXT,
  telefono     TEXT,
  foto_perfil  TEXT,
  biografia    TEXT,
  horario      TEXT,
  linkedin     TEXT,
  instagram    TEXT,
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO doctor_profile (nombre, especialidad, cedula, mpps, col, horario, instagram)
VALUES ('Dra. Mayela González','Medicina Estética & Bienestar','12345678-A','MPPS-98765','COL-12345','Lunes a Viernes de 9:00 a 18:30','https://instagram.com/dra.mayelagonzalez');
ALTER TABLE doctor_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON doctor_profile FOR ALL TO authenticated USING (true);

-- 2.8 clinic_settings
CREATE TABLE clinic_settings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_activo         BOOLEAN NOT NULL DEFAULT false,
  bot_conectado      BOOLEAN NOT NULL DEFAULT false,
  bot_qr_base64      TEXT,
  hora_recordatorio  TIME DEFAULT '09:00:00',
  mensaje_bienvenida TEXT DEFAULT '👋 Hola, soy el asistente de *Clínica Mayela*. ¿En qué te puedo ayudar?',
  updated_at         TIMESTAMPTZ
);
INSERT INTO clinic_settings (bot_activo, bot_conectado) VALUES (false, false);
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON clinic_settings FOR ALL TO authenticated USING (true);

-- 2.9 examenes_laboratorio (TABLA NUEVA)
CREATE TABLE examenes_laboratorio (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  fecha       DATE NOT NULL,
  notas       TEXT,
  archivo_url TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE examenes_laboratorio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON examenes_laboratorio FOR ALL TO authenticated USING (true);

-- 2.10 recipes_medicos (TABLA NUEVA)
CREATE TABLE recipes_medicos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id  UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha        DATE NOT NULL,
  medicamentos TEXT NOT NULL,
  indicaciones TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE recipes_medicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON recipes_medicos FOR ALL TO authenticated USING (true);

-- 2.11 consentimientos (TABLA NUEVA)
CREATE TABLE consentimientos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id        UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  paciente_nombre    TEXT NOT NULL,
  paciente_dni       TEXT NOT NULL,
  tratamiento_nombre TEXT NOT NULL,
  fecha              DATE NOT NULL DEFAULT CURRENT_DATE,
  doctor_nombre      TEXT NOT NULL,
  estado             TEXT NOT NULL DEFAULT 'Pendiente'
                     CHECK (estado IN ('Activo','Pendiente','Archivado')),
  firma_base64       TEXT,
  version            INTEGER NOT NULL DEFAULT 1,
  clausulas          JSONB NOT NULL DEFAULT '[]',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE consentimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON consentimientos FOR ALL TO authenticated USING (true);

-- 2.12 Storage buckets para exámenes y fotos de pacientes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('examenes','examenes',true,5242880, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('pacientes-fotos','pacientes-fotos',true,8388608, ARRAY['image/jpeg','image/png','image/webp']);

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('examenes', 'pacientes-fotos'));
CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id IN ('examenes', 'pacientes-fotos'));
CREATE POLICY "Allow authenticated deletes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('examenes', 'pacientes-fotos'));

-- 2.13 composicion_corporal
CREATE TABLE IF NOT EXISTS composicion_corporal (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id    UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  fecha          DATE NOT NULL,
  peso_kg        NUMERIC(5,2) NOT NULL,
  grasa_pct      NUMERIC(5,2) NOT NULL,
  masa_magra_kg  NUMERIC(5,2) GENERATED ALWAYS AS (peso_kg * (1 - grasa_pct / 100)) STORED,
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE composicion_corporal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated" ON composicion_corporal FOR ALL TO authenticated USING (true);
