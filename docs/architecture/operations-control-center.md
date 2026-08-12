# Operations Control Center (OCC)

## Objetivo

Consola principal para supervisores y líderes operativos. Monitorea en tiempo real la operación de la plataforma, casos, workflows, providers, salud del sistema, eventos y métricas.

## Principios

- No agrega lógica al Core.
- Consume únicamente interfaces públicas.
- Dashboard modular basado en Widgets.
- Preparado para WebSockets futuros.

## KPIs

| KPI | Fuente |
|---|---|
| MTTR | Case Management (tiempo promedio de resolución) |
| MTTD | TimelineService (tiempo promedio de detección) |
| SLA | SLAService (% de casos dentro del SLA) |
| Health Score | Health Platform |
| Workflow Success Rate | Workflow Engine |
