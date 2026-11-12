-- Quejas y Devoluciones — compatibilidad dinámica del estado con qd_estados.
--
-- Problema corregido:
--   La restricción histórica `qd_casos_estado_check` solo permitía los cuatro
--   estados originales (Pendiente de conciliación, En negociación, Pendiente de
--   aprobación, Resuelto). Al consolidar un expediente con estado `CERRADO`,
--   PostgreSQL revalidaba la fila completa en el UPDATE de `consolidado_en` y
--   fallaba con 23514, aunque la consolidación no cambiara el estado.
--
-- Solución:
--   - Se reemplaza la lista estática por una función que valida contra el
--     catálogo `qd_estados`. Cualquier estado del catálogo (incluido CERRADO)
--     es aceptado sin mantener una lista duplicada en el CHECK.
--   - Se permite NULL/espacio para filas históricas que ya existían sin estado.
--   - El CHECK se crea `NOT VALID` para no romper filas históricas; se intenta
--     validar al final y, si hay filas heredadas inválidas, queda NOT VALID.
--   - No se modifica ningún estado existente.
--
-- Requisito: aplicar después de `quejas-devoluciones-estado-cerrado.sql`.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM qd_estados WHERE nombre = 'CERRADO') THEN
    RAISE EXCEPTION 'Falta CERRADO en qd_estados. Aplique primero la migración del catálogo.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION qd_estado_valido(p_estado TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT p_estado IS NULL
      OR btrim(p_estado) = ''
      OR EXISTS (
        SELECT 1 FROM qd_estados e WHERE e.nombre = p_estado
      );
$$;

ALTER TABLE qd_casos DROP CONSTRAINT IF EXISTS qd_casos_estado_check;

ALTER TABLE qd_casos
  ADD CONSTRAINT qd_casos_estado_check
  CHECK (qd_estado_valido(estado))
  NOT VALID;

-- Intento de validación completa sin bloquear la migración por filas históricas
-- heredadas. Si todas las filas actuales son válidas, el CHECK queda VALID;
-- si no, permanece NOT VALID y solo se aplica a filas nuevas/actualizadas.
DO $$
BEGIN
  BEGIN
    ALTER TABLE qd_casos VALIDATE CONSTRAINT qd_casos_estado_check;
    RAISE NOTICE 'qd_casos_estado_check validado correctamente.';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'qd_casos_estado_check queda NOT VALID: existen estados históricos fuera del catálogo.';
  END;
END $$;
