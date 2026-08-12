# ADR-014: Workflow Engine como motor de procesos de COPE

**Fecha:** 2026-07-18

**Contexto:** Los procesos operativos del equipo de Soporte Especializado estaban codificados directamente en componentes UI o no estaban modelados.

**Decisión:** Se crea el Workflow Engine con definiciones versionables, steps (manual, automático, condicional, paralelo, aprobación, espera, notificación, validación), ejecución de instancias, history y métricas.

**Consecuencias:** Los procesos existen como entidades del dominio, no como código UI. Cada workflow es versionable, auditable y genera métricas.
