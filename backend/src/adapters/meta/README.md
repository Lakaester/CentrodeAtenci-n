# adapters/meta

## Responsabilidad
Adapter de integración con Meta Business API (Facebook/Instagram). Implementa `IMetaService` del contrato.

## Qué implementará
- `MetaAdapter implements IMetaService`
- Envío y recepción de mensajes a través de Messenger/Instagram
- Webhook para mensajes entrantes
- Gestión de templates y mensajes automatizados

## Dependencias
- `contracts/servicios/IMetaService`
- Meta Business SDK / Graph API

## Relación con el dominio
- Un mensaje entrante de Meta crea/actualiza un `Caso`
- Un `Mensaje` del dominio se envía a través de Meta API

## Estado actual
🧭 Por implementar — estructura de carpeta creada
