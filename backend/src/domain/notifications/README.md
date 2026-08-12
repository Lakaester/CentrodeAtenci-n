# Notification Engine

## ¿Qué es?
El **Notification Engine** es el responsable de generar, administrar y distribuir todas las notificaciones del sistema. Centraliza la lógica de qué notificar, a quién, por qué canal y con qué prioridad.

## Canales soportados

| Canal | Estado | Propósito |
|-------|--------|-----------|
| InApp | ✅ Por defecto | Notificaciones dentro de la interfaz de COPE |
| Email | 🔴 Sin implementar | Correos electrónicos transaccionales |
| WhatsApp | 🔴 Sin implementar | Mensajes de WhatsApp |
| Push | 🔴 Sin implementar | Notificaciones push mobile |
| Webhook | 🔴 Sin implementar | Webhooks a sistemas externos |
| Slack | 🔴 Sin implementar | Mensajes a canales de Slack |
| Teams | 🔴 Sin implementar | Mensajes a Microsoft Teams |

## Reglas de notificación (8 predefinidas)

| Regla | Prioridad | Canales | Cooldown |
|-------|-----------|---------|----------|
| SLA por vencer | alta | inapp, email | 10 min |
| SLA vencido | crítica | inapp, email, push | 5 min |
| High Touch esperando | alta | inapp | 2 min |
| Cliente respondió | alta | inapp, push | 1 min |
| Caso reasignado | media | inapp | 0 |
| Caso resuelto | media | inapp | 0 |
| Error de integración | alta | inapp, slack | 5 min |
| Supervisor requerido | crítica | inapp, email, slack | 2 min |

## Integración con otros motores

| Motor | Dispara notificaciones cuando... |
|-------|----------------------------------|
| **Case Engine** | SLA se vence, caso se reasigna, caso se resuelve |
| **Timeline Engine** | Cliente responde, hay un nuevo evento |
| **AI Orchestrator** | IA detecta un riesgo |
| **Workspace Engine** | Se requiere intervención del supervisor |
| **Centro de Operaciones** | Hay un incremento anormal en una categoría |

## Componentes

| Archivo | Responsabilidad |
|---------|----------------|
| `Notification.ts` | Modelo de notificación: 14 campos, estados, marcado como leída |
| `NotificationPriority.ts` | 4 niveles: baja, media, alta, crítica (con timeout por nivel) |
| `NotificationChannel.ts` | 7 canales con configuración y estado |
| `NotificationTemplate.ts` | Plantillas con variables `{{}}` para asesor/supervisor/admin |
| `NotificationRule.ts` | 14 tipos de reglas, cooldown, canales destino |
| `NotificationFactory.ts` | Fábrica: 8 reglas, 5 canales, 3 plantillas por defecto |
| `NotificationEngine.ts` | Orquestador: notificar, evaluar reglas, filtrar, cooldown |
| `contracts/INotificationProvider.ts` | Contrato: enviar, obtenerEstado, marcarLeida |

## Ejemplo de uso

```ts
const engine = new NotificationEngine();
engine.inicializar();

// Notificación directa
engine.notificar({
  titulo: "SLA vencido",
  descripcion: "El caso CASO-001 tiene el SLA vencido",
  tipo: "sla_vencido",
  prioridad: "critica",
  destinatarioId: "USR-001",
  origen: "CaseEngine",
  casoId: "CASO-001",
});

// Evaluación automática de reglas
engine.evaluarReglas({ tipo: "cliente_respondio", metadata: { casoId: "CASO-001" } });

// Consultar no leídas
const pendientes = engine.obtenerNoLeidas();
```
