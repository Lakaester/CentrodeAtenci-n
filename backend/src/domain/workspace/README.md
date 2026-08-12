# Workspace Engine

## ¿Qué es?
El **Workspace Engine** es el responsable de construir dinámicamente el espacio de trabajo del asesor según el contexto del caso. Cada categoría de caso tiene un workspace diferente, con sus propios widgets, secciones, plugins y acciones rápidas.

## ¿Cómo decide qué Workspace cargar?

```
1. El asesor abre un caso con categoría "Facturación Electrónica"
2. WorkspaceEngine.construir({ categoriaId: "Facturación Electrónica" })
3. WorkspaceFactory.crear("Facturación Electrónica", contexto)
4. → Workspace con:
   - Header: "Facturación Electrónica" + icono FileText
   - Secciones: Cliente, Diagnóstico (CDT, Certificado), Herramientas, Checklist
   - Plugins: Restafact
   - Acciones: Abrir Dominio, Abrir Restafact, Abrir Dashboard FE
```

## Composición de un Workspace

```
Workspace
├── Header (título, descripción, icono, color)
├── Secciones[]
│   ├── Cliente (widgets: nombre, dominio, tipo)
│   ├── Diagnóstico (widgets: CDT, certificado, errores)
│   ├── Historial (widgets: timeline, últimas atenciones)
│   ├── Herramientas (widgets: botones de plugins)
│   ├── Checklist (widgets: items checklist)
│   ├── IA (widgets: sugerencias, diagnóstico)
│   ├── DEV (widgets: tickets DEV)
│   └── Notas (widget: notas internas)
├── Plugins[] (plugins disponibles para este workspace)
└── AccionesRápidas[] (botones de acceso directo)
```

## Interacción con otros motores

| Motor | Interacción |
|-------|-------------|
| **Plugin Engine** | El workspace consulta `PluginManager.obtenerPluginsPorCategoria()` para saber qué plugins mostrar |
| **Case Engine** | El workspace se adapta según el estado del caso (muestra checklist solo cuando está en "EN_PROCESO") |
| **Timeline** | El workspace muestra el timeline del caso en la sección de historial |
| **IA** | El workspace expone los datos del caso a la IA para sugerencias contextuales |
| **Playbooks** | El workspace lista los playbooks disponibles para la categoría actual |

## Componentes

| Archivo | Responsabilidad |
|---------|----------------|
| `WorkspaceWidget.ts` | Modelo de widget individual con tipo, tamaño, plugin asociado |
| `WorkspaceSection.ts` | Modelo de sección que agrupa widgets |
| `Workspace.ts` | Modelo de workspace completo con header, secciones, plugins y acciones |
| `WorkspaceContext.ts` | Contexto del workspace: caso, cliente, categoría, asesor, permisos |
| `WorkspaceFactory.ts` | Fábrica que crea workspaces por categoría (con registros predefinidos) |
| `WorkspaceEngine.ts` | Orquestador que construye y recarga workspaces |

## Workspaces predefinidos en la fábrica

| Workspace | Categoría | Widgets clave | Plugins |
|-----------|-----------|---------------|---------|
| FacturacionWorkspace | Facturación Electrónica | CDT, Certificado | Restafact, Dashboard FE |
| LogisticaWorkspace | Logística | Sincronización, Inventarios | — |
| IntegracionesWorkspace | Integraciones | Monitor | Integraciones |

## Ejemplo de uso

```ts
const engine = new WorkspaceEngine();
engine.inicializar();

const contexto = new WorkspaceContext({
  caso: casoActual,
  cliente: clienteActual,
  categoria: categoriaFE,
  pluginsDisponibles: [{ id: "restafact", nombre: "Restafact", icono: "FileText", disponible: true }],
});

const workspace = engine.construirConContexto(contexto);
// workspace.secciones → [Cliente, Diagnóstico, Herramientas, Checklist]
// workspace.accionesRapidas → [Abrir Dominio, Abrir Restafact, ...]
```
