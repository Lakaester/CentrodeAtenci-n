# Integración Google Calendar — Agendas S.E.

## Resumen

COPE se integra con el calendario central **"Agendas S.E."** de Google Calendar mediante OAuth 2.0. COPE es la fuente de verdad; Google Calendar es una representación sincronizada.

## Arquitectura

```
COPE (BD PostgreSQL) → GoogleCalendarService → Google Calendar API (OAuth 2.0)
```

- **Autenticación**: OAuth 2.0 con cuenta central `vcastagnino@restaurant.pe`
- **Calendario**: `c_b1d3204173157075fe8727e99a7f3aa382cfcb76012c821d42c6b61df261ffeb@group.calendar.google.com`
- **Zona horaria**: `America/Lima`
- **Tokens**: Almacenados en tabla `google_oauth_tokens`

## Variables de entorno

```env
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=http://localhost:4000/api/gestion/google-calendar/callback
GOOGLE_CALENDAR_ID=c_b1d3204173157075fe8727e99a7f3aa382cfcb76012c821d42c6b61df261ffeb@group.calendar.google.com
GOOGLE_CALENDAR_TIMEZONE=America/Lima
```

## Endpoints

### OAuth

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/gestion/google-calendar/status` | Estado de conexión (configured + connected) |
| GET | `/api/gestion/google-calendar/info` | Info del calendario (summary, timezone, accessRole) |
| POST | `/api/gestion/google-calendar/connect` | Genera URL de autorización OAuth |
| POST | `/api/gestion/google-calendar/disconnect` | Elimina tokens OAuth |
| GET | `/api/gestion/google-calendar/callback` | Callback de Google (sin auth) |

### Sincronización

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/gestion/agendas/:id/sync-calendar` | Crear/actualizar evento en Google Calendar |
| POST | `/api/gestion/agendas/:id/retry-sync-calendar` | Reintentar sincronización fallida |
| POST | `/api/gestion/agendas/:id/reconcile` | Reconciliar evento con datos de COPE |

### Disponibilidad

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/gestion/google-calendar/disponibilidad?desde=&hasta=` | Verificar horarios ocupados (FreeBusy) |

## Flujo de sincronización automática

1. **Crear agenda** → `sincronizarCalendar()` fire-and-forget → crea evento en Google Calendar con Meet link
2. **Editar agenda** → si tiene `calendar_event_id`, actualiza el evento existente
3. **Cancelar agenda** → `cancelarEnCalendar()` → elimina el evento de Google Calendar
4. **Reintentar** → solo disponible cuando `calendar_sync_status = ERROR`

## Identificación de eventos COPE

Los eventos creados por COPE incluyen `extendedProperties.private`:

```json
{
  "private": {
    "cope": "true",
    "copeAgendaId": "<agenda-id>"
  }
}
```

## Manejo de zona horaria

Las columnas `hora_inicio` y `hora_fin` de PostgreSQL se devuelven como objetos Date (epoch 1970-01-01). El servicio extrae `HH:MM` y construye DateTime con offset `-05:00` para Google Calendar API.

```typescript
// Ejemplo: Date object 1970-01-01T16:30:00.000Z → "2025-09-15T16:30:00-05:00"
const startDateTime = googleCalendarService.buildGoogleDateTime(fecha, hora_inicio);
```

## Manejo de errores

| Error | HTTP | Acción |
|-------|------|--------|
| `GOOGLE_NOT_CONFIGURED` | 503 | Variables de entorno faltantes |
| `GOOGLE_NOT_CONNECTED` | 503 | Cuenta no autorizada |
| `GOOGLE_OAUTH_STATE_INVALID` | 400 | State CSRF inválido/expirado |
| `GOOGLE_AUTH_FAILED` | 400 | Error de autenticación con Google |
| `CALENDAR_CREATE_ERROR` | 502 | Error al crear evento |
| `CALENDAR_UPDATE_ERROR` | 502 | Error al actualizar evento |
| `CALENDAR_NOT_FOUND` | 404 | Calendario no encontrado |
| `AGENDA_CANCELADA` | 409 | No se puede sincronizar agenda cancelada |
| `ASESOR_SIN_CORREO` | 400 | Agenda sin correo de asesor |

## Tabla `google_oauth_tokens`

```sql
CREATE TABLE google_oauth_tokens (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date   BIGINT,
  updated_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
```

## Columnas de sync en `agendas`

```sql
calendar_event_id    TEXT       -- ID del evento en Google Calendar
calendar_meet_link   TEXT       -- URL de Google Meet
calendar_sync_status TEXT       -- SYNCED | ERROR | DISABLED
calendar_sync_error  TEXT       -- Mensaje de error (si status = ERROR)
```

## Tests

```bash
npx vitest run backend/src/integrations/google/__tests__/googleCalendar.test.ts
```

13 tests cubren:
- `toTimeString`: string, Date objects, medianoche
- `buildGoogleDateTime`: offset -05:00, Date objects
- `buildEventoFromAgenda`: campos obligatorios, optativos, null, Date objects
- `isConfigured`: variables de entorno
- `CalendarServiceError`: propiedades
