-- COPE — Columnas de trazabilidad y uso para CONTACTO ↔ DOMINIOS.
-- Idempotente: se puede ejecutar varias veces sin perder datos.
-- Permite registrar el origen de la vinculación, última utilización y contador
-- de uso para la resolución de identidad (dominio más frecuente / más reciente).
ALTER TABLE contacto_dominio ADD COLUMN IF NOT EXISTS origen TEXT;
ALTER TABLE contacto_dominio ADD COLUMN IF NOT EXISTS ultima_utilizacion TIMESTAMPTZ;
ALTER TABLE contacto_dominio ADD COLUMN IF NOT EXISTS contador_uso INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_contacto_dominio_dominio ON contacto_dominio (dominio);
CREATE INDEX IF NOT EXISTS idx_contacto_dominio_uso ON contacto_dominio (ultima_utilizacion DESC);