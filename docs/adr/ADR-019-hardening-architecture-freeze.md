# ADR-019: Hardening — Congelamiento de Arquitectura

**Fecha:** 2026-07-18

## Decisión

Se oficializa que toda nueva funcionalidad debe desarrollarse utilizando la arquitectura moderna (`core/`, `modules/`, `integrations/`). La arquitectura legacy (`domain/`, `application/`, `adapters/`) queda en modo "solo mantenimiento".

## Responsabilidades por capa

| Capa | Responsabilidad |
|---|---|
| `domain/` | Entidades, Value Objects, Servicios de Dominio, Interfaces de Repositorio |
| `application/` | Use Cases, DTOs, Policies, Orquestación |
| `core/` | EventBus, Logger, Audit, Timeline, Workflow, Health, Configuration, Plugins |
| `modules/` | Funcionalidades de negocio, casos de uso específicos |
| `integrations/` | Integraciones externas (Printer, etc.) |
| `adapters/` | Adaptadores externos (AI, Notificaciones) |

## Estrategia de migración

1. Las nuevas funcionalidades van a `core/`, `modules/` o `integrations/`.
2. `domain/` y `application/` reciben solo mantenimiento correctivo.
3. En M3 se evaluará la eliminación de `domain/` legacy duplicado.

## Consecuencias

- Breaking changes: ninguno.
- Compatibilidad: total.
- Roadmap: PI-3, PI-4, PI-5 sobre arquitectura moderna.
