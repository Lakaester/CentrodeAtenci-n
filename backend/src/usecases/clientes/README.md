# usecases/clientes

## Responsabilidad
Casos de uso para la gestión y consulta de clientes.

## Casos de uso
| Use case | Input | Output | Descripción |
|----------|-------|--------|-------------|
| `buscarCliente` | query (nombre, dominio, email, telefono, ruc) | Cliente[] | Búsqueda textual en múltiples campos |
| `obtenerCliente` | clienteId | ClienteCompleto | Cliente con datos, productos, configuraciones |
| `obtenerHistorial` | clienteId | Atencion[] | Últimas N atenciones del cliente |
| `actualizarCliente` | clienteId, datos | void | Actualiza datos del cliente |

## Dependencias
- `domain/clientes/` — entidad Cliente
- `contracts/repositorios/IClienteRepository`

## Estado actual
🧭 Por implementar — estructura de carpeta creada
