# Event Engine — COPE

> Definicion de eventos del ciclo de vida de un ticket. Cada cambio de estado genera un evento inmutable.

---

## 1. Catalogo de Eventos

### 1.1 `TicketCreated`

```typescript
interface TicketCreated {
  eventType: "TicketCreated";
  ticketId: string;
  canal: "zendesk" | "meta" | "whaticket";
  subcanal: string;
  fecha: string;           // ISO 8601
  cliente: string;
  asunto: string;
  categoria: string | null;
  pais: string | null;
  dominio: string | null;
}
```

**Trigger:** Al recibir un ticket nuevo desde cualquier canal (Zendesk API, Meta webhook, Whaticket API).

---

### 1.2 `TicketAssigned`

```typescript
interface TicketAssigned {
  eventType: "TicketAssigned";
  ticketId: string;
  asesorId: string;
  asesorNombre: string;
  asesorAnterior: string | null;   // null si es primera asignacion
  fecha: string;
}
```

**Trigger:** Al ejecutar `AssignTicketUseCase` o `ZendeskClient.asignar()`.

---

### 1.3 `FirstResponse`

```typescript
interface FirstResponse {
  eventType: "FirstResponse";
  ticketId: string;
  tiempoRespuestaMin: number;      // Minutos desde creacion hasta primera respuesta
  dentroDeSLA: boolean;
  umbralSLAMin: number;
  fecha: string;
}
```

**Trigger:** Primera respuesta del asesor al cliente (detectada via `primera_respuesta_min_norm`).

---

### 1.4 `StatusChanged`

```typescript
interface StatusChanged {
  eventType: "StatusChanged";
  ticketId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  usuario: string;
  origen: "asesor" | "cliente" | "sistema" | "automatico";
  comentario: string | null;
  fecha: string;
}
```

**Trigger:** Cualquier cambio de estado (`cambiarEstado()`, `closeTicket()`, `resolver()`, `cerrar()`). Es el evento generico del que derivan los demas.

---

### 1.5 `ReplySent`

```typescript
interface ReplySent {
  eventType: "ReplySent";
  ticketId: string;
  emisor: string;
  tipo: "asesor" | "bot" | "sistema";
  esNotaInterna: boolean;
  tieneAdjuntos: boolean;
  fecha: string;
}
```

**Trigger:** Al enviar una respuesta publica o nota interna via `ReplyService` o `ZendeskClient`.

---

### 1.6 `ReplyReceived`

```typescript
interface ReplyReceived {
  eventType: "ReplyReceived";
  ticketId: string;
  emisor: string;            // Nombre del cliente
  fecha: string;
}
```

**Trigger:** Al recibir una respuesta del cliente (detectado por polling o webhook).

---

### 1.7 `CategoryChanged`

```typescript
interface CategoryChanged {
  eventType: "CategoryChanged";
  ticketId: string;
  categoriaAnterior: string | null;
  categoriaNueva: string;
  subcategoriaAnterior: string | null;
  subcategoriaNueva: string;
  fecha: string;
}
```

**Trigger:** Al ejecutar `categorizar()`.

---

### 1.8 `TicketTransferred`

```typescript
interface TicketTransferred {
  eventType: "TicketTransferred";
  ticketId: string;
  asesorOrigen: string | null;
  asesorDestino: string;
  fecha: string;
}
```

**Trigger:** Al transferir un ticket a otro asesor o cola.

---

### 1.9 `TicketClosed`

```typescript
interface TicketClosed {
  eventType: "TicketClosed";
  ticketId: string;
  estadoPrevio: string;         // "resuelto" | "en_proceso"
  tiempoTotalMin: number;       // Minutos desde creacion hasta cierre
  dentroDeSLA: boolean;
  fecha: string;
}
```

**Trigger:** Al cambiar estado a `cerrado` o `solved`.

---

### 1.10 `TicketReopened`

```typescript
interface TicketReopened {
  eventType: "TicketReopened";
  ticketId: string;
  estadoPrevio: string;         // "cerrado" | "resuelto"
  motivo: string | null;
  reaperturaNumero: number;     // 1, 2, 3... (cuantas veces fue reabierto)
  fecha: string;
}
```

**Trigger:** Al cambiar estado de `cerrado`/`resuelto` a `abierto`/`pending`.

---

## 2. Ciclo de Vida Tipico

```
TicketCreated
    │
    ▼
TicketAssigned          (asignado a un asesor)
    │
    ▼
ReplySent               (primera respuesta del asesor)
    │
    ├──► FirstResponse  (evento derivado: se calculo SLA)
    │
    ▼
StatusChanged           (cambio de estado: open → pending)
    │
    ▼
ReplyReceived           (cliente responde)
    │
    ▼
StatusChanged           (cambio de estado: pending → open)
    │
    ▼
CategoryChanged         (categorizacion)
    │
    ▼
TicketClosed            (cierre)
    │
    ▼
TicketReopened          (reapertura — opcional)
    │
    ▼
TicketClosed            (cierre definitivo)
```

---

## 3. Event Bus (integracion con el existente)

COPE ya posee un `EventBus` en memoria (`backend/src/core/events/bus/EventBus.ts`). Los eventos del Historical Engine se integrarian al mismo bus:

```typescript
// Al publicar un evento de estado
eventBus.publish({
  type: "StatusChanged",
  payload: { ticketId, estadoAnterior: "open", estadoNuevo: "pending", ... },
  timestamp: new Date(),
  source: "zendesk-client",
});

// El subscriber persiste en ticket_status_history
eventBus.subscribe("StatusChanged", async (event) => {
  await historicalRepository.insertStatusChange(event.payload);
});
```

---

## 4. Subscribers del Historical Engine

| Evento | Subscriber | Accion |
|--------|-----------|--------|
| `TicketCreated` | `HistoricalRepository.insertEvent()` | Inserta primera fila en `ticket_status_history` |
| `StatusChanged` | `HistoricalRepository.insertEvent()` | Inserta transicion de estado |
| `TicketClosed` | `SLAEngine.calculate()` | Calcula SLA usando fechas historicas |
| `TicketReopened` | `ReopenCounter.increment()` | Incrementa contador de reaperturas |
| `FirstResponse` | `SLAEngine.check()` | Verifica cumplimiento de SLA |
| `CategoryChanged` | `CategoryTracker.update()` | Actualiza categorias del ticket |
| `TicketAssigned` | `AssignmentTracker.update()` | Registra asignacion |

---

## 5. Payload JSONB (datos contextuales)

El campo `payload` en `ticket_status_history` almacena datos especificos del evento:

```json
{
  "sla_primera_respuesta_min": 15,
  "dentro_de_sla": true,
  "categoria": "facturacion",
  "subcategoria": "reactivo",
  "canal_original": "whatsapp",
  "ticket_original_id": "ZD-12345",
  "cliente": "Carlos Mendoza",
  "pais": "PERU"
}
```

---

## 6. No implementar (solo diseno)

Este documento define la arquitectura de eventos. La implementacion requiere:

1. Crear las interfaces TypeScript en `backend/src/domain/events/`
2. Integrar con `EventBus` existente
3. Crear subscribers que persistan en `ticket_status_history`
4. Instrumentar los casos de uso existentes (`AcceptTicketUseCase`, `CloseTicketUseCase`, etc.) para emitir eventos
5. Agregar listeners en los clientes de canal (`ZendeskClient`, `MetaService`) para detectar cambios externos
