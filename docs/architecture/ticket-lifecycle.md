# Ticket Lifecycle — COPE

> Documento de auditoria del flujo completo de estados. Fecha: Agosto 2026.

---

## 1. Zendesk

### 1.1 Estados raw (API Zendesk)

| Estado | Significado | ID API |
|--------|-------------|--------|
| `new` | Ticket recien creado, sin asignar | `"new"` |
| `open` | Asignado, en atencion activa | `"open"` |
| `pending` | Esperando respuesta del cliente | `"pending"` |
| `solved` | Resuelto por el asesor | `"solved"` |
| `closed` | Cerrado definitivamente | `"closed"` |

### 1.2 Estados activos (VisibilityEngine)

**Archivo:** `backend/src/domain/visibility/VisibilityEngine.ts:18`

```typescript
const ESTADOS_ACTIVOS = new Set(["new", "open", "pending", "hold", "waiting"]);
```

### 1.3 Bandejas Zendesk (ZendeskRealProvider)

| Bandeja | Estados consultados |
|---------|-------------------|
| Unassigned | `status: "new"` |
| My Tickets | `status: "open,pending"` |
| Recently Updated | `status: "new,open,pending,solved"` |
| Todas | `type:ticket status<closed` |
| Views (unresolved) | View ID `360199057454` |
| Views (recent solved) | View ID `360199057434` |

### 1.4 Transiciones permitidas (TicketLifecycle)

**Archivo:** `backend/src/domain/tickets/TicketLifecycle.ts`

```
PENDIENTE → EN_PROCESO   (accept)
EN_PROCESO → RESUELTO    (resolve)
EN_PROCESO → CERRADO     (close)
RESUELTO → CERRADO       (close)
```

### 1.5 Operaciones de escritura desde COPE hacia Zendesk

| Accion | Endpoint Zendesk API | Implementado |
|--------|---------------------|-------------|
| Cambiar estado | `PUT /tickets/:id { ticket: { status } }` | Si (`ZendeskClient.cambiarEstado()`) |
| Nota interna | `PUT /tickets/:id` | Si |
| Asignar | `PUT /tickets/:id { ticket: { assignee_id } }` | Si |
| Cerrar | `PUT /tickets/:id { ticket: { status: "solved" } }` | Si (`responderYResolver()`) |
| Reply | `PUT /tickets/:id` | Si |

### 1.6 Interceptor de cambios (apiMiddleware)

**Archivo:** `frontend/src/lib/apiMiddleware.ts`

| Patron URL | Accion COPE |
|-----------|-------------|
| `POST /zendesk/tickets/:id/reply-resolve` | `CLOSE` |
| `POST /zendesk/tickets/:id/status` | `CUSTOM` |
| `POST /zendesk/tickets/:id/assign` | `CHANGE_ASSIGNEE` |
| `POST /zendesk/tickets/:id/categorize` | `ADD_CATEGORY` |

---

## 2. Meta (WhatsApp)

### 2.1 Estados raw (Meta API)

| Estado | Significado |
|--------|-------------|
| `open` | Conversacion activa |
| `pending` | En espera |
| `closed` | Cerrada |
| `group` | Conversacion grupal |

**Archivo:** `frontend/src/modules/meta/dto/meta.dto.ts:1`

### 2.2 Mapeo de estados (inbox)

**Archivo:** `frontend/src/modules/inbox/mappers/metaToInbox.ts:10`

```
Meta "open"    → COPE inbox "new"
Meta "pending" → COPE inbox "open"
Meta "closed"  → COPE inbox "closed"
Meta "group"   → COPE inbox "group"
```

### 2.3 Mapeo de acciones (ticket-actions)

**Archivo:** `frontend/src/modules/ticket-actions/mappers/metaTicketActionMapper.ts`

| Accion COPE | Estado Meta resultante |
|-------------|----------------------|
| `CLOSE` | `closed` (+ farewell message opcional) |
| `REOPEN` | `open` |
| `MARK_PENDING` | `pending` |
| `MARK_OPEN` | `open` |

### 2.4 Operaciones desde COPE hacia Meta

| Accion | Implementado |
|--------|-------------|
| Cerrar ticket | Si (`MetaService.closeTicket()`) |
| Enviar mensaje | Si (`MetaService.sendMessage()`) |
| Obtener conversacion | Si (`MetaService.getConversation()`) |
| Reabrir | No implementado (API provider: mock) |
| Marcar pendiente | No implementado (API provider: mock) |

### 2.5 Estado actual: Mock Provider

```typescript
// frontend/src/modules/meta/providers/index.ts:4
export const metaProvider = mockMetaProvider;  // ← MOCK activo

// frontend/src/modules/meta/providers/ApiMetaProvider.ts:7
closeTicket: () => { throw new Error("Not implemented"); }  // ← STUB
```

---

## 3. Whaticket

### 3.1 Estado actual

**No implementado.** El adaptador es un placeholder:

**Archivo:** `backend/src/adapters/whaticket/README.md`

```
Whaticket Adapter — Por implementar.
Proximamente en la Fase 2.
```

### 3.2 Definiciones existentes

| Elemento | Valor |
|----------|-------|
| Canal en dominio | `CanalOrigen = "whaticket"` (`backend/src/domain/atencion/Atencion.ts:9`) |
| Ventana visibilidad | 48 horas (`backend/src/domain/visibility/VentanaVisibilidad.ts:9`) |
| SLA primera respuesta | 15 minutos (`backend/src/domain/tickets/TicketChannel.ts:11`) |
| Clasificacion canal | `"whatsapp"` (agrupado con Meta en analytics) |

---

## 4. Homologacion de estados (`estado_homologado`)

La vista `public.v_unificado_norm` contiene la columna `estado_homologado` que unifica los estados de los 3 canales. La logica de transformacion reside en la vista PostgreSQL (no en TypeScript).

### 4.1 Valores conocidos

| `estado_homologado` | Zendesk raw | Meta raw | Significado |
|---------------------|-------------|----------|-------------|
| `abierto` | `open` | `open` | En atencion activa |
| `cerrado` | `closed` | `closed` | Cerrado definitivo |
| `pendiente` | `pending` | `pending` | Esperando respuesta |
| `resuelto` | `solved` | — | Resuelto por asesor |
| `sin_mapear` | — | — | Sin estado conocido |
| `en_proceso` | — | — | En proceso generico |
| `sin_atender` | — | — | Sin atencion |

### 4.2 Mapper COPE (PgTicketRepository)

**Archivo:** `backend/src/repositories/PgTicketRepository.ts:7-12`

```
cerrado/resuelto           → CERRADO
en_proceso/sin_atender/pendiente → EN_PROCESO
cualquier otro             → PENDIENTE
```

---

## 5. Informacion faltante (NO disponible hoy)

| Dato | Existe? |
|------|---------|
| Fecha de cierre del ticket | **NO** |
| Fecha de resolucion | **NO** |
| Fecha de cada cambio de estado | **NO** |
| Usuario que realizo cada cambio | **NO** |
| Estado al cierre del periodo | **NO** — solo estado actual |
| Historial de reaperturas | **NO** |
| Tiempo acumulado en cada estado | **NO** |
| Backlog en fecha especifica | **NO** — solo se puede estimar via `fecha` de creacion |

---

## 6. Ciclo completo (end-to-end)

```
CANAL               COPE (lectura)            COPE (escritura)         BD remota
─────               ─────────────            ────────────────         ────────
Zendesk API  ──►  ZendeskClient.get()  ──►  ZendeskClient.put() ──►  v_unificado_norm
  new                                       cambiarEstado()            estado_homologado
  open                                      asignar()                  (SOLO LECTURA)
  pending                                   internalNote()             estado ACTUAL
  solved                                    responderYResolver()
  closed

Meta API     ──►  MetaService.get()    ──►  MetaService.closeTicket() ──► (no persiste local)
  open                                       (mock provider)
  pending
  closed
  group

Whaticket    ──►  (no implementado)   ──►  (no implementado)        ──►  v_unificado_norm
                                                                          (cuando exista)

HISTORIAL:    NO EXISTE. Solo estado_homologado actual.
SNAPSHOTS:    NO EXISTEN.
AUDITORIA:    Solo servicios en memoria volatil (AuditService, TimelineService, EventBus).
```

---

## 7. Conclusion

COPE opera como capa BI/analitica read-only. Los cambios de estado se escriben hacia las APIs externas (Zendesk, Meta) pero **no se persisten localmente**. No existe historial de estados, snapshots ni auditoria persistente. El unico dato disponible es `estado_homologado` en `v_unificado_norm` que refleja el estado actual del ticket, no su historia.
