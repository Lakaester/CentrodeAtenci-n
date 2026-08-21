-- COPE — Relación persistente CONTACTO ↔ DOMINIOS (múltiples dominios por contacto).
-- Idempotente: se puede ejecutar varias veces sin perder datos.
-- Identidad del contacto: tipo (email | whatsapp) + valor_normalizado.
-- Permite un contacto con varios dominios; NO es 1:1.

CREATE TABLE IF NOT EXISTS contacto_identidad (
  id                 TEXT PRIMARY KEY,
  tipo               TEXT NOT NULL,                -- 'email' | 'whatsapp'
  valor_normalizado  TEXT NOT NULL,                -- email lowercase / número normalizado
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tipo, valor_normalizado)
);

CREATE TABLE IF NOT EXISTS contacto_dominio (
  id                    TEXT PRIMARY KEY,
  contacto_identidad_id TEXT NOT NULL REFERENCES contacto_identidad(id) ON DELETE CASCADE,
  dominio               TEXT NOT NULL,
  usuario_vinculacion   TEXT,
  activo                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contacto_identidad_id, dominio)
);

CREATE INDEX IF NOT EXISTS idx_contacto_identidad_tipo_valor ON contacto_identidad (tipo, valor_normalizado);
CREATE INDEX IF NOT EXISTS idx_contacto_dominio_identidad ON contacto_dominio (contacto_identidad_id, activo);
