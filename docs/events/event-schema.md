# Event Schema

## Envelope

```typescript
interface EventEnvelope {
  eventId: string;
  eventType: string;
  version: string;
  timestamp: string;
  requestId: string;
  correlationId: string;
  workspaceId?: string;
  customerId?: string;
  userId?: string;
  provider?: string;
  orchestrator?: string;
  payload: unknown;
  metadata: Record<string, unknown>;
  source: string;
  origin: string;
  severity: "info" | "warning" | "error";
}
```

## Reglas

- Todo evento debe incluir `eventId` único.
- Todo evento debe incluir `correlationId` para trazabilidad.
- `version` sigue semver.
- `severity` define el nivel de alerta.
