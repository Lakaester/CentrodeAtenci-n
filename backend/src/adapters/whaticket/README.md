# adapters/whaticket

## Responsabilidad
Adapter de integración con Whaticket (WhatsApp Business API). Implementa `IWhatsAppService` del contrato.

## Qué implementará
- `WhaticketAdapter implements IWhatsAppService`
- Envío y recepción de mensajes de WhatsApp
- Webhook para mensajes entrantes
- Mapeo entre conversaciones de Whaticket y `Caso`/`Mensaje` del dominio

## Dependencias
- `contracts/servicios/IWhatsAppService`
- Whaticket API (webhooks, REST endpoints)

## Relación con el dominio
- Un mensaje entrante de Whaticket crea/actualiza un `Caso`
- Un `Mensaje` enviado por el asesor se traduce a un mensaje de WhatsApp

## Estado actual
🧭 Por implementar — estructura de carpeta creada
