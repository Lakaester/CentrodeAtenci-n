# Feature Flags

## GET /api/rest/featureflags/listar

Devuelve la lista completa de feature flags del servicio local.

### Petición

```
GET https://printer.restaurant.pe/ngrok
Body: { ... parametros de ruteo ... path: "/api/rest/featureflags/listar", method: "GET" }
```

### Respuesta

```json
{
  "flags": [
    {
      "nombre": "app.impresion.directa",
      "descripcion": "Habilita impresión directa sin previsualización",
      "habilitado": true,
      "enArchivo": true
    }
  ]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `flags` | array | Lista de feature flags |
| `nombre` | string | Identificador único del flag |
| `descripcion` | string | Descripción funcional |
| `habilitado` | boolean | Estado actual del flag |
| `enArchivo` | boolean | Indica si persiste en archivo de configuración |

## POST /api/rest/featureflags/actualizar

Actualiza el estado de un feature flag.

### Petición

```json
{
  "nombreFlag": "app.impresion.directa",
  "habilitado": true
}
```

### Flujo

1. COPE envía la petición al gateway.
2. El gateway la redirige al servicio local.
3. El servicio local actualiza el flag en su archivo de configuración.
4. Responde con el estado actualizado.
