# contracts/repositorios

## Responsabilidad
Interfaces para los repositorios de persistencia. Cada interfaz define las operaciones que el dominio puede realizar sobre los datos.

## Interfaces
| Interfaz | Métodos principales |
|----------|-------------------|
| `ICasoRepository` | findById, findAll, save, update, delete, findByFilters, findByCliente |
| `IClienteRepository` | findById, findByEmail, findByDominio, search, save, update |
| `IUsuarioRepository` | findById, findByEmail, findByRol, save, update |
| `IMensajeRepository` | findByCasoId, save, markAsRead |
| `ITimelineRepository` | findByCasoId, save, getCurrentStep |
| `ICategoriaRepository` | findAll, findById, findByNombre, save |

## Ejemplos
```ts
interface ICasoRepository {
  findById(id: string): Promise<Caso | null>;
  findAll(filters?: FiltrosCaso): Promise<Caso[]>;
  save(caso: Caso): Promise<void>;
  update(id: string, data: Partial<Caso>): Promise<void>;
}
```

## Estado actual
🧭 Por implementar — estructura de carpeta creada
