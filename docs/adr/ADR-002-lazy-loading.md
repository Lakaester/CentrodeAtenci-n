# ADR-002: Lazy Loading en integraciones

**Fecha:** 2026-07-18

**Contexto:** Las integraciones no deben ejecutarse automáticamente al abrir una pantalla.

**Decisión:** Toda integración se ejecuta únicamente bajo demanda del usuario. Queda prohibido polling, auto-carga y background refresh.

**Consecuencias:** Cada operación requiere una acción explícita del usuario. Mayor control, menor consumo de API.
