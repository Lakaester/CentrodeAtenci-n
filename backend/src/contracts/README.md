# contracts

## Responsabilidad
Define las interfaces (puertos) que el dominio necesita y que la infraestructura debe implementar. Sigue el principio de Inversión de Dependencias (DIP): el dominio depende de interfaces, no de implementaciones concretas.

## Estructura
- `repositorios/` — interfaces para persistencia (ICasoRepository, IClienteRepository, etc.)
- `servicios/` — interfaces para servicios externos (IWhatsAppService, IZendeskService, etc.)
- `adapters/` — interfaces para utilidades de infraestructura (IFileStorage, IEmailSender, etc.)

## Principios
- Cada interfaz define UN SOLO contrato (Interface Segregation)
- Los métodos retornan tipos del dominio, no tipos de infraestructura
- Las implementaciones concretas estarán en `adapters/` y en los repositorios de infraestructura

## Estado actual
🧭 Por implementar — estructura de carpeta creada
