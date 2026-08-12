# Zendesk Workspace Specification v1

## Sprint 39 — Zendesk Integration v1
## Sprint 40 — Zendesk Workspace v1

---

## Arquitectura del módulo Zendesk

```
backend/src/modules/zendesk/
├── application/
│   ├── ZendeskProvider.ts          # Interface (7 métodos)
│   ├── ZendeskRealProvider.ts      # Implementación real con HTTP
│   ├── MockZendeskProvider.ts      # Mock sin credenciales
│   ├── dto/ZendeskDTOs.ts          # 5 DTOs de frontera (Zod)
│   └── mapper/ZendeskMapper.ts     # Traducción Zendesk → COPE
├── domain/
│   ├── ZendeskTypes.ts             # Modelos internos
│   ├── ZendeskConfig.ts            # .env → subdomain, email, token
│   └── ZendeskErrorHandler.ts      # 401, 403, 404, 429, 500
├── infrastructure/
│   ├── ZendeskClient.ts            # HTTP client con auth Basic + logging
│   └── ZendeskRepository.ts        # Orquesta Provider según config
└── presentation/
    ├── ZendeskController.ts        # 5 endpoints REST
    └── ZendeskRoutes.ts            # Rutas montadas en /api/atenciones/zendesk
```

---

## Endpoints implementados

| Método | Ruta | Propósito | Provider method |
|--------|------|-----------|-----------------|
| GET | `/api/atenciones/zendesk/unassigned` | Tickets sin asignar | `getUnassignedTickets` |
| GET | `/api/atenciones/zendesk/my` | Tickets del asesor | `getMyTickets` |
| GET | `/api/atenciones/zendesk/recently-updated` | Tickets recién actualizados | `getRecentlyUpdated` |
| GET | `/api/atenciones/zendesk/:ticketId` | Detalle del ticket | `getTicket` |
| GET | `/api/atenciones/zendesk/:ticketId/conversation` | Comentarios del ticket | `getConversation` |

---

## Modelo interno ZendeskTicket

| Campo | Tipo | Origen API |
|-------|------|------------|
| id | number | `ticket.id` |
| subject | string | `ticket.subject` |
| description | string | `ticket.description` |
| status | enum | `ticket.status` (new/open/pending/solved/closed) |
| priority | enum | `ticket.priority` |
| requester_id | number | `ticket.requester_id` |
| assignee_id | number | `ticket.assignee_id` |
| created_at | string | `ticket.created_at` |
| updated_at | string | `ticket.updated_at` |
| tags | string[] | `ticket.tags` |
| custom_fields | array | `ticket.custom_fields` |

---

## Mapeo Zendesk → COPE DTO

| Zendesk API | ZendeskTicket (interno) | TicketZendeskDTO (COPE) |
|-------------|------------------------|------------------------|
| `ticket.id` | `id` | `ticketOriginalId` |
| `ticket.status` | `status` | `ticketOriginalStatus` |
| `ticket.subject` | `subject` | `asunto` |
| `ticket.priority` | `priority` | `prioridad` |
| `ticket.description` | `description` | `descripcion` |
| `user.name` | — | `clienteNombre` |
| `user.email` | — | `clienteEmail` |
| `ticket.tags` | `tags` | `etiquetas` |

---

## Layout del Workspace (4 columnas)

```
┌────────┬──────────────┬──────────────────┬──────────────────┐
│SIDEBAR │ BANDEJA 24%  │ CONVERSACIÓN 44% │ WORKSPACE 32%    │
│        │              │                  │                  │
│  Logo  │ Filtros      │ Cabecera fija    │ Cliente          │
│        │ ─────────── │ → Ticket #       │ Cliente 360°     │
│  Dash  │ AtencionRow │ → Estado         │ Diagnóstico      │
│  Aten  │ AtencionRow │ → Prioridad      │ (Operativo)      │
│  Cli   │ AtencionRow │ → Cliente        │ Herramientas     │
│  Rep   │ ...          │ → Tiempo abierto │ Guías            │
│  Conf  │              │                  │ Actividades      │
│        │              │ QuickSummary     │ Resultado        │
│        │              │ ───────────────  │                  │
│        │              │ MessageTimeline  │                  │
│        │              │ (chat burbujas)  │                  │
│        │              │ ───────────────  │                  │
│        │              │ ContextActions   │                  │
│        │              │ (8 btns disabled)│                  │
└────────┴──────────────┴──────────────────┴──────────────────┘
```

---

## Acciones contextuales (preparadas, sin lógica)

| Acción | Estado | Sprint |
|--------|--------|--------|
| Responder | 🔒 Deshabilitado | Futuro |
| Nota interna | 🔒 Deshabilitado | Futuro |
| Asignar | 🔒 Deshabilitado | Futuro |
| Cambiar estado | 🔒 Deshabilitado | Futuro |
| Categorizar | 🔒 Deshabilitado | Futuro |
| Crear DEV | 🔒 Deshabilitado | Futuro |
| Programar Meet | 🔒 Deshabilitado | Futuro |
| Escalar | 🔒 Deshabilitado | Futuro |

---

## Logging de API

Cada llamada a Zendesk se registra en consola:

```
[ZendeskAPI] /tickets.json?status=new — 200 — 342ms — 15 items
[ZendeskAPI] /tickets/12345.json — 200 — 89ms — 1 items
[ZendeskAPI] /users/678.json — 200 — 45ms — 1 items
```

---

## Manejo de errores

| Código | Error COPE | Acción |
|--------|-----------|--------|
| 401 | `AUTH_ERROR` | Credenciales inválidas |
| 403 | `AUTH_ERROR` | Sin permisos |
| 404 | `NOT_FOUND` | Ticket no existe |
| 429 | `RATE_LIMIT` | Rate limit alcanzado |
| 500+ | `NETWORK_ERROR` | Zendesk caído |

---

## Validación

| Criterio | Estado |
|----------|--------|
| Ver mis tickets reales desde Zendesk | ✅ |
| Abrir un ticket y ver detalle | ✅ |
| Leer toda la conversación (chat) | ✅ |
| Visualizar cliente | ✅ |
| Visualizar comentarios con tipo (público/interno) | ✅ |
| Sin abrir Zendesk | ✅ |
| Sin escribir en Zendesk | ✅ (solo lectura) |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprints 39-40 — Zendesk Integration & Workspace v1*
