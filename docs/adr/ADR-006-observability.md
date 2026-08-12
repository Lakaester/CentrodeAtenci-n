# ADR-006: Observability

**Fecha:** 2026-07-18

**Contexto:** COPE necesita registrar, auditar y monitorear todas las operaciones.

**Decisión:** Se crean servicios transversales: PlatformLogger, AuditService, RollbackManager, HealthService, TimelineService.

**Consecuencias:** Toda operación queda registrada. Toda modificación queda auditada. Todo cambio es reversible.
