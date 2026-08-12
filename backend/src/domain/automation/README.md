# @deprecated — Módulo Automation

Este módulo ha sido reemplazado por:

- `src/core/workflows/` — Motor de workflows versionable con steps, ejecución y métricas
- `src/core/automation/` — ActionRegistry para automatizaciones

**Motivo:** La implementación en `core/` tiene controllers, routes, registro en el router principal y soporte completo de ejecución. Este módulo era un borrador temprano.

**Plan de eliminación:** Se eliminará en M2. No mover imports nuevos hacia acá.
