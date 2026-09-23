-- Migración: Tabla de Apoyos (Soporte Especializado)
-- Fecha: 2026-09-07 — REESCRITURA tras auditoría
-- No destructive: solo crea tablas nuevas

BEGIN;

-- ============================================================
-- TABLA PRINCIPAL DE APOYOS
-- ============================================================
CREATE TABLE IF NOT EXISTS apoyos (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Asesor (del equipo Soporte Especializado)
  asesor_id       TEXT NOT NULL,          -- FK → cope_usuarios(id)
  asesor_nombre   TEXT NOT NULL,          -- denormalizado para performance

  -- Cliente
  dominio         TEXT,                   -- normalizado con normalizeDomain()
  cliente_nombre  TEXT,

  -- Tiempo
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio     TIME,                   -- HH:MM (hora local)
  hora_fin        TIME,                   -- HH:MM (hora local)
  duracion_min    INT GENERATED ALWAYS AS (
                    CASE WHEN hora_inicio IS NOT NULL AND hora_fin IS NOT NULL
                         THEN EXTRACT(EPOCH FROM (hora_fin - hora_inicio)) / 60
                         ELSE NULL END
                  ) STORED,

  -- Estado
  estado          TEXT NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE', 'ACTIVO', 'CERRADO')),

  -- Categorización
  -- Categoría principal: las 4 del requerimiento
  categoria       TEXT NOT NULL
                  CHECK (categoria IN (
                    'Dudas y consultas',
                    'Apoyos con clientes',
                    'Manejo de casos derivado',
                    'Apoyo funciones de otras áreas'
                  )),
  -- Subcategoría funcional: categoría homologada de COPE
  -- Fuente: public.homologacion_categorias.categoria
  -- (ej: FACTURACION ELECTRONICA, GESTION, INTEGRACIONES, etc.)
  subcategoria_fun TEXT,
  -- Sub-subcategoría funcional: subcategoría raw de COPE
  -- Fuente: public.homologacion_categorias.subcategoria
  -- (ej: Activacion FE, Queja, Solicitud de integracion Rappi, etc.)
  sub_subcategoria_fun TEXT,

  -- Área a apoyar (de las áreas existentes en qd_areas)
  area            TEXT NOT NULL,

  -- Seguimiento
  persona_apoyo   TEXT,                   -- persona que brinda el apoyo
  comentario      TEXT,

  -- Auditoría
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      TEXT,                   -- usuario que creó
  cerrado_at      TIMESTAMPTZ,
  cerrado_by      TEXT,                   -- usuario que cerró
  eliminado       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_apoyos_fecha       ON apoyos (fecha);
CREATE INDEX IF NOT EXISTS idx_apoyos_estado      ON apoyos (estado);
CREATE INDEX IF NOT EXISTS idx_apoyos_asesor_id   ON apoyos (asesor_id);
CREATE INDEX IF NOT EXISTS idx_apoyos_dominio     ON apoyos (dominio);
CREATE INDEX IF NOT EXISTS idx_apoyos_area        ON apoyos (area);
CREATE INDEX IF NOT EXISTS idx_apoyos_categoria   ON apoyos (categoria);
CREATE INDEX IF NOT EXISTS idx_apoyos_subcategoria_fun ON apoyos (subcategoria_fun);
CREATE INDEX IF NOT EXISTS idx_apoyos_created_at  ON apoyos (created_at);

COMMENT ON TABLE apoyos IS 'Apoyos del Soporte Especializado - registro y seguimiento';
COMMENT ON COLUMN apoyos.categoria IS 'Categoría principal del apoyo (4 valores fijos)';
COMMENT ON COLUMN apoyos.subcategoria_fun IS 'Subcategoría funcional: categoría homologada de COPE (homologacion_categorias.categoria)';
COMMENT ON COLUMN apoyos.sub_subcategoria_fun IS 'Sub-subcategoría funcional: subcategoría raw de COPE (homologacion_categorias.subcategoria)';
COMMENT ON COLUMN apoyos.duracion_min IS 'Duración en minutos calculada automáticamente (hora_fin - hora_inicio)';

-- ============================================================
-- PERMISOS PARA EL MÓDULO "Gestión"
-- ============================================================
INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
SELECT
  'perm-gestion-apoyos-' || v.accion || '-' || r.id,
  'Gestión', v.accion, r.id, TRUE
FROM cope_roles r
CROSS JOIN (VALUES
  ('ver'),
  ('crear'),
  ('editar'),
  ('cerrar'),
  ('ver_todos'),      -- ver todos los apoyos (no solo los propios)
  ('exportar')        -- exportar apoyos a Excel
) AS v(accion)
WHERE r.nombre IN ('Administrador', 'Supervisor')
ON CONFLICT (modulo, accion, rol_id) DO NOTHING;

COMMIT;
