# ADR-021: Architecture Freeze v1.0

**Fecha:** 2026-07-18
**Estado:** Oficial

## Contexto

COPE ha completado 21 versiones, 2 sprints de hardening, una auditoría arquitectónica M1, un Gate Review M2 (GO with observations), y la construcción de la plataforma Core.

A partir de este momento la arquitectura Core queda oficialmente congelada. El desarrollo se enfocará en módulos funcionales y capacidades de negocio.

## Decisión

Se declara Architecture Freeze v1.0 sobre los siguientes componentes:

## Componentes congelados

| Componente | Estado | Modificable solo con ADR |
|---|---|---|
| EventBus | 🔒 Congelado | Sí |
| Workflow Engine | 🔒 Congelado | Sí |
| Decision Engine | 🔒 Congelado | Sí |
| Knowledge Platform | 🔒 Congelado | Sí |
| Configuration Platform | 🔒 Congelado | Sí |
| Health Platform | 🔒 Congelado | Sí |
| Plugin SDK | 🔒 Congelado | Sí |
| Case Manager | 🔒 Congelado | Sí |
| Customer Resolver | 🔒 Congelado | Sí |
| Contratos públicos (interfaces, DTOs) | 🔒 Congelado | Sí |

## Reglas de modificación del Core

El Core solo podrá modificarse cuando exista:

1. Bug crítico.
2. Vulnerabilidad de seguridad.
3. Problema severo de performance.
4. Cambio arquitectónico aprobado mediante ADR.
5. Cambio requerido por compatibilidad.

## Proceso de aprobación

Toda modificación arquitectónica requiere:
1. ADR documentando contexto, decisión y consecuencias.
2. Engineering Gate aprobado.
3. Architecture Review por ARB.
4. Rollback documentado.
5. Impact Assessment.

## Consecuencias

- Toda nueva funcionalidad va a `modules/`, nunca a `core/`.
- Las integraciones van a `integrations/`.
- Los adaptadores van a `adapters/`.
- El Core solo recibe mantenimiento.

## Excepciones

- Parches de seguridad: pueden aplicarse sin ADR, pero deben documentarse a posteriori.
- Bugs críticos: pueden corregirse sin ADR, pero deben documentarse en CHANGELOG.
