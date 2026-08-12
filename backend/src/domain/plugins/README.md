# @deprecated — Módulo Plugins

Este módulo ha sido reemplazado por:

- `src/core/plugins/` — PluginManager, PluginSDK, LifecycleManager, CapabilityResolver

**Motivo:** La implementación en `core/` tiene controllers, routes, SDK público con 9 interfaces, ciclo de vida completo y está registrada en el router principal.

**Plan de eliminación:** Se eliminará en M2.
