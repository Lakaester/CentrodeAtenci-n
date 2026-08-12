# ADR-009: Decision Engine como capa de diagnóstico determinístico

**Fecha:** 2026-07-18

**Contexto:** Los datos obtenidos por los Providers necesitan ser transformados en conclusiones y recomendaciones accionables para el asesor.

**Decisión:** Se crea el Decision Engine basado en reglas declarativas, versionadas, auditables y sin IA. Cada regla es una clase independiente registrada en un RuleRegistry. El motor evalúa condiciones sobre un contexto y produce un DecisionResult.

**Consecuencias:** Las decisiones son trazables y explicables. Agregar una regla nueva no modifica el motor.
