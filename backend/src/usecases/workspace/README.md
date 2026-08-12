# usecases/workspace

## Responsabilidad
Casos de uso para obtener la configuración del workspace adaptativo según la categoría del caso.

## Casos de uso
| Use case | Input | Output | Descripción |
|----------|-------|--------|-------------|
| `obtenerWorkspace` | categoriaId | WorkspaceConfig | Widgets, checklist y accesos de la categoría |
| `obtenerWidgets` | categoriaId | Widget[] | Datos de cada widget (consulta a herramientas) |

## Dependencias
- `domain/workspace/` — WorkspaceConfig, Widget
- `domain/herramientas/` — herramientas disponibles
- `domain/categorias/` — taxonomía
- `contracts/repositorios/IWorkspaceRepository`

## Estado actual
🧭 Por implementar — estructura de carpeta creada
