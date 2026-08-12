# Universal Search

## Objetivo

El asesor escribe cualquier identificador y COPE detecta automáticamente el tipo, consulta los providers, fusiona resultados, aplica ranking y abre el Customer Workspace.

## Flujo

```
Usuario escribe "demo.restaurant.pe"
    │
    ▼
SearchEngine.detect("demo.restaurant.pe") → "domain"
    │
    ▼
SearchProvider.findByDomain("demo.restaurant.pe")
    ├── CustomerMemory → cliente existente
    ├── PrinterGateway → información del dispositivo
    └── Zendesk       → tickets relacionados
    │
    ▼
MergeEngine.merge(results) → eliminar duplicados
    │
    ▼
RankingEngine.rank(results) → priorizar completos
    │
    ▼
Resultado único → Customer Workspace
```
