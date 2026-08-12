# adapters/notebooklm

## Responsabilidad
Cliente para NotebookLM, el sistema de documentación y conocimiento. Proporciona búsqueda y recuperación de documentos, guías y manuales.

## Qué implementará
- `NotebookLmClient`
- Búsqueda de documentación por consulta textual
- Obtención de guías por categoría
- Sugerencia de documentación relevante para el caso actual

## Dependencias
- NotebookLM API interna

## Relación con el dominio
- Proporciona datos para el widget de NotebookLM en el `Workspace`
- Soporta el bloque "NotebookLM" en el `WorkspaceAdaptativo`
- En futuras versiones, se conectará al motor de IA para sugerencias contextuales

## Estado actual
🧭 Por implementar — estructura de carpeta creada
