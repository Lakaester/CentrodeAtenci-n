-- Quejas y Devoluciones — Agregar "Temas del cliente" al catálogo de ÁREAS CAUSANTES.
-- Idempotente: se puede ejecutar varias veces sin duplicar.
-- No elimina ni modifica las opciones existentes.
INSERT INTO qd_areas (id, nombre, activo, orden) VALUES
  ('area-temas-del-cliente', 'Temas del cliente', TRUE, 60)
ON CONFLICT (nombre) DO UPDATE SET activo = TRUE, orden = 60;