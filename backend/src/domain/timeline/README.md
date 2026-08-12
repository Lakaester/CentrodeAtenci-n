# Timeline

## ¿Qué es?
El **Timeline** es el historial oficial de un Caso. Cada acción relevante que ocurre durante el ciclo de vida de un caso se registra como un evento en el timeline. Es la fuente de verdad de "qué pasó, cuándo y quién lo hizo".

## ¿Cómo se relaciona con el Caso?
- Un `Caso` tiene **1:N con Timeline** — cada caso tiene muchos eventos
- Cuando el `CaseEngine` ejecuta una transición, dispara un evento que el timeline registra
- El timeline es **inmutable**: los eventos no se modifican ni se eliminan
- El timeline es **ordenado**: los eventos se ordenan cronológicamente

## ¿Cómo alimentará otros módulos?

| Módulo | Consumo del Timeline |
|--------|---------------------|
| **Reportes** | Los reportes consultan el timeline para calcular métricas (tiempo promedio, cantidad de pasos, etc.) |
| **IA** | La IA analiza el timeline para sugerir el siguiente paso, detectar patrones y predecir resolución |
| **Auditoría** | Cada evento del timeline es un registro de auditoría (quién hizo qué) |
| **Workspace** | El timeline alimenta el widget de "Últimas atenciones" en el Centro del Cliente |
| **Centro de Operaciones** | El timeline es la fuente del "Historial del Caso" que ve el asesor |
| **Playbooks** | Los playbooks pueden consultar el timeline para decidir qué paso ejecutar |

## Categorías de eventos

| Categoría | Eventos | Ejemplo |
|-----------|---------|---------|
| CLIENTE | 4 eventos | Cliente escribió, respondió, envió archivo, leyó respuesta |
| ASESOR | 9 eventos | Caso aceptado, mensaje enviado, categorizado, resuelto, cerrado, transferido |
| SISTEMA | 8 eventos | Caso creado, SLA iniciado/vencido, playbook, diagnóstico, workspace, macro |
| HERRAMIENTA | 8 eventos | Dominio, Microservice, Restafact, Monitor, FE, Chile, NotebookLM, Postman |
| DESARROLLO | 3 eventos | Ticket DEV creado, actualizado, cerrado |

## Componentes

| Archivo | Responsabilidad |
|---------|----------------|
| `TimelineTypes.ts` | Constantes de tipos de evento (32 tipos) y mapeo a categorías |
| `TimelineEvent.ts` | Clase `TimelineEvent` con modelo de datos + `TITULOS_POR_TIPO` con textos por defecto |
| `TimelineBuilder.ts` | Builder para construir eventos de forma fluida + helpers para eventos comunes |
| `Timeline.ts` | Clase `Timeline` que agrupa eventos, permite filtrar, ordenar y serializar |

## Modelo de cada evento

```ts
{
  id: string,              // Identificador único
  casoId: string,          // Caso al que pertenece
  tipo: string,            // Tipo de evento (32 posibles)
  categoria: string,       // Categoría (CLIENTE/ASESOR/SISTEMA/HERRAMIENTA/DESARROLLO)
  titulo: string,          // Título legible
  descripcion: string,     // Descripción del evento
  usuario: string,         // Nombre del usuario que ejecutó la acción
  usuarioId?: string,      // ID del usuario
  fecha: string,           // ISO timestamp
  metadata?: object        // Datos adicionales
}
```

## Ejemplo de uso

```ts
const timeline = new Timeline();
timeline.agregar(
  TimelineBuilder.crearEvento({
    casoId: "CASO-001",
    tipo: "caso_aceptado",
    usuario: "Ana Torres",
    usuarioId: "USR-001",
  }),
);

// Usando builder fluido
timeline.agregarBuilder()
  .casoCreado("CASO-001", "Sistema")
  .casoAceptado("CASO-001", "Ana Torres")
  .herramientaAbierta("CASO-001", "Ana Torres", "restafact")
  .casoResuelto("CASO-001", "Ana Torres", "Reversión gestionada");

timeline.aplicarBuilder();
```
