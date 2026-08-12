# Ticket Detail v1

## Sprint 39.3

### Objetivo

Al seleccionar un ticket de la Bandeja, cargar toda la información y conversación del ticket sin abrir Zendesk.

---

## Endpoints

| Método | Ruta | Endpoint Zendesk |
|--------|------|------------------|
| GET | `/api/zendesk/tickets/:id` | `GET /api/v2/tickets/:id.json` |
| GET | `/api/zendesk/tickets/:id/comments` | `GET /api/v2/tickets/:id/comments.json` |

---

## Flujo

```
Bandeja (inbox)         → click en ticket
       │
       ▼
useZendeskTicket(id)    → GET /api/zendesk/tickets/:id
                        → GET /api/zendesk/tickets/:id/comments
       │
       ▼
ConversationHeader      → Ticket #, Estado, Prioridad, Solicitante, Email, Categoría, Creado, Actualizado
QuickSummary            → Total mensajes, cliente/asesor, primera respuesta
MessageTimeline         → Comentarios cronológicos (cliente, asesor, nota interna, evento)
ContextActions          → 8 botones deshabilitados
```

---

## Cabecera del ticket

| Campo | Fuente | Ejemplo |
|-------|--------|---------|
| Canal | Badge Zendesk | `✉ Zendesk` |
| Ticket # | `ticket.id` | `#12345` |
| Estado | `ticket.status` | `● Abierto` |
| Prioridad | `ticket.priority` | `high` |
| Tiempo abierto | Calculado | `2h 15m` |
| Asunto | `ticket.subject` | Problema con facturación |
| Solicitante | `user.name` | Carlos Mendoza |
| Email | `user.email` | carlos@email.com |
| Categoría | `custom_fields` | Facturación |
| Creado | `ticket.created_at` | 15 jul 2026 |
| Actualizado | `ticket.updated_at` | 15 jul 2026 |

---

## Tipos de comentario

| Tipo | Apariencia | Origen |
|------|-----------|--------|
| Cliente | Burbuja gris, alineación izquierda | `comment.public = true` |
| Nota interna | Burbuja amber, alineación derecha, 🔒 | `comment.public = false` |
| Evento | Texto itálico centrado | `comment.type = "VoiceComment"` o sistema |

---

## Validación

| Criterio | Estado |
|----------|--------|
| Al hacer clic en un ticket se carga el detalle | ✅ |
| La conversación se renderiza cronológicamente | ✅ |
| Se diferencia cliente / asesor / nota interna | ✅ |
| No se muestra JSON | ✅ |
| Sin abrir Zendesk | ✅ |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprint 39.3 — Ticket Detail*
