-- Quejas y Devoluciones — eliminación controlada de casos manuales.
-- Idempotente: se puede ejecutar varias veces sin perder datos.

-- 1. Origen del caso: MANUAL | CATEGORIZACION.
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'MANUAL';

-- 2. Soft delete (los casos permanecen en BD para auditoría).
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS eliminado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS eliminado_at TIMESTAMPTZ;
ALTER TABLE qd_casos ADD COLUMN IF NOT EXISTS eliminado_por TEXT;

CREATE INDEX IF NOT EXISTS idx_qd_casos_activos ON qd_casos (eliminado, tipo, created_at DESC);

-- 3. Permiso "eliminar" (idempotente). Visible: "Eliminar casos manuales de Q/D".
INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
SELECT 'perm-quejas-y-devoluciones-eliminar', 'Quejas y Devoluciones', 'eliminar', 'rol-admin', TRUE
WHERE EXISTS (SELECT 1 FROM cope_roles WHERE id = 'rol-admin')
ON CONFLICT (modulo, accion, rol_id)
DO UPDATE SET permitido = TRUE, updated_at = now();
