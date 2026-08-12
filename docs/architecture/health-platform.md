# Health Monitoring Platform

## Objetivo

Monitorear el estado operativo de todos los componentes de COPE mediante contratos estandarizados, sin depender de herramientas externas.

## Estados

| Estado | Significado |
|---|---|
| HEALTHY | Funcionando correctamente |
| DEGRADED | Funcionando con limitaciones |
| WARNING | Problema no crítico detectado |
| UNHEALTHY | Componente fuera de servicio |
| OFFLINE | Componente no disponible |
| UNKNOWN | Estado no determinado |

## Componentes

| Componente | Responsabilidad |
|---|---|
| HealthRegistry | Registra todos los health checks |
| HealthAggregator | Consolida resultados en un HealthReport |
| HeartbeatService | Emite heartbeats periódicos |
| MetricsCollector | Recolecta métricas de componentes |
| DiagnosticsEngine | Ejecuta diagnósticos profundos |
