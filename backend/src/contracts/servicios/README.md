# contracts/servicios

## Responsabilidad
Interfaces para servicios externos que el sistema necesita consumir. Cada interfaz abstrae un servicio específico detrás de un contrato común.

## Interfaces
| Interfaz | Métodos principales | Servicio real |
|----------|-------------------|---------------|
| `IWhatsAppService` | sendMessage, receiveMessage, getStatus | Whaticket API |
| `IZendeskService` | createTicket, getTicket, updateTicket | Zendesk API |
| `IMetaService` | sendMessage, receiveMessage | Meta Business API |
| `IMicroserviceClient` | getConfiguracion, updateConfiguracion | Microservice interno |
| `IRestafactClient` | getCDT, getCertificado, getComprobantes | Restafact API |

## Ejemplos
```ts
interface IWhatsAppService {
  sendMessage(to: string, content: string): Promise<{ messageId: string }>;
  getStatus(messageId: string): Promise<'sent' | 'delivered' | 'read'>;
}
```

## Estado actual
🧭 Por implementar — estructura de carpeta creada
