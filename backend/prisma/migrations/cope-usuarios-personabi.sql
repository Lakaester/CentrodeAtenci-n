-- COPE — Agregar personabi_id al usuario (identificador en Microservicios).
-- Se llena manualmente por el administrador; la API central valida que exista.
ALTER TABLE cope_usuarios ADD COLUMN IF NOT EXISTS personabi_id TEXT;