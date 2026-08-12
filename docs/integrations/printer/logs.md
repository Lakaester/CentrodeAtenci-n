# Logs de Error

## GET /api/rest/obtenerErrorLogs

Obtiene el contenido de los archivos de log del servicio local.

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `numeroLineas` | number | Sí | Cantidad de líneas a devolver |
| `tipoArchivo` | string | Sí | `controlado` o `nocontrolado` |

### Valores conocidos de `tipoArchivo`

| Valor | Descripción |
|---|---|
| `controlado` | Errores esperados y manejados por el sistema |
| `nocontrolado` | Errores inesperados (excepciones no capturadas) |

### Respuesta

```json
{
  "contenido": "2026-07-17 10:00:00 ERROR: timeout\n2026-07-17 10:00:05 INFO: retry...",
  "lineasDevueltas": 50,
  "nombreArchivo": "error.log",
  "rutaCompleta": "/var/log/printer/error.log",
  "totalLineas": 1200,
  "tipoArchivo": "controlado",
  "tamañoArchivo": 45820
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `contenido` | string | Contenido del log (últimas N líneas) |
| `lineasDevueltas` | number | Líneas realmente devueltas |
| `nombreArchivo` | string | Nombre del archivo |
| `rutaCompleta` | string | Ruta absoluta en el servidor |
| `totalLineas` | number | Total de líneas del archivo |
| `tipoArchivo` | string | Tipo solicitado |
| `tamañoArchivo` | number | Tamaño en bytes |
