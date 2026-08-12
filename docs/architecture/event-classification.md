# Event Classification

## Categorías

| Categoría | Descripción | Ejemplos |
|---|---|---|
| **Domain Events** | Ocurren en el negocio | CustomerFound, CaseCreated, TicketResolved |
| **Platform Events** | Ocurren en la plataforma | HealthCheck, ConfigurationChanged, PluginInstalled |
| **Infrastructure Events** | Ocurren en la infraestructura | ProviderError, RateLimitExceeded, ConnectionLost |

## Formato

```typescript
interface Event {
  type: "domain" | "platform" | "infrastructure";
  source: string;        // módulo que emite
  version: string;       // semver del evento
  correlationId: string; // trazabilidad entre eventos relacionados
  requestId: string;     // petición HTTP que originó
  timestamp: string;     // ISO 8601
  payload: unknown;      // datos específicos del evento
}
```

## Eventos registrados

| Evento | Categoría | Versión |
|---|---|---|
| WorkspaceOpened | domain | 1.0 |
| CustomerFound | domain | 1.0 |
| LogsRequested | platform | 1.0 |
| DecisionGenerated | platform | 1.0 |
| ProviderError | infrastructure | 1.0 |
| ConfigurationChanged | platform | 1.0 |
