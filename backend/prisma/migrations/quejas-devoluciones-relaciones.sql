-- Quejas y Devoluciones — relaciones reales entre tickets (follow_up de Zendesk).
-- Almacena el identificador relacional real (via.source.from.ticket_id y
-- followup_ids) obtenido de la API de Zendesk. Se usa como fuente de evidencia
-- para reconstruir casos con el modelo CASO → N TICKETS.
-- Idempotente: se puede ejecutar varias veces sin perder datos.
CREATE TABLE IF NOT EXISTS qd_relaciones_ticket (
  ticket_id       TEXT PRIMARY KEY,
  ticket_padre_id TEXT,
  followup_ids    JSONB,
  origen          TEXT NOT NULL DEFAULT 'zendesk',  -- 'zendesk' | 'no_disponible'
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qd_relaciones_ticket_padre ON qd_relaciones_ticket (ticket_padre_id);