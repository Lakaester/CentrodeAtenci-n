# usecases/categorias

## Responsabilidad
Casos de uso para la gestión de la taxonomía de categorías y la sugerencia inteligente de categorías basada en el contenido del caso.

## Casos de uso
| Use case | Input | Output | Descripción |
|----------|-------|--------|-------------|
| `obtenerCategorias` | — | Categoria[] | Lista completa de categorías |
| `sugerirCategoria` | casoId | Sugerencia { categoria, confianza } | Sugiere categoría basada en reglas de negocio |
| `asignarCategoria` | casoId, categoriaId | void | Asigna categoría a un caso |

## Dependencias
- `domain/categorias/` — Categoria, Subcategoria, ConfianzaDiagnostico
- `domain/casos/` — asignación al caso
- `contracts/repositorios/ICategoriaRepository`

## Estado actual
🧭 Por implementar — estructura de carpeta creada
