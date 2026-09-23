-- Migración: Acta de Atención para Agendas
-- Fecha: 2026-09-18
-- Agrega acta_contenido (JSONB) y acta_estado a la tabla agendas

BEGIN;

-- ============================================================
-- COLUMNAS DE ACTA EN TABLA AGENDAS
-- ============================================================
ALTER TABLE agendas ADD COLUMN IF NOT EXISTS acta_contenido JSONB;
ALTER TABLE agendas ADD COLUMN IF NOT EXISTS acta_estado TEXT;

COMMENT ON COLUMN agendas.acta_contenido IS 'Contenido estructurado del Acta de Atención (JSONB)';
COMMENT ON COLUMN agendas.acta_estado IS 'Estado del acta: BORRADOR, FINALIZADA';

-- ============================================================
-- ÍNDICE PARA CONSULTAS POR ESTADO DE ACTA
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agendas_acta_estado ON agendas (acta_estado);

COMMIT;
