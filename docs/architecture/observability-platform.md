# Observability Platform

## Modelo unificado

Todo evento de observabilidad sigue este contrato:

```typescript
interface ObservableEvent {
  id: string;
  type: "domain" | "platform" | "infrastructure";
  source: string;
  version: string;
  correlationId: string;
  requestId: string;
  timestamp: string;
  payload: unknown;
}
```

## Canales

| Canal | Propósito | Almacenamiento |
|---|---|---|
| Logger | Logs estructurados por nivel | Consola + archivo |
| Audit | Operaciones modificadoras | JSON file |
| Timeline | Eventos funcionales del cliente | JSON file |
| Health | Estado de componentes | En memoria |
| Metrics | KPIs numéricos | En memoria |

## Integración futura

- OpenTelemetry: exportador de trazas
- Prometheus: exportador de métricas
- Grafana: dashboards desde Health API
