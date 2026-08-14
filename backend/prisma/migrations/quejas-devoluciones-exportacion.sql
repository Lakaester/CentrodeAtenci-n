-- Quejas y Devoluciones — exportación Excel operativa.
-- Idempotente: se puede ejecutar varias veces sin perder datos.

-- 1. Permiso "exportar" para el rol admin (idempotente).
INSERT INTO cope_permisos (id, modulo, accion, rol_id, permitido)
SELECT 'perm-quejas-y-devoluciones-exportar', 'Quejas y Devoluciones', 'exportar', 'rol-admin', TRUE
WHERE EXISTS (SELECT 1 FROM cope_roles WHERE id = 'rol-admin')
ON CONFLICT (modulo, accion, rol_id)
DO UPDATE SET permitido = TRUE, updated_at = now();

-- 2. Auditoría de exportaciones.
CREATE TABLE IF NOT EXISTS qd_exportaciones (
  id         TEXT PRIMARY KEY,
  usuario    TEXT,
  tipo       TEXT NOT NULL,            -- 'devolucion' | 'queja' | 'todas'
  filtros    JSONB NOT NULL DEFAULT '{}'::jsonb,
  registros  INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qd_exportaciones_fecha ON qd_exportaciones (created_at);
