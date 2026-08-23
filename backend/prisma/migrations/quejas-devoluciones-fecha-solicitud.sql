-- Agrega columna fecha_solicitud (TEXT, formato YYYY-MM-DD) a qd_casos.
-- Se almacena como TEXT para evitar problemas de timezone.
-- Para casos existentes sin fecha de solicitud se usa created_at como fallback.
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS fecha_solicitud TEXT;

-- Retroactividad: casos ya creados sin fecha_solicitud → usar solo date de created_at
UPDATE qd_casos
SET fecha_solicitud = to_char(created_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD')
WHERE fecha_solicitud IS NULL;
