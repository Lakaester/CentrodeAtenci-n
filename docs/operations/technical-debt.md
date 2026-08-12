# Technical Debt Report — Hardening 2

## Deuda Crítica

| Item | Impacto | Tiempo estimado |
|---|---|---|
| `dashboard.service.ts` God Service (15 métodos) | Alto | 4h |
| Duplicación `domain/` vs `core/` | Alto | 8h |
| Sin tests de integración | Alto | 16h |

## Deuda Alta

| Item | Impacto | Tiempo estimado |
|---|---|---|
| Sin autenticacíón obligatoria en endpoints | Alto | 8h |
| SQL crudo sin tipos (Prisma como ancla) | Medio | 4h |
| Zendesk rate limit sin cola de persistencia | Medio | 4h |

## Deuda Media

| Item | Impacto | Tiempo estimado |
|---|---|---|
| Sin barrel exports en módulos legacy | Bajo | 2h |
| Nombres mixtos español/inglés | Bajo | 2h |
| Documentación arquitectónica parcial | Bajo | 4h |

## Deuda Baja

| Item | Impacto | Tiempo estimado |
|---|---|---|
| 22 ADRs sin diagramas | Bajo | 2h |
| Sin webhooks para eventos | Bajo | 4h |
| Sin exportación de métricas a Prometheus | Bajo | 4h |
