# Módulo Search

Búsqueda universal multi-provider con detección automática de tipo, fusión de resultados y ranking de relevancia.

## Componentes

| Componente | Responsabilidad |
|---|---|
| SearchEngine | Orquestar detección, consultas, merge y ranking |
| SearchProvider | Punto de acceso a todos los providers |
| MergeEngine | Fusionar resultados, eliminar duplicados |
| RankingEngine | Asignar puntaje de relevancia |
| TypeDetector | Identificar automáticamente el tipo de búsqueda |
