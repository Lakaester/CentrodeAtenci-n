-- Quejas y Devoluciones — integridad y agrupación de casos.
-- Idempotente: se puede ejecutar varias veces sin perder datos.

-- 1. ticket_padre_id en qd_casos: conserva el ticket origen y permite
--    rastrear la cadena de follow_up (via.source.from.ticket_id).
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS ticket_padre_id TEXT;

-- 2. Tabla relacional caso ↔ interacciones.
--    UNIQUE(caso_id, ticket_id) protege contra duplicados y concurrencia.
CREATE TABLE IF NOT EXISTS qd_caso_interacciones (
  id            TEXT PRIMARY KEY,
  caso_id       TEXT NOT NULL REFERENCES qd_casos(id) ON DELETE CASCADE,
  ticket_id     TEXT NOT NULL,
  tipo_relacion TEXT NOT NULL DEFAULT 'relacionada',  -- 'principal' | 'relacionada'
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caso_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_qd_caso_interacciones_ticket ON qd_caso_interacciones (ticket_id);
CREATE INDEX IF NOT EXISTS idx_qd_caso_interacciones_caso  ON qd_caso_interacciones (caso_id);
CREATE INDEX IF NOT EXISTS idx_qd_casos_padre ON qd_casos (ticket_padre_id);
