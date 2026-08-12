# Integración Zendesk — Views API

## Fuente oficial de la bandeja de Zendesk

A partir del sprint ZD-004, la bandeja de COPE consume exclusivamente la **Views API**
de Zendesk como fuente de datos. El endpoint `/api/v2/tickets.json` queda descartado
para la operación diaria.

## Vistas activas

| View ID | Nombre | Propósito |
|---|---|---|
| `360199057454` | Todos los tickets sin resolver | Tickets new, open, pending |
| `360199057434` | Tickets recién resueltos | Tickets solved (últimos 5 días) |
| `360199057474` | Tickets sin asignar | (futuro) |
| `360199057514` | Tickets pendientes de respuesta | (futuro) |
| `360199057494` | Tickets recién actualizados | (futuro) |

## Endpoint

```
GET /api/zendesk/inbox
```

Internamente consulta:
- `views/360199057454/tickets.json` — tickets activos (new, open, pending)
- `views/360199057434/tickets.json` — tickets resueltos recientemente

Ambos resultados se combinan, se enriquecen con datos del solicitante (Zendesk Users API)
y se filtran por visibilidad.

## Clasificación automática

| Grupo | Criterio |
|---|---|
| **Pendientes** | `status == new \|\| status == pending` |
| **Abiertos** | `status == open \|\| status == hold` |
| **Recién resueltos** | `status == solved` con `estadoOperativo == "RECIENTE"` |

## Política de visibilidad en COPE

| Canal | Período visible después de cerrarse |
|---|---|
| WhatsApp (Meta / Whaticket) | 48 horas |
| Zendesk | 5 días (120 horas) |
| Correo electrónico | 7 días |
| Chat en línea | 24 horas |

Después del período de visibilidad, los registros pasan al **historial operativo**
y siguen disponibles para:
- Cliente 360
- Business Intelligence (BI)
- Búsquedas globales

Ningún registro se elimina de la base de datos.

## Constantes

Definidas en `modules/zendesk/domain/ZendeskViewIds.ts`:

```typescript
export const ZENDESK_VIEW_UNRESOLVED = 360199057454;
export const ZENDESK_VIEW_RECENT_SOLVED = 360199057434;
export const ZENDESK_VIEW_UNASSIGNED = 360199057474;
export const ZENDESK_VIEW_PENDING_REPLY = 360199057514;
export const ZENDESK_VIEW_RECENTLY_UPDATED = 360199057494;
```

## Validaciones del sprint ZD-004

- [x] Cantidad de tickets coincide con Zendesk
- [x] Los asuntos coinciden
- [x] Los estados coinciden
- [x] Tickets nuevos aparecen automáticamente
- [x] Tickets pendientes aparecen automáticamente
- [x] Tickets abiertos aparecen automáticamente
- [x] Tickets recién resueltos visibles 5 días y luego desaparecen de la bandeja
- [x] Ningún ticket se elimina de la base de datos
