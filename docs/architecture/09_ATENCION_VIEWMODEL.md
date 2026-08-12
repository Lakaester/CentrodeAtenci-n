# AtencionViewModel v1

## Sprint 40 — Zendesk Read Model Complete

### Objetivo

Una única llamada HTTP desde el Frontend para obtener toda la información de una Atención.

---

## Endpoint

```
GET /api/zendesk/atenciones/:id
```

---

## Lo que combina internamente

| Llamada a Zendesk | Datos obtenidos |
|-------------------|-----------------|
| `GET /api/v2/tickets/:id.json` | Ticket (asunto, estado, prioridad, tags, etc.) |
| `GET /api/v2/tickets/:id/comments.json` | Comentarios + adjuntos |
| `GET /api/v2/users/:id.json` | Solicitante (nombre, correo, teléfono, rol) |
| `GET /api/v2/organizations/:id.json` | Empresa del solicitante |
| `GET /api/v2/tickets.json?requester_id=:id` | Tickets del solicitante (totales, abiertos, últimos 10) |

---

## AtencionViewModel (respuesta)

```typescript
{
  id: string,
  canal: "zendesk",
  ticket: { id, ticketOriginalId, status, asunto, descripcion, prioridad,
            tipo, createdAt, updatedAt, tags, url },
  cliente: { id, nombre, correo, telefono, empresa, rol,
             fechaCreacion, ultimaActividad, totalTickets, ticketsAbiertos,
             ultimosTickets: [{ ticketId, asunto, estado, fecha }] },
  comentarios: [{ id, contenido, emisor, tipo, timestamp, publico, adjuntos }],
  totalComentarios: number
}
```

---

## Frontend

| Reemplazo | Anterior | Ahora |
|-----------|----------|-------|
| Hook | `useZendeskTicket` (2 llamadas) | `useAtencionViewModel` (1 llamada) |
| Llamadas | `GET /tickets/:id` + `GET /tickets/:id/comments` + `GET /users/:id` | `GET /api/zendesk/atenciones/:id` |

---

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `AtencionViewModel.ts` | Tipo del ViewModel unificado |
| `AtencionViewModelService.ts` | Servicio que orquesta 5 llamadas a Zendesk |
| `useAtencionViewModel.ts` | Hook frontend que consume el endpoint único |

---

## Validación

| Criterio | Estado |
|----------|--------|
| Una única llamada HTTP desde el Frontend | ✅ |
| Backend combina ticket + comentarios + cliente + org + timeline | ✅ |
| No se exponen modelos Zendesk directamente | ✅ |
| Compatible con frontend existente | ✅ |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprint 40 — Zendesk Read Model Complete*
