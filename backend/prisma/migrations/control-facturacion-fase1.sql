-- Control de Facturación — Fase 1: Motor Operativo e Histórico.
-- Idempotente: se puede ejecutar varias veces sin perder datos.
-- NO toca facturacionbi ni el contrato FacturacionSource.

-- ── 1. Categorías (Historia 5) ──
CREATE TABLE IF NOT EXISTS facturacion_categorias (
  id               TEXT PRIMARY KEY,
  nombre           TEXT NOT NULL UNIQUE,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  orden            INT NOT NULL DEFAULT 0,
  es_interno       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facturacion_categorias_activo ON facturacion_categorias (activo, orden);

INSERT INTO facturacion_categorias (id, nombre, activo, orden, es_interno) VALUES
  ('cat-facturacion-electronica', 'Facturación electrónica', TRUE, 10, TRUE),
  ('cat-otro',                    'Otro',                    TRUE, 20, FALSE)
ON CONFLICT (nombre) DO NOTHING;

-- Subcategorías: vincular a categoría (estructura configurable existente como base).
ALTER TABLE facturacion_subcategorias ADD COLUMN IF NOT EXISTS categoria_id TEXT;

-- ── 2. Casos operativos (Historia 1, 3, 4) ──
CREATE TABLE IF NOT EXISTS facturacion_casos (
  id                  TEXT PRIMARY KEY,
  dominio             TEXT NOT NULL UNIQUE,
  ruc                 TEXT,
  proveedor           TEXT,
  unidad_negocio_id   TEXT,
  cliente_nombre      TEXT,
  estado_operativo    TEXT NOT NULL DEFAULT 'PENDIENTE',
  categoria_id        TEXT,
  subcategoria_id     TEXT,
  facturas_iniciales  INTEGER,
  boletas_iniciales   INTEGER,
  total_inicial       INTEGER,
  ultimas_facturas    INTEGER,
  ultimas_boletas     INTEGER,
  ultimo_total        INTEGER,
  primera_deteccion   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_deteccion    TIMESTAMPTZ NOT NULL DEFAULT now(),
  asesor_actual       TEXT,
  fecha_asignacion    TIMESTAMPTZ,
  asignado_por        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facturacion_casos_estado ON facturacion_casos (estado_operativo);
CREATE INDEX IF NOT EXISTS idx_facturacion_casos_asesor ON facturacion_casos (asesor_actual);
CREATE INDEX IF NOT EXISTS idx_facturacion_casos_ultima_deteccion ON facturacion_casos (ultima_deteccion);

-- ── 3. Snapshots diarios (Historia 2) ──
CREATE TABLE IF NOT EXISTS facturacion_caso_snapshots (
  id              TEXT PRIMARY KEY,
  caso_id         TEXT NOT NULL REFERENCES facturacion_casos(id) ON DELETE CASCADE,
  fecha_snapshot  DATE NOT NULL DEFAULT CURRENT_DATE,
  facturas        INTEGER,
  boletas         INTEGER,
  total           INTEGER,
  origen          TEXT NOT NULL DEFAULT 'MANUAL',   -- MANUAL | INTERVENCION | ADAPTER
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caso_id, fecha_snapshot)
);
CREATE INDEX IF NOT EXISTS idx_facturacion_caso_snapshots_caso ON facturacion_caso_snapshots (caso_id, fecha_snapshot);

-- ── 4. Asignaciones de asesor (Historia 3) ──
CREATE TABLE IF NOT EXISTS facturacion_caso_asignaciones (
  id            TEXT PRIMARY KEY,
  caso_id       TEXT NOT NULL REFERENCES facturacion_casos(id) ON DELETE CASCADE,
  asesor        TEXT NOT NULL,
  asignado_por  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facturacion_caso_asignaciones_caso ON facturacion_caso_asignaciones (caso_id, created_at);

-- ── 5. Relación caso ↔ intervención ──
CREATE TABLE IF NOT EXISTS facturacion_caso_intervenciones (
  id              TEXT PRIMARY KEY,
  caso_id         TEXT NOT NULL REFERENCES facturacion_casos(id) ON DELETE CASCADE,
  intervencion_id TEXT NOT NULL REFERENCES facturacion_intervenciones(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caso_id, intervencion_id)
);
CREATE INDEX IF NOT EXISTS idx_facturacion_caso_intervenciones_caso ON facturacion_caso_intervenciones (caso_id);
CREATE INDEX IF NOT EXISTS idx_facturacion_caso_intervenciones_interv ON facturacion_caso_intervenciones (intervencion_id);

-- ── 6. Auditoría (Historia 6) ──
CREATE TABLE IF NOT EXISTS facturacion_auditoria (
  id             TEXT PRIMARY KEY,
  entidad        TEXT NOT NULL,             -- caso | intervencion | asignacion | snapshot | exportacion
  entidad_id     TEXT,
  accion         TEXT NOT NULL,
  asesor         TEXT,
  detalle        TEXT,
  valor_anterior TEXT,
  valor_nuevo    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_facturacion_auditoria_entidad ON facturacion_auditoria (entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_facturacion_auditoria_fecha ON facturacion_auditoria (created_at);

-- ── 7. Permisos Control de Facturación (rol-admin, idempotente) ──
INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
SELECT 'perm-control-facturacion-' || accion, 'Control de Facturación', accion, 'rol-admin', TRUE
FROM (VALUES ('ver'),('crear'),('editar'),('eliminar'),('exportar'),('administrar')) AS v(accion)
WHERE EXISTS (SELECT 1 FROM cope_roles WHERE id = 'rol-admin')
ON CONFLICT (modulo, accion, rol_id) DO UPDATE SET permitido = TRUE, updated_at = now();
