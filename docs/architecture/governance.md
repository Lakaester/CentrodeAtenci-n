# Governance Rules v1.0

## Core Protection

El Core (componentes congelados) NO puede modificarse sin:

1. ADR aprobado.
2. Engineering Gate.
3. Architecture Review.
4. Rollback documentado.
5. Impact Assessment.

## Development Rules

| Regla | Descripción |
|---|---|
| Nuevas funcionalidades | Van a `modules/`, no a `core/` |
| Nuevas integraciones | Van a `integrations/` |
| Nuevos adaptadores | Van a `adapters/` |
| Modificaciones al Core | Solo bugs críticos, seguridad o ADR |
| Contratos públicos | No se modifican sin ADR |
| Eventos públicos | No se modifican sin ADR |

## Process

```
Feature Request → Impact Assessment → ADR → Engineering Gate → Architecture Review → Implementation → Rollback Plan
```
