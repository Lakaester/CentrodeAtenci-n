-- Quejas y Devoluciones — Moneda del caso (PEN / USD).
-- Idempotente: se puede ejecutar varias veces sin perder datos.
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'PEN';