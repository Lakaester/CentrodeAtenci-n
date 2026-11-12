-- Quejas y Devoluciones — backfill Zendesk con checkpoints e incidencias.
-- Idempotente. No modifica casos existentes salvo la reparación explícita de
-- fechas faltantes.

CREATE TABLE IF NOT EXISTS qd_backfill_zendesk_runs (
  id                TEXT PRIMARY KEY,
  desde             DATE NOT NULL,
  hasta             DATE NOT NULL,
  estado            TEXT NOT NULL DEFAULT 'EN_PROGRESO'
                    CHECK (estado IN ('EN_PROGRESO', 'COMPLETADO', 'FALLIDO', 'DETENIDO')),
  dry_run           BOOLEAN NOT NULL DEFAULT TRUE,
  cursor_ventana    DATE NULL,
  cursor_pagina     INT NULL,
  iniciado_por      TEXT NULL,
  iniciado_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_at     TIMESTAMPTZ NULL,
  error_detalle     TEXT NULL
);

-- Solo puede existir una ejecución activa a la vez. Evita dos backfills
-- concurrentes creando expedientes en paralelo.
CREATE UNIQUE INDEX IF NOT EXISTS uq_qd_backfill_zendesk_run_activo
  ON qd_backfill_zendesk_runs (estado)
  WHERE estado = 'EN_PROGRESO';

CREATE TABLE IF NOT EXISTS qd_backfill_zendesk_checkpoints (
  id                       TEXT PRIMARY KEY,
  run_id                   TEXT NOT NULL REFERENCES qd_backfill_zendesk_runs(id) ON DELETE CASCADE,
  ventana_desde            DATE NOT NULL,
  ventana_hasta_exclusiva  DATE NOT NULL,
  pagina                   INT NOT NULL,
  estado                   TEXT NOT NULL DEFAULT 'EN_PROGRESO'
                           CHECK (estado IN ('EN_PROGRESO', 'COMPLETADO', 'FALLIDO')),
  ultimo_ticket_id         TEXT NULL,
  procesados               INT NOT NULL DEFAULT 0,
  error_detalle            TEXT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, ventana_desde, ventana_hasta_exclusiva, pagina)
);

CREATE INDEX IF NOT EXISTS idx_qd_backfill_zendesk_cp_run
  ON qd_backfill_zendesk_checkpoints (run_id, ventana_desde, pagina);

CREATE TABLE IF NOT EXISTS qd_backfill_zendesk_items (
  id                  TEXT PRIMARY KEY,
  run_id              TEXT NOT NULL REFERENCES qd_backfill_zendesk_runs(id) ON DELETE CASCADE,
  ticket_id           TEXT NOT NULL,
  ticket_created_at   TIMESTAMPTZ NULL,
  categoria_raw       TEXT NULL,
  subcategoria_raw    TEXT NULL,
  tipo                TEXT NULL,
  estado              TEXT NOT NULL,
  motivo              TEXT NULL,
  caso_id             TEXT NULL,
  numero              TEXT NULL,
  fecha_solicitud     TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_qd_backfill_zendesk_items_run
  ON qd_backfill_zendesk_items (run_id, estado);

CREATE TABLE IF NOT EXISTS qd_incidencias_datos (
  id          TEXT PRIMARY KEY,
  caso_id     TEXT NOT NULL REFERENCES qd_casos(id) ON DELETE CASCADE,
  ticket_id   TEXT NULL,
  tipo        TEXT NOT NULL,
  detalle     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caso_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_qd_incidencias_datos_caso
  ON qd_incidencias_datos (caso_id);
