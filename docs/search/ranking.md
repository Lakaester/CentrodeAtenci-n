# Ranking

## Estrategia

Cada resultado recibe un puntaje basado en reglas acumulativas. Mayor puntaje = mayor relevancia.

## Reglas

| Regla | Puntos | Descripción |
|---|---|---|
| type-match | 30 | El tipo fue detectado correctamente |
| has-data | 20 | El resultado tiene información completa |
| source-memory | 25 | Proviene de CustomerMemory (alta confianza) |
| source-zendesk | 15 | Proviene de Zendesk |

## Extensibilidad

Para agregar una regla nueva:

```typescript
RULES.push({
  name: "my-rule",
  apply: (result) => (condition ? 10 : 0),
});
```
