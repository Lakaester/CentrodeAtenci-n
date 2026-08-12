# ADR-001: Dominio como identidad del cliente

**Fecha:** 2026-07-18

**Contexto:** Cada cliente necesita ser identificado unívocamente en COPE para todas las integraciones.

**Decisión:** El dominio será el identificador único del cliente. El frontend nunca conocerá IP, puerto o device_id.

**Consecuencias:** Todas las integraciones deben recibir un CustomerContext resuelto desde el dominio.
