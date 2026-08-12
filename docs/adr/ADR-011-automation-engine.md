# ADR-011: Automation Engine

**Fecha:** 2026-07-18

**Contexto:** COPE necesita ejecutar acciones automáticas en respuesta a eventos del sistema.

**Decisión:** Se crea el AutomationEngine que escucha eventos del EventBus, evalúa reglas (definidas en YAML/JSON) y ejecuta acciones registradas en el ActionRegistry.

**Consecuencias:** Las automatizaciones son configurables sin modificar código.
