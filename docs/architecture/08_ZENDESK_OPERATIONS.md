# Zendesk Operations v1

## Sprints 39.5 — 40.0

---

## 39.5 — Customer Timeline

`GET /api/zendesk/users/:id/timeline` — Últimos 15 tickets del cliente, ordenados por fecha descendente.

Mostrado en el panel Cliente 360° como "Últimos tickets".

## 39.6 — Internal Notes

`POST /api/zendesk/tickets/:id/internal-note`

Body: `{ body: string, autor: string }`

Consume `PUT /api/v2/tickets/:id.json` con `comment.public = false`.

## 39.7 — Assignment

`POST /api/zendesk/tickets/:id/assign`

Body: `{ assigneeId: number, autor: string }`

`GET /api/zendesk/agents` — Lista de agentes disponibles.

## 39.8 — Ticket Status

`POST /api/zendesk/tickets/:id/status`

Body: `{ status: "new"|"open"|"pending"|"solved"|"closed", autor: string }`

Validación: solo estados Zendesk válidos.

## 39.9 — Categorización COPE

`POST /api/zendesk/tickets/:id/categorize`

Body: `{ categoria: string, subcategoria: string, autor: string }`

Actualiza `custom_fields` en Zendesk.

## 40.0 — Reply Workspace

`POST /api/zendesk/tickets/:id/reply`

Body: `{ body: string, autor: string }`

Consume `PUT /api/v2/tickets/:id.json` con `comment.public = true`.

---

## Endpoints agregados

| Método | Ruta | Sprint | Descripción |
|--------|------|--------|-------------|
| GET | `/api/zendesk/users/:id/timeline` | 39.5 | Timeline de tickets del cliente |
| GET | `/api/zendesk/agents` | 39.7 | Lista de agentes Zendesk |
| POST | `/api/zendesk/tickets/:id/internal-note` | 39.6 | Crear nota interna |
| POST | `/api/zendesk/tickets/:id/assign` | 39.7 | Asignar ticket |
| POST | `/api/zendesk/tickets/:id/status` | 39.8 | Cambiar estado |
| POST | `/api/zendesk/tickets/:id/categorize` | 39.9 | Categorizar ticket |
| POST | `/api/zendesk/tickets/:id/reply` | 40.0 | Responder ticket |

---

## Frontend

| Componente | Sprint | Cambio |
|-----------|--------|--------|
| `ModuloCliente360Real` | 39.5 | Agregado timeline de últimos tickets |
| `useZendeskActions` | 39.6-40.0 | Hook con 5 acciones: note, assign, status, categorize, reply |
| `ContextActions` | 39.6-40.0 | Botones activos con panel de entrada inline. Feedback visual de resultado. |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprints 39.5 — 40.0*
