-- Quejas y Devoluciones — módulo operacional persistente.
-- Idempotente: se puede ejecutar varias veces sin perder datos.

CREATE TABLE IF NOT EXISTS qd_estados (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  orden      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qd_resultados (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  orden      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qd_areas (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  orden      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qd_productos (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  orden      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qd_tipos_queja (
  id         TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  orden      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qd_casos (
  id              TEXT PRIMARY KEY,
  tipo            TEXT NOT NULL,              -- 'devolucion' | 'queja'
  numero          TEXT NOT NULL,              -- DEV-XXXXX | QUE-XXXXX
  ticket_id       TEXT,
  dominio         TEXT,
  pais            TEXT,
  asesor          TEXT,
  estado          TEXT,
  resultado       TEXT,
  -- devolución
  monto_pagado    NUMERIC(12,2),
  tipo_monto      TEXT,                       -- ARR | MRR
  area            TEXT,                       -- área causante (devolución) / área servicio (queja)
  motivo          TEXT,
  porcentaje      NUMERIC(5,2),               -- 0-100
  monto_devuelto  NUMERIC(12,2),
  -- queja
  clasificacion   TEXT,                       -- Servicio | Producto | Otro
  producto        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticket_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_qd_casos_tipo ON qd_casos (tipo);
CREATE INDEX IF NOT EXISTS idx_qd_casos_ticket ON qd_casos (ticket_id);
CREATE INDEX IF NOT EXISTS idx_qd_casos_estado ON qd_casos (estado);

CREATE TABLE IF NOT EXISTS qd_auditoria (
  id             TEXT PRIMARY KEY,
  caso_id        TEXT NOT NULL REFERENCES qd_casos(id) ON DELETE CASCADE,
  usuario        TEXT,
  accion         TEXT NOT NULL,               -- creacion | edicion | cambio_estado | cambio_resultado | ...
  campo          TEXT,
  valor_anterior TEXT,
  valor_nuevo    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qd_auditoria_caso ON qd_auditoria (caso_id);

-- Catálogos iniciales (editables posteriormente desde Configuración).
INSERT INTO qd_estados (id, nombre, activo, orden) VALUES
  ('est-pendiente-conciliacion', 'Pendiente de conciliación', TRUE, 10),
  ('est-en-negociacion',         'En negociación',            TRUE, 20),
  ('est-pendiente-aprobacion',   'Pendiente de aprobación',   TRUE, 30),
  ('est-resuelto',               'Resuelto',                  TRUE, 40)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO qd_resultados (id, nombre, activo, orden) VALUES
  ('res-pendiente',        'Pendiente',          TRUE, 10),
  ('res-no-procede',       'No procede',         TRUE, 20),
  ('res-procede-100',      'Procede 100%',       TRUE, 30),
  ('res-procede-parcial',  'Procede parcialmente', TRUE, 40)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO qd_areas (id, nombre, activo, orden) VALUES
  ('area-soporte',         'Soporte',             TRUE, 10),
  ('area-ventas',          'Ventas',              TRUE, 20),
  ('area-facturacion',     'Facturación',         TRUE, 30),
  ('area-tecnologia',      'Tecnología',          TRUE, 40),
  ('area-otra',            'Otra',                TRUE, 50)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO qd_productos (id, nombre, activo, orden) VALUES
  ('prod-restaurant',      'Restaurant.pe',             TRUE, 10),
  ('prod-quipupos',        'Quipupos',                  TRUE, 20),
  ('prod-quipunet',        'Quipunet',                  TRUE, 30),
  ('prod-blue',            'Restaurant Blue',           TRUE, 40),
  ('prod-delivery',        'Delivery',                  TRUE, 50),
  ('prod-fe',              'Facturación Electrónica',   TRUE, 60),
  ('prod-integraciones',   'Integraciones',             TRUE, 70),
  ('prod-logistica',       'Logística',                 TRUE, 80),
  ('prod-otro',            'Otro',                      TRUE, 90)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO qd_tipos_queja (id, nombre, activo, orden) VALUES
  ('tq-servicio', 'Servicio', TRUE, 10),
  ('tq-producto', 'Producto', TRUE, 20),
  ('tq-otro',     'Otro',     TRUE, 30)
ON CONFLICT (nombre) DO NOTHING;
