-- Migración: Ticket visible para Apoyos (APO-000001)
-- Fecha: 2026-09-09
-- Agrega columna ticket VARCHAR(20) con sequence PostgreSQL

BEGIN;

-- ============================================================
-- 1. SEQUENCE PARA TICKETS
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS apoyos_ticket_seq;

-- ============================================================
-- 2. AGREGAR COLUMNA ticket (nullable temporalmente)
-- ============================================================
ALTER TABLE public.apoyos ADD COLUMN ticket VARCHAR(20);

-- ============================================================
-- 3. BACKFILL REGISTROS EXISTENTES (ordenados por created_at)
-- ============================================================
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM public.apoyos
)
UPDATE public.apoyos a
SET ticket = 'APO-' || LPAD(n.rn::text, 6, '0')
FROM numbered n
WHERE a.id = n.id;

-- ============================================================
-- 4. SINCRONIZAR SEQUENCE para que continúe después del backfill
-- ============================================================
SELECT setval('apoyos_ticket_seq', (SELECT COUNT(*) FROM public.apoyos));

-- ============================================================
-- 5. RESTRICCIONES: NOT NULL + UNIQUE
-- ============================================================
ALTER TABLE public.apoyos ALTER COLUMN ticket SET NOT NULL;
ALTER TABLE public.apoyos ADD CONSTRAINT apoyos_ticket_unique UNIQUE (ticket);

-- ============================================================
-- 6. DEFAULT PARA NUEVOS REGISTROS
-- ============================================================
ALTER TABLE public.apoyos ALTER COLUMN ticket SET DEFAULT 'APO-' || LPAD(nextval('apoyos_ticket_seq')::text, 6, '0');

-- ============================================================
-- 7. ÍNDICE PARA BÚSQUEDA POR TICKET
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_apoyos_ticket ON public.apoyos (ticket);

-- ============================================================
-- 8. COMMENT
-- ============================================================
COMMENT ON COLUMN public.apoyos.ticket IS 'Identificador visible del caso (APO-000001). Generado automáticamente por sequence.';

COMMIT;
