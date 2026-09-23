-- Migración: Campo resultado para Agendas
-- Fecha: 2026-09-10
-- Agrega columna resultado TEXT nullable
-- Valores: NULL, REALIZADA, SIN_REALIZAR, CANCELADA

-- ============================================================
-- 1. AGREGAR COLUMNA resultado (nullable, default NULL)
-- ============================================================
ALTER TABLE public.agendas ADD COLUMN resultado TEXT;

-- ============================================================
-- 2. COMENTARIO
-- ============================================================
COMMENT ON COLUMN public.agendas.resultado IS 'Resultado real de la agenda: NULL (pendiente), REALIZADA, SIN_REALIZAR, CANCELADA. Independiente del estado.';

-- ============================================================
-- 3. ÍNDICE (solo si hay consultas frecuentes por resultado)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agendas_resultado ON public.agendas (resultado);
