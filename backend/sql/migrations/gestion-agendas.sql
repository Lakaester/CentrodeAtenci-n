-- Migración: Tabla de Agendas (Reuniones y Capacitaciones)
-- Fecha: 2026-09-07 — REESCRITURA tras auditoría
-- No destructive: solo crea tablas nuevas

BEGIN;

-- ============================================================
-- TABLA PRINCIPAL DE AGENDAS
-- ============================================================
CREATE TABLE IF NOT EXISTS agendas (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Tipo
  tipo            TEXT NOT NULL
                  CHECK (tipo IN ('REUNION', 'CAPACITACION')),

  -- Asesor
  asesor_id       TEXT NOT NULL,
  asesor_nombre   TEXT NOT NULL,
  asesor_correo   TEXT NOT NULL,

  -- Cliente
  dominio         TEXT,
  cliente_nombre  TEXT,
  cliente_numero  TEXT,

  -- Tiempo
  fecha           DATE NOT NULL,
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,
  duracion_min    INT GENERATED ALWAYS AS (
                    EXTRACT(EPOCH FROM (hora_fin - hora_inicio)) / 60
                  ) STORED,

  -- Estado
  estado          TEXT NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE', 'ACTIVA', 'FINALIZADA', 'CANCELADA')),

  -- Descripción
  descripcion     TEXT,

  -- Google Calendar (PENDIENTE — no hay integración real)
  calendar_event_id       TEXT,
  calendar_sync_status    TEXT DEFAULT 'PENDING'
                          CHECK (calendar_sync_status IN ('PENDING', 'SYNCED', 'ERROR', 'DISABLED')),
  calendar_sync_error     TEXT,

  -- Actas / Archivos (PENDIENTE — no hay implementación de upload/download)
  acta_file_id    TEXT,
  acta_nombre     TEXT,
  acta_tipo       TEXT,
  acta_tamano     INT,

  -- Grabación
  grabacion_url   TEXT,

  -- Auditoría
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      TEXT,
  eliminado       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agendas_fecha       ON agendas (fecha);
CREATE INDEX IF NOT EXISTS idx_agendas_estado      ON agendas (estado);
CREATE INDEX IF NOT EXISTS idx_agendas_asesor_id   ON agendas (asesor_id);
CREATE INDEX IF NOT EXISTS idx_agendas_tipo        ON agendas (tipo);
CREATE INDEX IF NOT EXISTS idx_agendas_dominio     ON agendas (dominio);
CREATE INDEX IF NOT EXISTS idx_agendas_created_at  ON agendas (created_at);

COMMENT ON TABLE agendas IS 'Agendas de reuniones y capacitaciones con clientes';
COMMENT ON COLUMN agendas.duracion_min IS 'Duración en minutos calculada automáticamente';
COMMENT ON COLUMN agendas.calendar_event_id IS 'ID evento Google Calendar — PENDIENTE de implementación';
COMMENT ON COLUMN agendas.acta_file_id IS 'ID archivo acta — PENDIENTE de implementación upload/download';
COMMENT ON COLUMN agendas.grabacion_url IS 'URL de grabación de la sesión';

-- ============================================================
-- TABLA DE ARCHIVOS ADJUNTOS (ACTAS)
-- Schema preparado. Implementación PENDIENTE (upload/download).
-- ============================================================
CREATE TABLE IF NOT EXISTS agenda_archivos (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agenda_id         TEXT NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
  nombre_original   TEXT NOT NULL,
  nombre_almacenado TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  tamano_bytes      INT NOT NULL,
  storage_path      TEXT NOT NULL,
  uploaded_by       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_archivos_agenda_id ON agenda_archivos (agenda_id);

COMMENT ON TABLE agenda_archivos IS 'Archivos adjuntos (actas) — schema preparado, upload PENDIENTE';

-- ============================================================
-- PERMISOS PARA AGENDAS
-- ============================================================
INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
SELECT
  'perm-gestion-' || v.accion || '-' || r.id,
  'Gestión', v.accion, r.id, TRUE
FROM cope_roles r
CROSS JOIN (VALUES
  ('gestionar_agendas'),
  ('subir_actas')
) AS v(accion)
WHERE r.nombre IN ('Administrador', 'Supervisor')
ON CONFLICT (modulo, accion, rol_id) DO NOTHING;

COMMIT;
