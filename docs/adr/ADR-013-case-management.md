# ADR-013: Case Management como modelo operativo de COPE

**Fecha:** 2026-07-18

**Contexto:** Los tickets en sistemas externos (Zendesk, Whaticket, Meta) no representan el ciclo completo de resolución. COPE necesita su propio modelo de caso con trazabilidad, SLA y workflow independiente.

**Decisión:** Se crea el Case Management con estados propios (Nuevo → ... → Cerrado), workflow con transiciones validadas, SLA por prioridad, historial completo y reportes.

**Consecuencias:** Cada caso es independiente del ticket externo. Un caso puede involucrar múltiples providers. Todo cambio queda registrado en el historial.
