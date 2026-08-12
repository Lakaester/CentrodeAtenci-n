# ADR-007: Customer Workspace como punto único de operación

**Fecha:** 2026-07-18

**Contexto:** Los asesores necesitan un punto de entrada único para trabajar con un cliente, sin navegar directamente hacia Providers o integraciones.

**Decisión:** Se crea el Customer Workspace como interfaz principal. El asesor nunca abandona el contexto del cliente. Todas las acciones (logs, flags, diagnóstico) se ejecutan desde aquí.

**Consecuencias:** Providers quedan ocultos detrás del Workspace. El asesor solo necesita el dominio para operar.
