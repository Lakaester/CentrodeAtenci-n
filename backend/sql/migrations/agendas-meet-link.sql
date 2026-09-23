-- Migración: Agregar columna calendar_meet_link a la tabla agendas

ALTER TABLE agendas ADD COLUMN IF NOT EXISTS calendar_meet_link TEXT;

COMMENT ON COLUMN agendas.calendar_meet_link IS 'URL de Google Meet asociada al evento de Calendar';
