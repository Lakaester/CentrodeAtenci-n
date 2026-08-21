-- Quejas y Devoluciones — modelo CASO → N TICKETS (corrección conceptual).
-- Idempotente: se puede ejecutar varias veces sin perder datos.

-- 1) qd_caso_interacciones: guarda canal y fecha por ticket/contacto,
--    además del ticket_id y la relación con el caso.
ALTER TABLE qd_caso_interacciones ADD COLUMN IF NOT EXISTS canal TEXT;
ALTER TABLE qd_caso_interacciones ADD COLUMN IF NOT EXISTS fecha TIMESTAMPTZ;

-- 2) qd_casos: soporte de consolidación (caso secundario → caso principal)
--    y estado explícito de caso abierto/cerrado.
--    consolidado_en: referencia al caso principal (NULL si el caso es principal/independiente).
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS consolidado_en TEXT;

-- 3) Estado del caso: 'ABIERTO' | 'CERRADO' (no confundir con el catálogo de estados
--    de conciliación). La lógica de negocio usa abierto/cerrado para saber si un
--    nuevo ticket puede vincularse o debe crear un caso nuevo.
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS caso_cerrado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS cerrado_at TIMESTAMPTZ;
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS cerrado_por TEXT;

CREATE INDEX IF NOT EXISTS idx_qd_casos_consolidado ON qd_casos (consolidado_en);
CREATE INDEX IF NOT EXISTS idx_qd_caso_interacciones_fecha ON qd_caso_interacciones (fecha);
