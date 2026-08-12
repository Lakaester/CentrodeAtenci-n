# usecases/mensajes

## Responsabilidad
Casos de uso para el envío y recepción de mensajes dentro de un caso.

## Casos de uso
| Use case | Input | Output | Descripción |
|----------|-------|--------|-------------|
| `enviarMensaje` | casoId, contenido, canal, emisor | Mensaje | Envía un mensaje a través del adapter correspondiente |
| `obtenerMensajes` | casoId | Mensaje[] | Todos los mensajes del caso ordenados |
| `marcarLeido` | mensajeId | void | Marca mensaje como leído |

## Dependencias
- `domain/mensajes/` — Mensaje, TipoMensaje
- `domain/eventos/` — emisión de eventos
- `contracts/repositorios/IMensajeRepository`
- `contracts/servicios/IWhatsAppService` (según canal)
- `contracts/servicios/IZendeskService` (según canal)

## Estado actual
🧭 Por implementar — estructura de carpeta creada
