# Gateway Printer

## Patrón de conexión

Todos los endpoints del gateway siguen el mismo patrón:

```
https://printer.restaurant.pe/ngrok
```

### Parámetros de ruteo

| Parámetro | Tipo | Descripción |
|---|---|---|
| `ip` | string | Dirección IP del servicio local |
| `puerto` | number | Puerto del servicio local |
| `dominio` | string | Dominio asociado al cliente |
| `local_id` | string | Identificador único del local |
| `device_id` | string | Identificador del dispositivo |

### Parámetros de petición

| Parámetro | Tipo | Descripción |
|---|---|---|
| `path` | string | Ruta del endpoint en el servicio local |
| `method` | string | Método HTTP (GET, POST, PUT, DELETE) |
| `body` | object | Cuerpo de la petición (opcional) |

### Ejemplo completo

```
POST https://printer.restaurant.pe/ngrok
Content-Type: application/json

{
  "ip": "192.168.1.100",
  "puerto": 3000,
  "dominio": "midominio.restaurant.pe",
  "local_id": "LOC-001",
  "device_id": "DEV-ABC123",
  "path": "/api/rest/featureflags/listar",
  "method": "GET"
}
```
