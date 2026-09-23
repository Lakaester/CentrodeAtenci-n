-- Migración: Tabla de tokens OAuth para Google Calendar
-- Solo una fila (id=1) almacena los tokens de la cuenta central.

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id            SMALLINT PRIMARY KEY DEFAULT 1,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date   BIGINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT google_oauth_tokens_single_row CHECK (id = 1)
);

COMMENT ON TABLE google_oauth_tokens IS 'Tokens OAuth 2.0 de la cuenta central de Google Calendar (COPE)';
COMMENT ON COLUMN google_oauth_tokens.access_token IS 'Token de acceso OAuth (se renueva con refresh_token)';
COMMENT ON COLUMN google_oauth_tokens.refresh_token IS 'Token de refresco OAuth (persiste)';
COMMENT ON COLUMN google_oauth_tokens.expiry_date IS 'Timestamp (ms) en que expira el access_token';

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON google_oauth_tokens TO pgvector_user;
