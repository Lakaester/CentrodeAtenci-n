# Observability

## Principios

1. Toda operación queda registrada (Logger).
2. Toda modificación queda auditada (Audit).
3. Todo cambio es reversible (Rollback).
4. Toda versión tiene release notes (Release).
5. Todo servicio expone salud (Health).
6. Todo evento funcional queda en timeline (Timeline).

## Flujo

```
Operación
    ↓
Logger.info(requestId, acción, duración)
    ↓
AuditService.record(usuario, acción, resultado)  ← solo modificaciones
    ↓
TimelineService.add(dominio, evento)              ← solo eventos funcionales
```

## Herramientas futuras

- Métricas (Prometheus)
- Trazabilidad distribuida (OpenTelemetry)
- Dashboards (Grafana)
