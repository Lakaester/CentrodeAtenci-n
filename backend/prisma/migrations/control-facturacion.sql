-- Control de Facturación — tablas de intervenciones operativas de COPE.
-- Idempotente: se puede ejecutar varias veces sin perder datos.

CREATE TABLE IF NOT EXISTS facturacion_intervenciones (
  id                TEXT PRIMARY KEY,
  asesor            TEXT NOT NULL,
  unidad_negocio_id TEXT,
  cliente_nombre    TEXT,
  ruc               TEXT,
  dominio           TEXT NOT NULL DEFAULT '',
  proveedor         TEXT,
  facturas_pendientes INTEGER,
  boletas_pendientes  INTEGER,
  causa             TEXT,
  resultado         TEXT,
  observacion       TEXT,
  status            TEXT NOT NULL DEFAULT 'EN_DIAGNOSTICO',
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE facturacion_intervenciones ADD COLUMN IF NOT EXISTS facturas_pendientes INTEGER;
ALTER TABLE facturacion_intervenciones ADD COLUMN IF NOT EXISTS boletas_pendientes INTEGER;

CREATE INDEX IF NOT EXISTS idx_facturacion_intervenciones_asesor ON facturacion_intervenciones (asesor);
CREATE INDEX IF NOT EXISTS idx_facturacion_intervenciones_status ON facturacion_intervenciones (status);
CREATE INDEX IF NOT EXISTS idx_facturacion_intervenciones_started_at ON facturacion_intervenciones (started_at);

CREATE TABLE IF NOT EXISTS facturacion_intervencion_pausas (
  id              TEXT PRIMARY KEY,
  intervencion_id TEXT NOT NULL REFERENCES facturacion_intervenciones(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  motivo          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facturacion_pausas_intervencion ON facturacion_intervencion_pausas (intervencion_id);

CREATE TABLE IF NOT EXISTS facturacion_intervencion_actividades (
  id              TEXT PRIMARY KEY,
  intervencion_id TEXT NOT NULL REFERENCES facturacion_intervenciones(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL,
  detalle         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facturacion_actividades_intervencion ON facturacion_intervencion_actividades (intervencion_id);

-- ============================================================
-- Configuración del módulo: estados y subcategorías (soft-delete)
-- ============================================================

CREATE TABLE IF NOT EXISTS facturacion_estados (
  id               TEXT PRIMARY KEY,
  nombre           TEXT NOT NULL UNIQUE,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  orden            INT NOT NULL DEFAULT 0,
  es_interno       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facturacion_estados_activo ON facturacion_estados (activo, orden);

CREATE TABLE IF NOT EXISTS facturacion_subcategorias (
  id               TEXT PRIMARY KEY,
  nombre           TEXT NOT NULL UNIQUE,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  orden            INT NOT NULL DEFAULT 0,
  es_interno       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facturacion_subcategorias_activo ON facturacion_subcategorias (activo, orden);

-- Columnas de referencia configurable en intervenciones (no reemplazan status/causa del motor).
ALTER TABLE facturacion_intervenciones ADD COLUMN IF NOT EXISTS estado_id TEXT;
ALTER TABLE facturacion_intervenciones ADD COLUMN IF NOT EXISTS subcategoria_id TEXT;
ALTER TABLE facturacion_intervenciones ADD COLUMN IF NOT EXISTS mensaje_error TEXT;

-- Datos iniciales de estados configurables (mapeados a estados internos del motor).
INSERT INTO facturacion_estados (id, nombre, activo, orden, es_interno) VALUES
  ('estado-pendiente',       'Pendiente',       TRUE, 10, TRUE),
  ('estado-en-diagnostico',  'En diagnóstico',  TRUE, 20, TRUE),
  ('estado-en-solucion',     'En solución',     TRUE, 30, FALSE),
  ('estado-pausado',         'Pausado',         TRUE, 40, TRUE),
  ('estado-resuelto',        'Resuelto',        TRUE, 50, TRUE),
  ('estado-derivado',        'Derivado',        TRUE, 60, FALSE),
  ('estado-error',           'Error',           TRUE, 70, FALSE),
  ('estado-cerrado',         'Cerrado',         TRUE, 80, FALSE)
ON CONFLICT (nombre) DO NOTHING;

-- Datos iniciales de subcategorías (diagnósticos).
INSERT INTO facturacion_subcategorias (id, nombre, activo, orden, es_interno) VALUES
  ('sub-sin-diagnosticar',   'Sin diagnosticar',   TRUE, 10, TRUE),
  ('sub-error-calculo',      'Error de cálculo',   TRUE, 20, FALSE),
  ('sub-error-impuestos',    'Error de impuestos', TRUE, 30, FALSE),
  ('sub-cdt-vencido',        'CDT vencido',        TRUE, 40, FALSE),
  ('sub-error-certificado',  'Error de certificado', TRUE, 50, FALSE),
  ('sub-error-configuracion','Error de configuración', TRUE, 60, FALSE),
  ('sub-error-conexion',     'Error de conexión',  TRUE, 70, FALSE),
  ('sub-error-datos',        'Error de datos',     TRUE, 80, FALSE),
  ('sub-error-proveedor',    'Error de proveedor', TRUE, 90, FALSE),
  ('sub-error-descuento',    'Error de descuento', TRUE, 100, FALSE),
  ('sub-otro',               'Otro',               TRUE, 110, FALSE)
ON CONFLICT (nombre) DO NOTHING;
