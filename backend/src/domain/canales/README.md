# Canal

## Objetivo
Define los canales de atención disponibles en COPE. Cada canal tiene su propia configuración, políticas de SLA y comportamiento específico.

## Responsabilidades
- Definir los tipos de canal soportados (WhatsApp, Meta, Zendesk, Correo)
- Almacenar configuración específica de cada canal (API keys, webhooks)
- Definir políticas de SLA por canal (WhatsApp: 15 min, Correo: 24h)
- Monitorear el estado de conexión de cada canal

## Relación con otras entidades
- **1:N con Caso** — un canal puede tener muchos casos
- **1:N con Conversacion** — un canal tiene muchas conversaciones
- **1:1 con SLAPolicy** — un canal tiene una política de SLA

## Flujo dentro de COPE
1. Los canales se configuran en la administración del sistema
2. Cuando llega un mensaje entrante, el adapter del canal correspondiente lo procesa
3. El canal determina la política de SLA aplicable al caso
4. El asesor ve el canal del caso en el header de la conversación

## Ejemplo práctico
```ts
const canal: Canal = {
  id: "CANAL-WHATSAPP",
  tipo: "whatsapp",
  nombre: "WhatsApp Principal",
  configuracion: {
    apiKey: "wa-xxx",
    webhookUrl: "https://cope.restaurant.pe/webhooks/whatsapp",
  },
  estado: "activo",
  politica: { slaMinutos: 15, horario: "24/7", tiempoMaximoRespuesta: 30 },
};
```
