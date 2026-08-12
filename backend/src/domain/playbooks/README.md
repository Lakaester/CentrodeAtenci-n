# Playbook Engine

## ¿Qué es un Playbook?
Un **Playbook** es una secuencia de pasos que guía al asesor durante la resolución de un caso. Cada categoría de caso tiene su propio playbook con pasos específicos, herramientas asociadas y verificaciones obligatorias.

## ¿Cómo interactúa con el Workspace Engine?
El **Playbook Engine** provee los pasos que el **Workspace Engine** renderiza en el panel del asesor. Cuando el asesor abre un caso:

```
CaseEngine.cambiarEstado("DIAGNOSTICANDO")
  → PlaybookEngine.recomendar({ categoria })
    → Playbook con pasos, herramientas y checklist
      → WorkspaceEngine.renderiza los pasos en el panel
```

## ¿Cómo interactúa con el Plugin Engine?
Cada paso de un playbook puede estar asociado a un plugin. Cuando el asesor ejecuta un paso:

```
Paso: "Revisar CDT" (pluginId: "restafact")
  → PlaybookEngine.ejecutarPaso(playbookId, pasoId)
    → PluginManager.abrirPlugin("restafact", contexto)
      → RestafactPlugin.abrir({ casoId })
```

## ¿Cómo interactúa con el Case Engine?
El playbook consume el estado del caso para determinar qué pasos mostrar y ejecutar:

- Si el caso está en `ESPERANDO_CLIENTE`, los pasos que requieren interacción del cliente se marcan como pendientes
- Si el caso cambia a `RESUELTO`, el playbook valida que todos los pasos obligatorios estén completos
- Las condiciones de cierre del playbook deben cumplirse antes de que el Case Engine permita cerrar

## ¿Cómo se integrará con IA?
En el futuro, la IA podrá:
- Sugerir el playbook óptimo según el análisis del caso
- Completar pasos automáticamente
- Detectar desviaciones del playbook recomendado
- Generar nuevos playbooks basados en casos resueltos

## Playbooks predefinidos

| Playbook | Pasos | Herramientas | Plugins |
|----------|-------|-------------|---------|
| Facturación Electrónica | 7 pasos | Restafact, Dashboard FE, NotebookLM | restafact, dashboard-fe, notebooklm |
| Integraciones | 4 pasos | Monitor, NotebookLM | integraciones, notebooklm |
| Logística | 4 pasos | NotebookLM | notebooklm |

## Componentes

| Archivo | Responsabilidad |
|---------|----------------|
| `PlaybookAction.ts` | Acción ejecutable dentro de un paso (13 tipos) |
| `PlaybookCondition.ts` | Condición para validar pre-requisitos (15 tipos) |
| `PlaybookStep.ts` | Paso individual con orden, nombre, herramientas, acciones |
| `Playbook.ts` | Playbook completo con pasos, checklist, condiciones de cierre |
| `PlaybookFactory.ts` | Fábrica con 3 playbooks predefinidos |
| `PlaybookEngine.ts` | Orquestador: obtener, recomendar, progreso |

## Ejemplo de uso

```ts
const engine = new PlaybookEngine();
engine.inicializar();

const playbook = engine.obtener("Facturación Electrónica");
// playbook.pasos → 7 pasos
// playbook.checklist → ["CDT verificado", ...]
// playbook.plugins → ["restafact", "dashboard-fe", "notebooklm"]
// playbook.progreso → 0

const recomendado = engine.recomendar({ categoria: "Facturación Electrónica" });
```
