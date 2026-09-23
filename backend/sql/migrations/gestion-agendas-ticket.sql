-- Migración: Ticket visible para Agendas (AGD-000001)
-- Fecha: 2026-09-10
-- Agrega columna ticket VARCHAR(20) con sequence PostgreSQL

BEGIN;

-- ============================================================
-- 1. SEQUENCE PARA TICKETS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS agendas_ticket_seq;

-- ============================================================
-- 2. AGREGAR COLUMNA ticket (nullable temporalmente)
-- ============================================================
ALTER TABLE public.agendas ADD COLUMN ticket VARCHAR(20);

-- ============================================================
-- 3. BACKFILL REGISTROS EXISTENTES (ordenados por created_at)
-- ============================================================
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.agendas
)
UPDATE public.agendas a
SET ticket = 'AGD-' || LPAD(n.rn::text, 6, '0')
FROM numbered n
WHERE a.id = n.id;

-- ============================================================
-- 4. SINCRONIZAR SEQUENCE para que continúe después del backfill
-- ============================================================
SELECT setval('agendas_ticket_seq', (SELECT COUNT(*) FROM public.agendas));

-- ============================================================
-- 5. RESTRICCIONES: NOT NULL + UNIQUE
-- ============================================================
ALTER TABLE public.agendas ALTER COLUMN ticket SET NOT NULL;
ALTER TABLE public.agendas ADD CONSTRAINT agendas_ticket_unique UNIQUE (ticket);

-- ============================================================
-- 6. DEFAULT PARA NUEVOS REGISTROS
-- ============================================================
ALTER TABLE public.agendas ALTER COLUMN ticket SET DEFAULT 'AGD-' || LPAD(nextval('agendas_ticket_seq')::text, 6, '0');

-- ============================================================
-- 7. ÍNDICE PARA BÚSQUEDA POR TICKET
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agendas_ticket ON public.agendas (ticket);

-- ============================================================
-- 8. COMMENT
-- ============================================================
COMMENT ON COLUMN public.agendas.ticket IS 'Identificador visible del caso (AGD-000001). Generado automáticamente por sequence.';

COMMIT;
