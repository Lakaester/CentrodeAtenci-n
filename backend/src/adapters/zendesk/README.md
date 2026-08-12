# adapters/zendesk

## Responsabilidad
Adapter de integración con Zendesk API. Implementa `IZendeskService` del contrato. Traduce las operaciones del dominio a llamadas REST a la API de Zendesk.

## Qué implementará
- `ZendeskAdapter implements IZendeskService`
- Crear/actualizar/consultar tickets en Zendesk
- Sincronizar mensajes entre COPE y Zendesk
- Mapeo entre modelo de datos de Zendesk y dominio COPE

## Dependencias
- `contracts/servicios/IZendeskService`
- SDK/API de Zendesk

## Relación con el dominio
- Convierte un ticket de Zendesk a un `Caso` del dominio
- Convierte un `Mensaje` del dominio a un comment de Zendesk

## Estado actual
🧭 Por implementar — estructura de carpeta creada
