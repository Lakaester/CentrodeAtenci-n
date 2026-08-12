# Historical Model — COPE

> Modelo de datos para almacenar el historial completo de cambios de estado de tickets.

---

## 1. Entidad Principal: `ticket_status_history`

```sql
CREATE TABLE ticket_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       TEXT NOT NULL,                    -- ID externo del ticket (Zendesk/Meta/Whaticket)
    canal           TEXT NOT NULL,                    -- "zendesk" | "meta" | "whaticket"
    subcanal        TEXT,                             -- "whaticket" | "whatmeta" | null
    estado          TEXT NOT NULL,                    -- Estado DESTINO (abierto, cerrado, pendiente, etc.)
    estado_anterior TEXT,                             -- Estado ORIGEN (null si es primera transicion)
    fecha_evento    TIMESTAMPTZ NOT NULL,             -- Momento exacto del cambio
    usuario         TEXT,                             -- Usuario/asesor que realizo el cambio
    origen          TEXT NOT NULL DEFAULT 'sistema',  -- "sistema" | "asesor" | "cliente" | "automatico"
    payload         JSONB,                            -- Datos adicionales (SLA, categoria, canal original, etc.)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Restricciones
    CONSTRAINT chk_canal CHECK (canal IN ('zendesk', 'meta', 'whaticket'))
);

-- Indices para consultas frecuentes
CREATE INDEX idx_tsh_ticket_id ON ticket_status_history(ticket_id);
CREATE INDEX idx_tsh_fecha ON ticket_status_history(fecha_evento);
CREATE INDEX idx_tsh_estado ON ticket_status_history(estado);
CREATE INDEX idx_tsh_canal ON ticket_status_history(canal);
CREATE INDEX idx_tsh_ticket_fecha ON ticket_status_history(ticket_id, fecha_evento DESC);

-- Indice para consultas de backlog en fecha especifica
CREATE INDEX idx_tsh_backlog ON ticket_status_history(fecha_evento, estado)
    WHERE estado != 'cerrado';
```

---

## 2. Entidad Secundaria: `ticket_status_snapshot` (opcional, para alto rendimiento)

```sql
CREATE TABLE ticket_status_snapshot (
    fecha           DATE NOT NULL,                    -- Dia del snapshot
    ticket_id       TEXT NOT NULL,
    canal           TEXT NOT NULL,
    subcanal        TEXT,
    estado          TEXT NOT NULL,                    -- Estado al cierre de ese dia
    ultima_transicion TIMESTAMPTZ NOT NULL,          -- Fecha del ultimo cambio antes del snapshot
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (fecha, ticket_id)
);

CREATE INDEX idx_tss_fecha ON ticket_status_snapshot(fecha);
CREATE INDEX idx_tss_fecha_estado ON ticket_status_snapshot(fecha, estado);
```

---

## 3. Relaciones

```
v_unificado_norm (VIEW existente — solo lectura)
    │
    │  ticket_id ← FK conceptual (no FK real, es ID externo)
    │
    ▼
ticket_status_history
    │
    │  (job diario agrega el ultimo estado de cada dia)
    │
    ▼
ticket_status_snapshot
    │
    │  (consultado por dashboards historicos)
    │
    ▼
reportes BI, KPIs historicos, auditoria
```

---

## 4. Estrategia de poblacion

### 4.1 Carga inicial (backfill de datos existentes)

No es posible reconstruir el historial pasado porque `v_unificado_norm` solo tiene el estado actual. La tabla `ticket_status_history` comenzara vacia y se poblara incrementalmente desde el momento de su activacion.

### 4.2 Poblacion incremental (en tiempo real)

Cada vez que COPE ejecuta una accion que cambia el estado de un ticket, se inserta una fila en `ticket_status_history`:

```
ZendeskClient.cambiarEstado()    ──► INSERT INTO ticket_status_history
MetaService.closeTicket()        ──► INSERT INTO ticket_status_history
WhaticketAdapter (futuro)        ──► INSERT INTO ticket_status_history
apiMiddleware (reply-resolve)    ──► INSERT INTO ticket_status_history
```

### 4.3 Snapshot diario (job programado)

```sql
-- Ejecutar diariamente a las 00:05 UTC
INSERT INTO ticket_status_snapshot (fecha, ticket_id, canal, subcanal, estado, ultima_transicion)
SELECT
    CURRENT_DATE - 1 AS fecha,
    ticket_id,
    canal,
    subcanal,
    estado,
    MAX(fecha_evento) AS ultima_transicion
FROM ticket_status_history
WHERE fecha_evento < CURRENT_DATE
GROUP BY ticket_id, canal, subcanal, estado
ON CONFLICT (fecha, ticket_id) DO NOTHING;
```

---

## 5. Capacidad de respuesta

| Pregunta | Consulta |
|----------|----------|
| Historial completo de un ticket | `SELECT * FROM ticket_status_history WHERE ticket_id = ? ORDER BY fecha_evento` |
| Estado en fecha especifica | `SELECT estado FROM ticket_status_snapshot WHERE ticket_id = ? AND fecha <= ? ORDER BY fecha DESC LIMIT 1` |
| Backlog al cierre de julio | `SELECT COUNT(*) FROM ticket_status_snapshot WHERE fecha = '2026-07-31' AND estado != 'cerrado'` |
| Transiciones totales | `SELECT COUNT(*) FROM ticket_status_history WHERE ticket_id = ?` |
| Reaperturas | `SELECT COUNT(*) FROM ticket_status_history WHERE ticket_id = ? AND estado_anterior = 'cerrado' AND estado = 'abierto'` |
| Timeline completo | `SELECT fecha_evento, estado_anterior, estado, usuario, origen FROM ticket_status_history WHERE ticket_id = ? ORDER BY fecha_evento` |
| Tiempo en estado | `SELECT estado, fecha_evento, LEAD(fecha_evento) OVER (ORDER BY fecha_evento) - fecha_evento AS duracion FROM ticket_status_history WHERE ticket_id = ?` |

---

## 6. Volumen estimado

| Metrica | Estimacion |
|---------|-----------|
| Tickets activos/dia | ~500 |
| Transiciones por ticket (promedio) | ~4 (creado → abierto → resuelto → cerrado) |
| Filas/dia en `ticket_status_history` | ~2,000 |
| Filas/mes | ~60,000 |
| Filas/ano | ~730,000 |
| Snapshot diario (filas/dia) | ~500 |
| Snapshot mensual | ~15,000 |

**Almacenamiento estimado:** ~5-10 MB/ano para `ticket_status_history`. Despreciable para PostgreSQL.
