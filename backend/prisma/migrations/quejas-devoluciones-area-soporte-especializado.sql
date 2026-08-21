-- Quejas y Devoluciones — Agregar "Soporte Especializado" al catálogo de ÁREAS CAUSANTES.
-- Idempotente: se puede ejecutar varias veces sin duplicar.
-- No elimina ni modifica las opciones existentes.
INSERT INTO qd_areas (id, nombre, activo, orden) VALUES
  ('area-soporte-especializado', 'Soporte Especializado', TRUE, 70)
ON CONFLICT (nombre) DO UPDATE SET activo = TRUE, orden = 70;