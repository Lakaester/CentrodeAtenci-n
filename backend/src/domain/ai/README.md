# AI Orchestrator

## ¿Qué es?
El **AI Orchestrator** es el único componente de COPE autorizado para gestionar solicitudes de Inteligencia Artificial. Todas las peticiones a modelos de IA (OpenAI, Claude, Gemini, locales) pasan obligatoriamente por este orquestador.

## ¿Por qué toda la IA pasa por este componente?

```
Cualquier módulo de COPE
  │
  ▼
AIOrchestrator.ejecutarTarea(tarea, contexto)
  │
  ├── 1. Selecciona proveedor (registry)
  ├── 2. Construye prompt según la tarea
  ├── 3. Ejecuta contra el proveedor
  ├── 4. Valida y sanitiza la respuesta
  └── 5. Retorna AIResponse estructurado
```

Beneficios:
- **Un solo punto de integración** — no hay código de IA disperso
- **Proveedores intercambiables** — cambiar de OpenAI a Claude es cambiar una línea de configuración
- **Prompts centralizados** — todas las plantillas están en AIPrompt.ts
- **Auditabilidad** — cada solicitud queda registrada

## Integración con otros motores

| Motor | Tareas IA |
|-------|-----------|
| **Diagnosis Engine** | `diagnosticar_caso`, `clasificar_categoria`, `clasificar_subcategoria` |
| **Knowledge Engine** | `buscar_conocimiento`, `extraer_datos_cliente` |
| **Playbook Engine** | `sugerir_siguiente_accion`, `generar_checklist` |
| **Workspace Engine** | `generar_resumen_ejecutivo`, `detectar_riesgo` |
| **Case Engine** | `resumir_conversacion`, `detectar_reincidencia`, `predecir_resolucion` |
| **Copiloto** | `generar_respuesta`, `auditar_respuesta`, `analizar_sentimiento` |

## Tareas disponibles (15)

| Tarea | Descripción |
|-------|-------------|
| `diagnosticar_caso` | Analizar caso y generar diagnóstico |
| `clasificar_categoria` | Sugerir categoría |
| `clasificar_subcategoria` | Sugerir subcategoría |
| `resumir_conversacion` | Resumir historial de mensajes |
| `generar_respuesta` | Redactar respuesta para el cliente |
| `auditar_respuesta` | Validar calidad de respuesta |
| `detectar_riesgo` | Identificar riesgos potenciales |
| `buscar_conocimiento` | Buscar artículos relevantes |
| `generar_resumen_ejecutivo` | Resumen para cierre de caso |
| `sugerir_siguiente_accion` | Recomendar próximo paso |
| `generar_checklist` | Crear checklist automático |
| `detectar_reincidencia` | Identificar patrón recurrente |
| `analizar_sentimiento` | Analizar tono del cliente |
| `predecir_resolucion` | Estimar tiempo de resolución |
| `extraer_datos_cliente` | Extraer datos estructurados |

## Componentes

| Archivo | Responsabilidad |
|---------|----------------|
| `AITask.ts` | 15 tipos de tareas de IA |
| `AIContext.ts` | Contexto completo: caso, cliente, conversación, timeline, diagnóstico, workspace |
| `AIRequest.ts` | Solicitud: tarea, contexto, proveedor, temperatura, idioma |
| `AIResponse.ts` | Respuesta: resultado, confianza, referencias, acciones |
| `AIProvider.ts` | Clase abstracta para proveedores de IA |
| `AIProviderRegistry.ts` | Registro central de proveedores (singleton) |
| `AIPrompt.ts` | Plantillas de prompts por tarea |
| `AIOrchestrator.ts` | Orquestador: ejecutar tarea única o múltiple |

## Ejemplo de uso

```ts
const orchestrator = new AIOrchestrator();
orchestrator.inicializar();

const contexto = new AIContext({
  caso: casoActual,
  cliente: clienteActual,
  mensajesRecientes: ["Mensaje 1", "Mensaje 2"],
});

const respuesta = await orchestrator.ejecutarTarea(
  "resumir_conversacion",
  contexto,
  { proveedor: "mock", temperatura: 0.3 },
);
```
