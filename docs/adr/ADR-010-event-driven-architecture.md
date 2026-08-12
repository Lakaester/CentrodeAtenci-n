# ADR-010: Event-Driven Architecture

**Fecha:** 2026-07-18

**Contexto:** Los módulos necesitan comunicarse sin acoplamiento directo.

**Decisión:** Se implementa un EventBus asincrónico con EventEnvelope estandarizado. Todo evento tiene eventId, correlationId, version, timestamp, payload y metadata.

**Consecuencias:** Los módulos se comunican mediante eventos. El AutomationEngine puede reaccionar a eventos sin modificar los publishers.
