# Historical Repository — COPE

> Contrato de interfaces para consultas historicas. No implementar — solo diseno.

---

## 1. Interface Principal

```typescript
// backend/src/domain/historical/HistoricalRepository.ts

export interface HistoricalRepository {
  /** Historial completo de cambios de estado para un ticket */
  getTicketHistory(ticketId: string): Promise<TicketStatusEvent[]>;

  /** Estado de un ticket en una fecha/hora especifica */
  getStatusAtDate(ticketId: string, date: Date): Promise<string | null>;

  /** Cantidad de tickets por estado en una fecha especifica (backlog) */
  getBacklogAtDate(date: Date, filters?: BacklogFilters): Promise<BacklogResult>;

  /** Todas las transiciones de estado en un rango de fechas */
  getTransitions(filters: TransitionFilters): Promise<TicketStatusEvent[]>;

  /** Cantidad de reaperturas por ticket */
  getReopenCount(ticketId: string): Promise<number>;

  /** Timeline completo de un ticket (estados + respuestas + asignaciones) */
  getTimeline(ticketId: string): Promise<TimelineEvent[]>;

  /** Tiempo acumulado en cada estado para un ticket */
  getTimeInStatus(ticketId: string): Promise<TimeInStatus[]>;
}
```

---

## 2. Tipos de Datos

### 2.1 `TicketStatusEvent`

```typescript
export interface TicketStatusEvent {
  id: string;
  ticketId: string;
  canal: "zendesk" | "meta" | "whaticket";
  subcanal: string | null;
  estado: string;                    // Estado destino
  estadoAnterior: string | null;     // Estado origen
  fechaEvento: Date;
  usuario: string | null;
  origen: "asesor" | "cliente" | "sistema" | "automatico";
  payload: Record<string, unknown> | null;
}
```

### 2.2 `BacklogFilters` y `BacklogResult`

```typescript
export interface BacklogFilters {
  canal?: string[];
  subcanal?: string[];
  asesor?: string[];
  pais?: string[];
  categoria?: string[];
}

export interface BacklogResult {
  fecha: string;                     // "2026-07-31"
  total: number;
  porEstado: Record<string, number>;  // { "abierto": 45, "pendiente": 12, "resuelto": 8 }
  porCanal: Record<string, number>;   // { "whatsapp": 30, "correo": 35 }
}
```

### 2.3 `TransitionFilters`

```typescript
export interface TransitionFilters {
  fechaInicio?: Date;
  fechaFin?: Date;
  ticketId?: string;
  canal?: string[];
  estadoOrigen?: string;
  estadoDestino?: string;
  usuario?: string;
  limite?: number;         // default: 100
  offset?: number;         // default: 0
}
```

### 2.4 `TimelineEvent`

```typescript
export interface TimelineEvent {
  tipo: "estado" | "respuesta" | "asignacion" | "categoria" | "reapertura";
  fecha: Date;
  descripcion: string;
  detalle: Record<string, unknown>;
}
```

### 2.5 `TimeInStatus`

```typescript
export interface TimeInStatus {
  estado: string;
  duracionTotalMin: number;
  cantidadTransiciones: number;
  duracionPromedioMin: number;
  duracionMaximaMin: number;
  duracionMinimaMin: number;
}
```

---

## 3. Implementaciones Previstas

### 3.1 `PgHistoricalRepository` (PostgreSQL)

Implementacion contra las tablas `ticket_status_history` y `ticket_status_snapshot`. Usa `prisma.$queryRaw` (mismo patron que `unificado.repository.ts`).

### 3.2 `InMemoryHistoricalRepository` (Desarrollo/Testing)

Implementacion en memoria para desarrollo local y pruebas unitarias.

### 3.3 Provider Pattern

```typescript
// backend/src/domain/historical/providers/HistoricalProvider.ts
export interface HistoricalProvider {
  getRepository(): HistoricalRepository;
}

// backend/src/domain/historical/providers/PgHistoricalProvider.ts
export class PgHistoricalProvider implements HistoricalProvider {
  getRepository(): HistoricalRepository {
    return new PgHistoricalRepository();
  }
}

// backend/src/domain/historical/providers/MockHistoricalProvider.ts
export class MockHistoricalProvider implements HistoricalProvider {
  getRepository(): HistoricalRepository {
    return new InMemoryHistoricalRepository();
  }
}
```

---

## 4. Queries de Referencia (PostgreSQL)

### 4.1 Historial completo de un ticket

```sql
SELECT id, ticket_id, canal, subcanal, estado, estado_anterior,
       fecha_evento, usuario, origen, payload
FROM ticket_status_history
WHERE ticket_id = $1
ORDER BY fecha_evento ASC;
```

### 4.2 Estado en fecha especifica

```sql
SELECT estado
FROM ticket_status_snapshot
WHERE ticket_id = $1 AND fecha <= $2
ORDER BY fecha DESC
LIMIT 1;
```

### 4.3 Backlog en fecha especifica

```sql
SELECT estado, COUNT(*) AS total
FROM ticket_status_snapshot
WHERE fecha = $1 AND estado != 'cerrado'
GROUP BY estado
ORDER BY total DESC;
```

### 4.4 Cantidad de reaperturas

```sql
SELECT COUNT(*) AS reaperturas
FROM ticket_status_history
WHERE ticket_id = $1
  AND estado_anterior IN ('cerrado', 'resuelto')
  AND estado IN ('abierto', 'pendiente');
```

### 4.5 Tiempo en cada estado

```sql
SELECT
    estado,
    SUM(duracion_min) AS duracion_total_min,
    COUNT(*) AS cantidad_transiciones,
    AVG(duracion_min) AS duracion_promedio_min,
    MAX(duracion_min) AS duracion_maxima_min,
    MIN(duracion_min) AS duracion_minima_min
FROM (
    SELECT
        estado,
        EXTRACT(EPOCH FROM (
            LEAD(fecha_evento) OVER (PARTITION BY ticket_id ORDER BY fecha_evento)
            - fecha_evento
        )) / 60 AS duracion_min
    FROM ticket_status_history
    WHERE ticket_id = $1
) sub
WHERE duracion_min IS NOT NULL
GROUP BY estado
ORDER BY duracion_total_min DESC;
```

### 4.6 Transiciones en rango de fechas

```sql
SELECT *
FROM ticket_status_history
WHERE fecha_evento BETWEEN $1 AND $2
  AND ($3::text[] IS NULL OR canal = ANY($3))
  AND ($4::text IS NULL OR estado_anterior = $4)
  AND ($5::text IS NULL OR estado = $5)
ORDER BY fecha_evento DESC
LIMIT $6 OFFSET $7;
```

---

## 5. No implementar

Este documento define exclusivamente el contrato de interfaces. La implementacion de `PgHistoricalRepository` requiere que las tablas `ticket_status_history` y `ticket_status_snapshot` esten creadas en la base de datos (ver `historical-model.md`).
