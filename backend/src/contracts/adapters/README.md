# contracts/adapters

## Responsabilidad
Interfaces para servicios de infraestructura general que no pertenecen a un dominio específico pero son necesarios para la operación del sistema.

## Interfaces
| Interfaz | Métodos | Propósito |
|----------|---------|-----------|
| `IFileStorage` | upload, download, delete, getUrl | Almacenamiento de archivos (evidencias, capturas) |
| `IEmailSender` | send(to, subject, body) | Envío de correos transaccionales |
| `ICacheProvider` | get, set, del, flush | Cache distribuido (Redis) |
| `IEventBus` | emit, on, off | Publicación/suscripción de eventos del dominio |

## Estado actual
🧭 Por implementar — estructura de carpeta creada
