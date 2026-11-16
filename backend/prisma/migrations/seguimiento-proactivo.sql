-- Seguimiento Proactivo — submódulo operativo de Clientes.
-- Convierte las señales del reporte "Clientes que requieren seguimiento"
-- en casos persistentes con dueño, estado y bitácora.
--
-- Idempotente: se puede ejecutar varias veces sin perder datos.
-- No modifica tablas existentes ni la vista v_unificado_norm.

CREATE TABLE IF NOT EXISTS sp_lotes (
  id                TEXT PRIMARY KEY,
  periodo           TEXT NOT NULL,          -- YYYY-MM (mes de gestión)
  semana_iso        TEXT NOT NULL,          -- IYYY-Www
  desde             DATE NOT NULL,          -- ventana de evaluación (30 días)
  hasta             DATE NOT NULL,
  generado_por      TEXT,
  generado_por_id   TEXT,
  total_candidatos  INT NOT NULL DEFAULT 0,
  total_casos       INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (semana_iso)
);

CREATE INDEX IF NOT EXISTS idx_sp_lotes_periodo
  ON sp_lotes (periodo, semana_iso);

CREATE TABLE IF NOT EXISTS sp_casos (
  id                      TEXT PRIMARY KEY,
  clave_cliente           TEXT NOT NULL,
  cliente                 TEXT NOT NULL,
  estado                  TEXT NOT NULL DEFAULT 'sin_seguimiento'
                          CHECK (estado IN ('sin_seguimiento', 'con_pendientes', 'finalizado')),
  asesor_id               TEXT REFERENCES cope_usuarios(id) ON DELETE SET NULL,
  asesor_nombre           TEXT,

  -- Snapshot de la señal al momento de la detección.
  total                   INT NOT NULL DEFAULT 0,
  total_anterior          INT NOT NULL DEFAULT 0,
  variacion_pct           NUMERIC(10, 2),
  reincidencia_max        INT NOT NULL DEFAULT 0,
  subcategoria_recurrente TEXT,
  tiempo_promedio         NUMERIC(12, 2),
  con_dato                INT NOT NULL DEFAULT 0,
  no_cumple               INT NOT NULL DEFAULT 0,
  pct_incumple            NUMERIC(6, 2),
  motivos                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  senales                 INT NOT NULL DEFAULT 0,

  -- Trazabilidad temporal.
  semana_deteccion        TEXT NOT NULL,
  periodo_deteccion       TEXT NOT NULL,
  primera_deteccion_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultima_deteccion_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_lote_id          TEXT REFERENCES sp_lotes(id) ON DELETE SET NULL,

  -- Gestión.
  contacto_at             TIMESTAMPTZ,
  proximo_contacto_at     TIMESTAMPTZ,
  resumen_contacto        TEXT,
  finalizado_at           TIMESTAMPTZ,
  finalizado_por          TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un solo caso abierto por cliente. Al finalizar, el cliente puede volver
-- a entrar en seguimiento con un caso nuevo.
CREATE UNIQUE INDEX IF NOT EXISTS ux_sp_casos_abierto
  ON sp_casos (clave_cliente)
  WHERE estado <> 'finalizado';

CREATE INDEX IF NOT EXISTS idx_sp_casos_estado
  ON sp_casos (estado, ultima_deteccion_at DESC);

CREATE INDEX IF NOT EXISTS idx_sp_casos_asesor
  ON sp_casos (asesor_id, estado);

CREATE INDEX IF NOT EXISTS idx_sp_casos_periodo
  ON sp_casos (periodo_deteccion);

CREATE INDEX IF NOT EXISTS idx_sp_casos_backlog
  ON sp_casos (semana_deteccion, estado);

CREATE TABLE IF NOT EXISTS sp_caso_semanas (
  caso_id       TEXT NOT NULL REFERENCES sp_casos(id) ON DELETE CASCADE,
  lote_id       TEXT NOT NULL REFERENCES sp_lotes(id) ON DELETE CASCADE,
  clave_cliente TEXT NOT NULL,
  metricas      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (caso_id, lote_id)
);

CREATE INDEX IF NOT EXISTS idx_sp_caso_semanas_lote
  ON sp_caso_semanas (lote_id);

CREATE TABLE IF NOT EXISTS sp_gestiones (
  id                   TEXT PRIMARY KEY,
  caso_id              TEXT NOT NULL REFERENCES sp_casos(id) ON DELETE CASCADE,
  contacto_at          TIMESTAMPTZ NOT NULL,
  proximo_contacto_at  TIMESTAMPTZ,
  resumen              TEXT NOT NULL,
  estado_anterior      TEXT,
  estado_nuevo         TEXT NOT NULL,
  usuario_id           TEXT,
  usuario              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sp_gestiones_caso
  ON sp_gestiones (caso_id, contacto_at DESC);

CREATE TABLE IF NOT EXISTS sp_auditoria (
  id             TEXT PRIMARY KEY,
  caso_id        TEXT NOT NULL REFERENCES sp_casos(id) ON DELETE CASCADE,
  usuario_id     TEXT,
  usuario        TEXT,
  accion         TEXT NOT NULL,               -- creado | actualizado | gestion | asignacion | reapertura
  campo          TEXT,
  valor_anterior TEXT,
  valor_nuevo    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sp_auditoria_caso
  ON sp_auditoria (caso_id, created_at DESC);

-- Verificación de instalación.
SELECT 'sp_lotes' AS tabla, COUNT(*)::int AS filas FROM sp_lotes
UNION ALL SELECT 'sp_casos', COUNT(*)::int FROM sp_casos
UNION ALL SELECT 'sp_caso_semanas', COUNT(*)::int FROM sp_caso_semanas
UNION ALL SELECT 'sp_gestiones', COUNT(*)::int FROM sp_gestiones
UNION ALL SELECT 'sp_auditoria', COUNT(*)::int FROM sp_auditoria;
