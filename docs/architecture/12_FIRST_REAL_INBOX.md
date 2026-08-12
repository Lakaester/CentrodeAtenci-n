# Sprint 40A — First Real Inbox

## Objetivo

La Bandeja de COPE debe mostrar tickets reales provenientes de Zendesk.

---

## Endpoint

```
GET /api/zendesk/inbox
```

| Situación | Respuesta |
|-----------|-----------|
| Zendesk configurado y disponible | `{ ok: true, data: { vista, tickets[], total } }` |
| Sin credenciales .env | `{ ok: false, conectado: false, error: "MISSING_CONFIG" }` |
| Zendesk caído o error | `{ ok: false, error: { code, message, httpStatus } }` |

---

## Frontend — Estados visuales

| Estado | Componente |
|--------|-----------|
| Cargando | Spinner centrado |
| Error (Zendesk no disponible) | Icono AlertCircle + "No fue posible conectar con Zendesk" + botón Reintentar |
| Vacío (sin tickets en la vista) | Icono Inbox + mensaje informativo |
| Con datos | Lista de `AtencionRow` con avatar, nombre, asunto, estado, prioridad, tiempo, canal, ticket# |
| Sincronizado | Indicador `🟢 hace Xs` / `🟡 hace Xmin` en el header |

---

## Componentes modificados

| Componente | Cambio |
|-----------|--------|
| `useZendeskInbox.ts` | Agregado `ultimaSync` (Date) y `recargar()` (refetch manual) |
| `ZendeskPage.tsx` | Header con botón recargar + indicador WiFi. Error visual con AlertCircle + Reintentar. Empty state con Inbox icon. |

---

## DAPs aplicadas

| DAP | Cómo se cumple |
|-----|----------------|
| DAP-021 | Documentación actualizada al finalizar el Sprint |
| DAP-022 | Documentación se actualizó automáticamente al modificar componentes |
| DAP-023 | Mejora visible: la bandeja muestra tickets reales con indicador de sincronización |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprint 40A — First Real Inbox*
