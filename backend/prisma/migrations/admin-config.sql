-- Centro Administrativo de Configuración — tablas mínimas de usuarios/roles/permisos/equipos.
-- Sin passwords ni autenticación completa (futuro). Idempotente.

CREATE TABLE IF NOT EXISTS cope_roles (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  orden       INT NOT NULL DEFAULT 0,
  es_interno  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cope_equipos (
  id          TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  orden       INT NOT NULL DEFAULT 0,
  es_interno  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cope_usuarios (
  id           TEXT PRIMARY KEY,
  nombre       TEXT NOT NULL,
  apellido     TEXT,
  email        TEXT NOT NULL UNIQUE,
  rol          TEXT,
  equipo_id    TEXT REFERENCES cope_equipos(id),
  estado       TEXT NOT NULL DEFAULT 'activo',
  iniciales    TEXT,
  ultimo_acceso TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cope_permisos (
  id          TEXT PRIMARY KEY,
  modulo      TEXT NOT NULL,
  accion      TEXT NOT NULL,
  rol_id      TEXT NOT NULL REFERENCES cope_roles(id) ON DELETE CASCADE,
  permitido   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (modulo, accion, rol_id)
);

-- Datos iniciales de roles (solo estructura, editables posteriormente)
INSERT INTO cope_roles (id, nombre, descripcion, activo, orden, es_interno) VALUES
  ('rol-admin',       'Administrador', 'Acceso total a COPE', TRUE, 10, TRUE),
  ('rol-supervisor',  'Supervisor', 'Supervisión de equipos', TRUE, 20, TRUE),
  ('rol-asesor',      'Asesor', 'Atención y operación', TRUE, 30, TRUE),
  ('rol-consulta',    'Consulta', 'Solo lectura', TRUE, 40, FALSE)
ON CONFLICT (nombre) DO NOTHING;

-- Datos iniciales de equipos (solo estructura)
INSERT INTO cope_equipos (id, nombre, descripcion, activo, orden, es_interno) VALUES
  ('equipo-soporte-especializado', 'Soporte Especializado', 'Atención especializada', TRUE, 10, TRUE),
  ('equipo-soporte-linea',         'Soporte en Línea', 'Soporte general', TRUE, 20, FALSE),
  ('equipo-supervisores',          'Supervisores', 'Supervisión', TRUE, 30, FALSE),
  ('equipo-administracion',        'Administración', 'Administración', TRUE, 40, FALSE)
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- Autenticación y sesiones
-- ============================================================

ALTER TABLE cope_usuarios ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE cope_usuarios ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS cope_sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES cope_usuarios(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cope_sessions_token ON cope_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_cope_sessions_user ON cope_sessions (user_id);
