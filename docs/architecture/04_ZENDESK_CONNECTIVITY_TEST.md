# Zendesk Connectivity Test

## Sprint 39.1

### Objetivo

Validar la conectividad entre COPE Backend y la API oficial de Zendesk.

---

## Endpoint

```
GET /api/zendesk/test
```

Consume `GET /api/v2/users/me.json` de Zendesk y retorna información del usuario autenticado.

---

## Configuración

```env
ZENDESK_SUBDOMAIN = "midominio"
ZENDESK_EMAIL     = "cope@midominio.com"
ZENDESK_API_TOKEN = "tu_token_api"
```

---

## Respuesta exitosa

```json
{
  "ok": true,
  "conectado": true,
  "data": {
    "id": 123456,
    "nombre": "Agente COPE",
    "correo": "cope@midominio.com",
    "rol": "agent",
    "organizacion": "Org #789"
  },
  "timingMs": 342,
  "mensaje": "Conexión exitosa con Zendesk. Usuario autenticado: Agente COPE"
}
```

---

## Respuesta con error

```json
{
  "ok": false,
  "conectado": false,
  "error": {
    "code": "AUTH_ERROR",
    "message": "Credenciales inválidas. Verificar ZENDESK_EMAIL y ZENDESK_API_TOKEN.",
    "httpStatus": 401
  },
  "timingMs": 120
}
```

---

## Códigos de error

| Código | HTTP | Significado |
|--------|------|-------------|
| `MISSING_CONFIG` | — | Faltan variables de entorno |
| `AUTH_ERROR` | 401 | Credenciales inválidas |
| `FORBIDDEN` | 403 | Sin permisos |
| `NOT_FOUND` | 404 | Subdominio incorrecto |
| `RATE_LIMIT` | 429 | Demasiadas peticiones |
| `API_ERROR` | varios | Error genérico |
| `NETWORK_ERROR` | — | Error de conexión |

---

## Logs

```
[ZendeskTest] /users/me — 200 — 342ms — OK (Agente COPE)
[ZendeskTest] /users/me — 401 — 120ms — ERROR
```

---

## Validación

```
http://localhost:4000/api/zendesk/test
```

Debe retornar información real del usuario autenticado en Zendesk.

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprint 39.1 — Zendesk Connectivity*
