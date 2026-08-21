-- Quejas y Devoluciones — Catálogo oficial de ÁREAS CAUSANTES.
-- Reemplaza los valores anteriores por el catálogo oficial de negocio:
--   Implementaciones, Comercial, Soporte en Linea, Customer Success, Desarrollo
-- Idempotente: se puede ejecutar varias veces sin duplicar.
-- Los casos existentes conservan su valor de texto (no se migran datos).

-- 1) Marcar las áreas antiguas como inactivas (se conservan para trazabilidad).
UPDATE qd_areas SET activo = FALSE WHERE nombre IN ('Soporte', 'Ventas', 'Facturación', 'Tecnología', 'Otra');

-- 2) Insertar (o reactivar) el catálogo oficial.
INSERT INTO qd_areas (id, nombre, activo, orden) VALUES
  ('area-implementaciones',    'Implementaciones',    TRUE, 10),
  ('area-comercial',           'Comercial',           TRUE, 20),
  ('area-soporte-en-linea',    'Soporte en Linea',    TRUE, 30),
  ('area-customer-success',    'Customer Success',    TRUE, 40),
  ('area-desarrollo',          'Desarrollo',          TRUE, 50)
ON CONFLICT (nombre) DO UPDATE SET activo = TRUE, orden = EXCLUDED.orden;