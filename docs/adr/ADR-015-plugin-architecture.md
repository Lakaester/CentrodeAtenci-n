# ADR-015: Plugin Architecture

**Fecha:** 2026-07-18

**Contexto:** COPE necesita ser extensible sin modificar el core. Las nuevas capacidades deben poder incorporarse mediante plugins registrados sobre interfaces públicas.

**Decisión:** Se crea el Plugin System con PluginManager, PluginRegistry, CapabilityResolver, LifecycleManager y PluginSDK. El core nunca conoce implementaciones concretas. Los plugins consumen únicamente el SDK oficial.

**Consecuencias:** Agregar una nueva capacidad = crear un plugin + registrarlo. El core no se modifica. Preparado para Marketplace futuro.
