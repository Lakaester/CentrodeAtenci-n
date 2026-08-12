# Frozen Inventory v1.0

## Core Components (congelados)

| ID | Componente | Ruta |
|---|---|---|
| CORE-01 | EventBus | `core/events/` |
| CORE-02 | Workflow Engine | `core/workflows/` |
| CORE-03 | Decision Engine | `core/decision-engine/` |
| CORE-04 | Knowledge Platform | `core/knowledge/` |
| CORE-05 | Configuration Platform | `core/configuration/` |
| CORE-06 | Health Platform | `core/health/` |
| CORE-07 | Plugin SDK | `core/plugins/` |
| CORE-08 | Case Manager | `core/cases/` |
| CORE-09 | Customer Resolver | `core/customer/` |
| CORE-10 | Integration Registry | `core/integrations/` |
| CORE-11 | Orchestrators | `core/orchestrators/` |
| CORE-12 | Observability | `core/observability/` |
| CORE-13 | Security | `core/security/` |
| CORE-14 | Cache | `core/cache/` |
| CORE-15 | Persistence | `core/persistence/` |
| CORE-16 | Errors | `core/errors/` |

## Public Contracts (congelados)

| Contrato | Tipo |
|---|---|
| `IntegrationAdapter` | Interface |
| `IPluginSDK` | Interface |
| `IRule` | Interface |
| `IOrchestrator` | Interface |
| `ICacheService` | Interface |
| `IPersistenceAdapter` | Interface |
| `EventEnvelope` | DTO público |
| `CustomerContext` | DTO público |
| `HealthReport` | DTO público |
| `ConfigurationEntry` | DTO público |

## Active Modules (extensibles)

| Módulo | Ruta |
|---|---|
| Search | `modules/search/` |
| Operations | `modules/operations/` |
| Printer | `integrations/printer/` |
