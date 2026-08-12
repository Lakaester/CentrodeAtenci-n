# usecases/casos

## Responsabilidad
Casos de uso de la aplicación relacionados con la gestión del ciclo de vida de un caso. Cada use case orquesta entidades del dominio y repositorios para ejecutar una operación completa.

## Casos de uso
| Use case | Input | Output | Descripción |
|----------|-------|--------|-------------|
| `crearCaso` | datos del ticket + clienteId | Caso | Crea un nuevo caso a partir de un ticket entrante |
| `asignarCaso` | casoId, usuarioId | void | Asigna un caso a un asesor |
| `cambiarEstado` | casoId, nuevoEstado, usuarioId | void | Avanza el flujo del caso y registra timeline |
| `obtenerCaso` | casoId | CasoCompleto | Caso con timeline, mensajes y cliente |
| `buscarCasos` | filtros | Caso[] | Búsqueda con filtros (estado, canal, prioridad) |
| `resolverCaso` | casoId, resultado | void | Marca caso como resuelto y dispara eventos |

## Dependencias
- `domain/casos/` — entidad Caso, Estados, Prioridad
- `domain/timeline/` — registro de eventos
- `domain/eventos/` — emisión de eventos
- `contracts/repositorios/ICasoRepository`
- `contracts/repositorios/ITimelineRepository`

## Estado actual
🧭 Por implementar — estructura de carpeta creada
