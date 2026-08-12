# Decision Engine

## Objetivo

Transformar datos obtenidos por los Providers en conclusiones, recomendaciones y diagnósticos determinísticos basados en reglas explícitas, trazables y versionadas. Sin IA.

## Principios

- Reglas declarativas
- Versionadas
- Auditables
- Explicables
- Probables automáticamente
- Desacopladas del código TypeScript

## Flujo

```
Provider Data (logs, flags, versions, etc.)
    │
    ▼
RuleEngine.evaluate(context)
    │
    ├── RuleRegistry.getRules() → todas las reglas registradas
    ├── Evaluator.test(rule, context) → true/false
    │
    ▼
DecisionResult { findings, risks, recommendations, confidence }
```

## Componentes

| Componente | Responsabilidad |
|---|---|
| RuleEngine | Orquesta la evaluación de reglas |
| RuleRegistry | Registro central de reglas |
| Evaluator | Evalúa condiciones de cada regla |
| Rule | Modelo de regla (id, condiciones, recomendaciones) |
| DecisionResult | Resultado consolidado del diagnóstico |
