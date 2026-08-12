# Zendesk Customer Panel v1

## Sprint 39.4

### Objetivo

Construir el primer panel Cliente360 utilizando únicamente la información disponible en la API de Zendesk.

---

## Backend

### Endpoint

```
GET /api/zendesk/users/:id
```

Consume:

| Endpoint Zendesk | Propósito |
|------------------|-----------|
| `GET /api/v2/users/:id.json` | Datos del usuario |
| `GET /api/v2/organizations/:id.json` | Organización del usuario |
| `GET /api/v2/tickets.json?requester_id=:id` | Tickets del usuario |

### Modelo `CustomerData`

| Campo | Tipo | Origen |
|-------|------|--------|
| id | string | `user.id` |
| nombre | string | `user.name` |
| correo | string | `user.email` |
| telefono | string | `user.phone` |
| empresa | string | `organization.name` |
| rol | string | `user.role` |
| fechaCreacion | string | `user.created_at` |
| ultimaActividad | string | Último `updated_at` de tickets |
| totalTickets | number | `count` de tickets del usuario |
| ticketsAbiertos | number | Tickets con status != closed/solved |

---

## Frontend

### Componentes

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `useZendeskCustomer` | `useZendeskCustomer.ts` | Hook que consume `/api/zendesk/users/:id` |
| `ModuloCliente360Real` | `ModuloCliente360Real.tsx` | Panel visual con 10 campos del cliente |

### Información mostrada

```
Nombre       → Carlos Mendoza
Correo       → carlos@email.com
Teléfono     → +51999000101
Empresa      → Restaurante SA
Zona horaria → — (no disponible en API básica)
Creado       → 15 jul 2026
Última act.  → 15 jul 2026
Tickets      → 12 totales · 3 abiertos
Tags         → [vip] [facturacion] [reincidente]
```

### DTO ampliado

Se agregó `clienteId` al `TicketZendeskDTO` y `ZendeskTicketFE` para poder consultar el perfil del cliente desde el workspace.

---

## Validación

| Criterio | Estado |
|----------|--------|
| Al abrir una atención se muestra la ficha del cliente | ✅ |
| Datos provienen de Zendesk API | ✅ |
| Sin datos simulados | ✅ |
| Sin abrir Zendesk | ✅ |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprint 39.4 — Zendesk Customer Panel*
