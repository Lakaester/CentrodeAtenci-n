-- Migración: Tiempo real para Agendas
-- Fecha: 2026-09-10
-- Agrega hora_inicio_real, hora_fin_real, duracion_real_min
-- NO destructivo: solo agrega columnas NULLABLE

-- ============================================================
-- 1. AGREGAR COLUMNAS DE TIEMPO REAL (nullable)
-- ============================================================
ALTER TABLE public.agendas ADD COLUMN hora_inicio_real TIME;
ALTER TABLE public.agendas ADD COLUMN hora_fin_real TIME;
ALTER TABLE public.agendas ADD COLUMN duracion_real_min INT;

-- ============================================================
-- 2. COMENTARIOS
-- ============================================================
COMMENT ON COLUMN public.agendas.hora_inicio_real IS 'Hora real de inicio de la agenda. NULL si no se ha registrado.';
COMMENT ON COLUMN public.agendas.hora_fin_real IS 'Hora real de finalización de la agenda. NULL si aún no finalizó.';
COMMENT ON COLUMN public.agendas.duracion_real_min IS 'Duración real en minutos. Calculada como hora_fin_real - hora_inicio_real. NULL si no hay datos completos.';

-- ============================================================
-- 3. ÍNDICES PARA CONSULTAS POR TIEMPO REAL
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agendas_hora_inicio_real ON public.agendas (hora_inicio_real);
CREATE INDEX IF NOT EXISTS idx_agendas_duracion_real_min ON public.agendas (duracion_real_min);
