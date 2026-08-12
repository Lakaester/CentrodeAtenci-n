# ADR-005: Integration Registry

**Fecha:** 2026-07-18

**Contexto:** COPE necesita conectar múltiples sistemas externos sin acoplar el código a implementaciones concretas.

**Decisión:** Se crea un Integration Registry. Cada sistema externo es un Adapter. El sistema nunca conoce implementaciones concretas.

**Consecuencias:** Agregar una integración nueva = crear Adapter + registrarlo. No se modifica el resto del sistema.
