-- Quejas y Devoluciones — fecha de origen obligatoria en expedientes nuevos.
--
-- `fecha_solicitud` es la fecha histórica del ticket (columna Fecha del módulo).
-- `created_at` sigue siendo la fecha de incorporación del expediente y NO se
-- sobrescribe.
--
-- Esta migración NO inventa fechas para expedientes históricos: los que ya
-- existen sin fecha se reparan desde Zendesk (servicio de reparación) o se
-- registran como incidencia de datos.
--
-- Idempotente: DEFAULT, trigger y CHECK se pueden aplicar varias veces.

ALTER TABLE qd_casos
  ALTER COLUMN fecha_solicitud SET DEFAULT to_char(now() AT TIME ZONE 'America/Lima', 'YYYY-MM-DD');

CREATE OR REPLACE FUNCTION qd_casos_fecha_solicitud_default()
RETURNS trigger AS $$
BEGIN
  IF NEW.fecha_solicitud IS NULL OR btrim(NEW.fecha_solicitud) = '' THEN
    NEW.fecha_solicitud := to_char(now() AT TIME ZONE 'America/Lima', 'YYYY-MM-DD');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_qd_casos_fecha_solicitud ON qd_casos;
CREATE TRIGGER trg_qd_casos_fecha_solicitud
BEFORE INSERT ON qd_casos
FOR EACH ROW
EXECUTE FUNCTION qd_casos_fecha_solicitud_default();

-- CHECK NOT VALID: no bloquea filas históricas que aún no se han reparado,
-- pero impide que cualquier fila nueva o actualizada quede sin fecha.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'qd_casos'::regclass
      AND conname = 'qd_casos_fecha_solicitud_no_nula'
  ) THEN
    ALTER TABLE qd_casos
      ADD CONSTRAINT qd_casos_fecha_solicitud_no_nula
      CHECK (fecha_solicitud IS NOT NULL) NOT VALID;
  END IF;
END $$;
