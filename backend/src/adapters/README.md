# adapters

## Responsabilidad
Implementaciones concretas de las interfaces definidas en `contracts/`. Cada adapter se comunica con un servicio externo o sistema legacy.

## Estructura
- `whaticket/` — adapter para Whaticket API
- `zendesk/` — adapter para Zendesk API
- `meta/` — adapter para Meta Business API
- `microservice/` — client para Microservice interno
- `restafact/` — client para Restafact
- `dashboardfe/` — client para Dashboard FE
- `notebooklm/` — client para NotebookLM

## Principios
- Cada adapter implementa UNA interfaz de `contracts/servicios/`
- Los adapters NO contienen lógica de negocio, solo traducción técnica
- El dominio nunca conoce la existencia de los adapters

## Estado actual
🧭 Por implementar — estructura de carpeta creada
