# Zendesk Inbox v1

## Sprint 39.2

### Objetivo

Consumir la primera bandeja real de Zendesk desde la API oficial y exponerla mediante la API propia de COPE.

---

## Endpoints COPE

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/api/zendesk/test` | Validar conectividad con Zendesk |
| GET | `/api/zendesk/views` | Listar vistas configuradas en Zendesk |
| GET | `/api/zendesk/inbox` | Obtener tickets de la primera vista disponible |

---

## Endpoints Zendesk consumidos

| Endpoint | Propósito |
|----------|-----------|
| `GET /api/v2/users/me.json` | Validar autenticación |
| `GET /api/v2/views.json` | Listar vistas |
| `GET /api/v2/views/:id.json` | Obtener detalle de vista |
| `GET /api/v2/views/:id/tickets.json` | Obtener tickets de una vista |

---

## Modelo interno `InboxItem`

| Campo | Tipo | Origen |
|-------|------|--------|
| ticketId | string | `ticket.id` |
| subject | string | `ticket.subject` |
| status | string | `ticket.status` |
| priority | string | `ticket.priority` |
| requesterName | string | `user.name` |
| requesterEmail | string | `user.email` |
| assigneeName | string | `user.name` (assignee) |
| createdAt | string | `ticket.created_at` |
| updatedAt | string | `ticket.updated_at` |
| tags | string[] | `ticket.tags` |
| url | string | Enlace directo a Zendesk |

---

## Respuesta de `/api/zendesk/inbox`

```json
{
  "ok": true,
  "data": {
    "vista": { "id": 123, "title": "Tickets sin resolver", "active": true },
    "tickets": [
      {
        "ticketId": "12345",
        "subject": "Problema con facturación",
        "status": "open",
        "priority": "high",
        "requesterName": "Carlos Mendoza",
        "requesterEmail": "carlos@email.com",
        "assigneeName": null,
        "createdAt": "2026-07-15T10:00:00Z",
        "updatedAt": "2026-07-15T12:00:00Z",
        "tags": ["facturacion", "urgente"],
        "url": "https://midominio.zendesk.com/agent/tickets/12345"
      }
    ],
    "total": 1
  }
}
```

---

## Frontend

| Componente | Cambio |
|-----------|--------|
| `useZendeskInbox` | Nuevo hook que consume `/api/zendesk/inbox` |
| `InboxItemFE` | Nuevo tipo frontend para items de inbox |
| `ZendeskPage` | Reemplazado `useZendeskBandeja` por `useZendeskInbox` |

La bandeja ahora muestra tickets reales. Sin datos simulados.

---

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `modules/zendesk-test/ZendeskInboxService.ts` | Servicio: obtiene vistas, selecciona la primera activa, carga tickets con usuarios |
| `frontend/.../useZendeskInbox.ts` | Hook: consume `/api/zendesk/inbox`, tipado `InboxItemFE` |

---

## Flujo

```
Frontend                          Backend                          Zendesk
   │                                │                                │
   │ GET /api/zendesk/inbox         │                                │
   ├──────────────────────────────► │                                │
   │                                │ GET /api/v2/views.json         │
   │                                ├──────────────────────────────► │
   │                                │ ← [{ id, title, active }]     │
   │                                │                                │
   │                                │ GET /api/v2/views/{id}/tickets │
   │                                ├──────────────────────────────► │
   │                                │ ← { tickets: [...] }          │
   │                                │                                │
   │                                │ GET /api/v2/users/show_many    │
   │                                ├──────────────────────────────► │
   │                                │ ← { users: [...] }            │
   │                                │                                │
   │ ← { vista, tickets[], total }  │                                │
   │                                │                                │
```

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprint 39.2 — Zendesk Inbox*
