# Reglas del Proyecto COPE

## Propósito de este documento

Establecer las reglas fundamentales que rigen el desarrollo, la evolución y el mantenimiento de COPE. Este documento es la fuente de verdad sobre cómo se construye, decide y documenta el proyecto. Debe ser consultado antes de tomar cualquier decisión arquitectónica, funcional o técnica.

---

## 1. Metodología de trabajo oficial

COPE sigue una metodología descendente basada en dominio primero. Cada ciclo de desarrollo respeta estrictamente el siguiente orden:

```
Dominio
  ↓
Arquitectura
  ↓
Sprint
  ↓
Código
  ↓
Auditoría
  ↓
Validación Funcional
  ↓
Documentación
```

### 1.1 Explicación de cada fase

| Fase | Descripción |
|------|-------------|
| **Dominio** | Se define o refina el modelo de dominio, el lenguaje ubicuo y las reglas de negocio antes de cualquier implementación. No se escribe código sin entender primero qué problema resuelve. |
| **Arquitectura** | Se diseña o actualiza la arquitectura necesaria para soportar el modelo de dominio. Se toman decisiones de estructura, patrones y separación de responsabilidades. |
| **Sprint** | Se planifica el trabajo en sprints con objetivos claros, priorizados por valor de dominio y riesgo técnico. Cada sprint tiene un alcance definido y revisable. |
| **Código** | Se implementa siguiendo las convenciones del proyecto, respetando la arquitectura definida y el modelo de dominio. Todo código nuevo debe ser consistente con el existente. |
| **Auditoría** | Se revisa el código generado para verificar: código duplicado, DTO innecesarios, entidades inconsistentes, dependencias circulares, acoplamiento excesivo y métodos muertos. |
| **Validación Funcional** | Se verifica que lo implementado cumple con el modelo de dominio y las reglas de negocio definidas. No se acepta código que se desvíe del dominio. |
| **Documentación** | Se actualiza la documentación del proyecto reflejando los cambios realizados. La documentación es un entregable del sprint, no un añadido opcional. |

### 1.2 Regla fundamental

Ninguna fase puede saltarse. Si se omite una fase, el ciclo se considera incompleto y debe reabrirse.

---

## 2. Principios del proyecto

### 2.1 El dominio es el centro

COPE se construye desde el dominio hacia afuera. Cada decisión técnica debe justificarse en términos del modelo de dominio. Si una decisión no mejora la representación del dominio, no es necesaria.

### 2.2 La entidad principal es Atención

No existe Caso. No existe Ticket como entidad principal. La única entidad raíz del dominio es Atención. Todo el modelo de datos, todas las relaciones y toda la lógica de negocio dependen de Atención.

### 2.3 Ticket es únicamente el identificador del canal

Ticket representa exclusivamente el identificador del canal de origen (WhatsApp, Meta, correo, etc.). No contiene lógica de negocio. Toda la información del cliente, contexto, diagnóstico, actividades y resultado pertenece a Atención.

### 2.4 Separación estricta de capas

La arquitectura limpia es obligatoria. Las dependencias deben apuntar hacia adentro: infraestructura → aplicación → dominio. Ninguna capa superior puede depender de una capa inferior.

### 2.5 Sin inteligencia artificial en el dominio

El modelo de dominio debe ser autosuficiente sin IA. La IA es un adaptador externo que consume el dominio, no una parte del dominio. El diagnóstico prepara múltiples hipótesis, pero no las genera automáticamente.

### 2.6 Inmutabilidad de eventos

El timeline de una atención es inmutable. Una vez que una actividad se registra, no puede modificarse ni eliminarse. Solo se pueden agregar nuevas actividades.

### 2.7 No duplicar información

El timeline se construye automáticamente a partir de las actividades. No existe un timeline independiente con datos duplicados. Si una actividad se registra, el timeline refleja esa actividad sin almacenamiento adicional.

---

## 3. Convenciones de desarrollo

### 3.1 Estilo de código

- TypeScript estricto en todo el backend.
- ESModules exclusivamente (import/export, no require).
- Nombres de clases en PascalCase.
- Nombres de funciones, métodos y variables en camelCase.
- Nombres de archivos en PascalCase para clases, en camelCase para utilidades.
- Interfaces con prefijo `I` solo para contratos (repositorios, servicios externos).
- Tipos de dominio sin prefijo `I`.

### 3.2 Estructura de archivos

```
src/
  domain/       # Modelo de dominio puro, sin dependencias externas
  application/  # Casos de uso, orquestan el dominio
  dto/          # Objetos de transferencia de datos (Zod schemas)
  mappers/      # Mapeo entre capas (DTO ↔ Domain ↔ Response)
  contracts/    # Interfaces de repositorios y servicios externos
  repositories/ # Implementaciones concretas de repositorios
  controllers/  # Controladores REST (Express)
  routes/       # Definición de rutas Express
  adapters/     # Adaptadores a sistemas externos
  providers/    # Proveedores de servicios
  assemblers/   # Ensambladores de respuestas compuestas
  builders/     # Builders para objetos complejos
  middlewares/   # Middleware Express
  validators/   # Validadores adicionales
  utils/        # Utilidades genéricas
  config/       # Configuración de entorno
```

### 3.3 Convenciones de naming

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Entidad de dominio | Nombre del concepto | `Atencion`, `Cliente`, `Actividad` |
| Value Object | Nombre del concepto | `Contexto`, `ResultadoAtencion`, `Hipotesis` |
| Caso de uso | Verbo + Nombre + `UseCase` | `CreateAtencionUseCase` |
| DTO | Nombre + `DTO` | `CreateAtencionDTO` |
| Mapper | Nombre + `Mapper` | `AtencionMapper` |
| Controlador | Nombre + `Controller` | `AtencionController` |
| Repositorio | Prefijo de impl. + `Repository` | `InMemoryAtencionRepository` |
| Contrato repositorio | `I` + Nombre + `Repository` | `IAtencionRepository` |
| Ruta | Nombre + `.routes` | `atencion.routes.ts` |

### 3.4 Zod schemas

Toda validación de entrada debe usar Zod. Los schemas se definen en los archivos DTO y se reutilizan en los controladores. No duplicar validaciones entre capas.

### 3.5 Tests

- Tests unitarios para dominio (sin dependencias externas).
- Tests de integración para repositorios.
- Tests de aceptación para casos de uso.
- Nombrar archivos de test como `*.test.ts`.

---

## 4. Metodología de sprints

### 4.1 Estructura de sprint

Cada sprint debe tener:

1. **Objetivo claro**: qué problema de dominio resuelve.
2. **Alcance definido**: qué archivos se crearán, modificarán o eliminarán.
3. **Criterios de aceptación**: cómo se verifica que el sprint está completo.
4. **Auditoría automática**: revisión de código duplicado, dependencias circulares, métodos muertos.
5. **Documentación entregable**: toda funcionalidad nueva debe tener su documentación correspondiente.

### 4.2 Reglas de sprint

- No mezclar sprints. Un sprint resuelve un problema de dominio.
- No agregar funcionalidades no solicitadas en el objetivo del sprint.
- No modificar el frontend salvo que sea estrictamente necesario para mantener compatibilidad.
- No romper la arquitectura existente. Los cambios deben ser compatibles hacia atrás.
- Si un sprint introduce deuda técnica, debe registrarse explícitamente.

---

## 5. Convenciones de documentación

### 5.1 Formato

- Todos los documentos en Markdown (`.md`).
- Usar GitHub Flavored Markdown para tablas y código.
- Los diagramas deben ir en Mermaid cuando sea posible.

### 5.2 Actualización

- La documentación se actualiza al finalizar cada sprint.
- Ningún merge request se acepta sin documentación actualizada.
- Los ADR (Architecture Decision Records) se crean antes de implementar una decisión arquitectónica.

### 5.3 Ubicación

Toda la documentación del proyecto vive dentro de `docs/`. No debe haber documentación fuera de este directorio (excepto README.md en la raíz y AGENTS.md).

### 5.4 Estructura de documentos

```
docs/
  product/        # Filosofía, objetivos, reglas del proyecto
  domain/         # Lenguaje ubicuo, modelo de dominio, reglas de negocio
  architecture/   # Decisiones arquitectónicas, diagramas
  roadmap/        # Plan de desarrollo, sprints
  adr/            # Architecture Decision Records
  api/            # Guía de API REST
  ui/             # Guías de interfaz de usuario
  operations/     # Operación y despliegue
```

---

## 6. Glosario de términos prohibidos

Los siguientes términos no deben usarse en el código ni en la documentación del proyecto, salvo para referencia histórica o migración:

| Término | Motivo | Alternativa |
|---------|--------|-------------|
| Caso | No existe en V1 | Atención |
| Ticket (como entidad principal) | Solo es identificador de canal | Atención |
| CaseEngine | Reemplazado por modelo Atención | — |
| EstadoCaso | Reemplazado por AtencionStatus | AtencionStatus |

---

## 7. Convenciones de commit

- Usar español para los mensajes de commit.
- Formato: `tipo(ámbito): mensaje en imperativo`
- Tipos: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
- Ámbitos: `domain`, `api`, `frontend`, `infra`, `docs`

Ejemplo: `refactor(domain): migrar Caso a Atencion como agregado raíz`

---

## 8. Propiedad intelectual

COPE es un producto interno. Todo el código, documentación y decisiones de diseño pertenecen a la organización. No compartir fuera del equipo autorizado.

---

*Última actualización: 2026-07-15*
*Versión: 1.0.0*
