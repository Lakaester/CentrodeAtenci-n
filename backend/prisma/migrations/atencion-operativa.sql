-- COPE — REGISTRO OPERATIVO DE ATENCIONES (snapshot por atención).
-- Idempotente: se puede ejecutar varias veces sin perder datos.
--
-- Propósito arquitectónico:
--   Zendesk = fuente externa (sincronizada).
--   COPE    = registro operativo de cada atención (identificación, clasificación,
--             calificación, asesor, estado, auditoría).
--
-- La atención tiene su propia identidad conceptual (id COPE). zendesk_ticket_id
-- es SOLO una referencia externa (no la identidad de la atención).
--
-- Regla de precedencia: el snapshot operativo registrado manualmente en COPE
-- NO se sobrescribe al sincronizar Zendesk. origen = 'cope' gana sobre 'zendesk'.

CREATE TABLE IF NOT EXISTS atencion (
  id TEXT PRIMARY KEY,
  -- Referencia externa (Zendesk). NO es la identidad conceptual de la atención.
  zendesk_ticket_id TEXT UNIQUE,
  -- Contacto identificado (snapshot).
  contacto_tipo TEXT,
  contacto_valor TEXT,
  -- Dominio vinculado a ESTA atención (snapshot, no master data).
  dominio_identificado TEXT,
  tipo_identificacion TEXT,          -- AUTO | MANUAL | ZENDESK_EXPLICITO | HISTORIAL | SIN_IDENTIFICAR
  identificado_por TEXT,             -- usuario que vinculó
  identificado_at TIMESTAMPTZ,
  -- Clasificación de ESTA atención (independiente del historial del cliente).
  categoria TEXT,
  subcategoria TEXT,
  categorizado_por TEXT,
  categorizado_at TIMESTAMPTZ,
  -- Calificación de la atención (dato operativo COPE).
  calificacion TEXT,
  calificado_por TEXT,
  calificado_at TIMESTAMPTZ,
  -- Asesor actual / asignación.
  asesor TEXT,
  asignado_at TIMESTAMPTZ,
  -- Estado operativo.
  estado TEXT,                       -- snapshot del estado (zendesk: new/open/pending/solved/closed)
  resuelto_at TIMESTAMPTZ,
  cerrado_at TIMESTAMPTZ,
  -- Origen de cada dato (para preservar la fuente).
  dominio_origen TEXT,               -- cope | zendesk
  categoria_origen TEXT,             -- cope | zendesk
  calificacion_origen TEXT,          -- cope | zendesk
  -- Snapshot de los datos originales de Zendesk (JSON, no se sobreescribe).
  zendesk_snapshot JSONB,
  -- Timestamps de control.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atencion_zendesk ON atencion (zendesk_ticket_id);
CREATE INDEX IF NOT EXISTS idx_atencion_contacto ON atencion (contacto_tipo, contacto_valor);
CREATE INDEX IF NOT EXISTS idx_atencion_dominio ON atencion (dominio_identificado);
CREATE INDEX IF NOT EXISTS idx_atencion_created ON atencion (created_at DESC);

-- Auditoría de acciones operativas por atención.
-- QUÉ pasó · QUIÉN lo hizo · CUÁNDO · SOBRE QUÉ atención · ORIGEN.
CREATE TABLE IF NOT EXISTS atencion_auditoria (
  id TEXT PRIMARY KEY,
  atencion_id TEXT NOT NULL REFERENCES atencion(id) ON DELETE CASCADE,
  accion TEXT NOT NULL,              -- identificacion|vinculacion_dominio|categorizacion|modificacion_categoria|calificacion|respuesta|nota_interna|asignacion|cambio_estado|resolucion|cierre
  usuario TEXT,
  detalle TEXT,                      -- descripción legible del cambio
  campo TEXT,                        -- campo modificado (opcional)
  valor_anterior TEXT,
  valor_nuevo TEXT,
  origen TEXT NOT NULL,              -- cope | zendesk
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atencion_auditoria_atencion ON atencion_auditoria (atencion_id, created_at DESC);