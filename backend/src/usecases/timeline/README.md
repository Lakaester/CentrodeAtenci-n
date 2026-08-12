# usecases/timeline

## Responsabilidad
Casos de uso para registrar y consultar el timeline de eventos de un caso.

## Casos de uso
| Use case | Input | Output | Descripción |
|----------|-------|--------|-------------|
| `registrarEvento` | casoId, estado, usuarioId, comentario | EventoTimeline | Agrega un evento al timeline del caso |
| `obtenerTimeline` | casoId | EventoTimeline[] | Todos los eventos ordenados cronológicamente |
| `obtenerProgreso` | casoId | Progreso | Paso actual del flujo (Identificación → Cierre) |

## Dependencias
- `domain/timeline/` — EventoTimeline, EstadoTimeline
- `domain/eventos/` — emisión de eventos
- `contracts/repositorios/ITimelineRepository`

## Estado actual
🧭 Por implementar — estructura de carpeta creada
