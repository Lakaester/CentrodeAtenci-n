-- Quejas y Devoluciones — formaliza el estado CERRADO en el catálogo.
-- Idempotente: no duplica el registro si ya existe.
--
-- La columna qd_casos.estado es TEXT y no tiene FK a qd_estados, pero el
-- catálogo alimenta los filtros/edición del módulo. Este INSERT solo agrega
-- la opción que usa la regla SIN DOMINIO para expedientes nuevos.

INSERT INTO qd_estados (id, nombre, activo, orden)
SELECT 'qd-estado-cerrado', 'CERRADO', TRUE,
       COALESCE((SELECT MAX(orden) FROM qd_estados), 0) + 10
WHERE NOT EXISTS (
  SELECT 1 FROM qd_estados WHERE nombre = 'CERRADO'
);

-- Verificación esperada: exactamente una fila CERRADO.
-- SELECT nombre, activo, orden FROM qd_estados WHERE nombre = 'CERRADO';
