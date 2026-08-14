-- Agregar columna observacion a qd_casos (aditiva).
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS observacion TEXT;
