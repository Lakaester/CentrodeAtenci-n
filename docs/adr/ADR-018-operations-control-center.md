# ADR-018: Operations Control Center como módulo de supervisión operativa

**Fecha:** 2026-07-18

**Contexto:** Supervisores y líderes operativos necesitaban una consola unificada para monitorear la plataforma sin depender de herramientas externas.

**Decisión:** Se crea el Operations Control Center como un Business Module que consume interfaces públicas del Core. No agrega lógica al Core. Dashboard modular basado en widgets.

**Consecuencias:** El OCC consume Health Platform, Case Management y EventBus. Preparado para WebSockets futuros.
