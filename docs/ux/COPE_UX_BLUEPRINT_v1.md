# COPE UX BLUEPRINT v1.0

**Fecha:** 2026-07-18
**Versión:** 1.0
**Fase:** PI-3 Foundations
**Dependencias:** Product Blueprint v1.0, Domain Blueprint v1.0, Architecture Freeze v1.0
**Estado:** Oficial

---

## Capítulo 1: Principios UX

| # | Principio | Descripción |
|---|---|---|
| 1 | **Una pantalla = una decisión** | Cada vista tiene un propósito único y medible. Si una pantalla intenta responder más de una pregunta, debe dividirse. |
| 2 | **Toda información conduce a una acción** | No se muestra información sin propósito. Cada dato presentado debe permitir al usuario tomar una decisión inmediata. |
| 3 | **Contexto antes que detalle** | Primero se muestra el resumen (dominio, estado, alertas). El detalle se despliega bajo demanda. |
| 4 | **No duplicar información** | Cada dato existe en un solo lugar. Si dos vistas muestran la misma información, una de ellas debe consumirla desde la fuente única. |
| 5 | **Toda entidad posee Timeline** | Toda entidad tiene un historial de eventos navegable. El usuario nunca debe preguntar "¿qué pasó antes?". |
| 6 | **Toda acción importante debe poder auditarse** | Si el usuario puede hacer clic, el sistema debe registrar quién, cuándo y qué. |
| 7 | **La IA únicamente asiste** | El usuario conserva el control. La IA sugiere, no decide. Las decisiones críticas son determinísticas. |
| 8 | **El Workspace es el centro** | El asesor nunca abandona el contexto del cliente. Toda acción se ejecuta desde el Workspace. |
| 9 | **Consistencia sobre creatividad** | Todos los patrones se reutilizan. No se crean experiencias únicas para cada funcionalidad. |
| 10 | **Dominio como entrada** | El dominio del cliente es la llave de acceso a toda la información. No se requiere seleccionar tipo de búsqueda. |

---

## Capítulo 2: User Personas

### Asesor

| Atributo | Descripción |
|---|---|
| **Objetivo** | Resolver la mayor cantidad de casos posible en el menor tiempo |
| **Responsabilidades** | Atender clientes, diagnosticar problemas, documentar soluciones |
| **Necesidades** | Acceso rápido a información del cliente, contexto del caso, knowledge base |
| **Frustraciones** | Tener que cambiar entre múltiples sistemas, información dispersa, conocimiento no centralizado |
| **Información crítica** | Dominio del cliente, estado del caso, SLA, historial, conversaciones |
| **Acciones frecuentes** | Buscar cliente, abrir caso, responder, diagnosticar, resolver, categorizar |

### Supervisor

| Atributo | Descripción |
|---|---|
| **Objetivo** | Asegurar que la operación cumpla los SLA y el equipo sea productivo |
| **Responsabilidades** | Monitorear casos activos, revisar diagnósticos, aprobar procedimientos |
| **Necesidades** | Visibilidad en tiempo real del estado de la operación |
| **Frustraciones** | Depender de reportes manuales, no tener alertas tempranas |
| **Información crítica** | KPIs, casos por estado, health del sistema, SLA violados |
| **Acciones frecuentes** | Revisar dashboard OCC, inspeccionar casos, consultar health |

### QA

| Atributo | Descripción |
|---|---|
| **Objetivo** | Validar la calidad de las atenciones |
| **Responsabilidades** | Revisar casos cerrados, aprobar artículos de conocimiento |
| **Necesidades** | Acceso al timeline completo del caso, conversaciones, diagnóstico |
| **Frustraciones** | Falta de trazabilidad, información incompleta |
| **Información crítica** | Timeline del caso, diagnóstico aplicado, resultados |
| **Acciones frecuentes** | Revisar caso, aprobar conocimiento, generar reportes |

### Administrador

| Atributo | Descripción |
|---|---|
| **Objetivo** | Mantener la plataforma operativa y correctamente configurada |
| **Responsabilidades** | Gestionar plugins, configuración, usuarios, health del sistema |
| **Necesidades** | Acceso centralizado a toda la configuración |
| **Frustraciones** | Configuración dispersa en múltiples archivos |
| **Información crítica** | Estado de plugins, health, configuración actual |
| **Acciones frecuentes** | Configurar sistema, instalar plugins, monitorear health |

### Gerencia

| Atributo | Descripción |
|---|---|
| **Objetivo** | Tomar decisiones estratégicas basadas en datos |
| **Responsabilidades** | Evaluar rendimiento del equipo, identificar tendencias |
| **Necesidades** | KPIs consolidados, reportes ejecutivos |
| **Frustraciones** | Datos dispersos, sin métricas de negocio |
| **Información crítica** | MTTR, FCR, SLA, tendencias, capacidad del equipo |
| **Acciones frecuentes** | Consultar dashboard, revisar reportes, exportar datos |

---

## Capítulo 3: User Journeys

### Journey del Asesor

```
1. Inicio de sesión
   → Ve dashboard personal con casos pendientes y métricas del día

2. Búsqueda de cliente
   → Escribe dominio, correo o ticket en búsqueda universal (Ctrl+K)
   → Sistema detecta tipo automáticamente y muestra resultados

3. Selección de cliente
   → Workspace se abre con resumen del cliente
   → Ve dominio, empresa, estado, última conexión, alertas

4. Diagnóstico del caso
   → Navega a pestaña Ambiente
   → Ejecuta acciones: logs, feature flags, info del equipo
   → Resultados visibles inmediatamente

5. Decisión
   → Basado en diagnóstico, determina causa raíz
   → Consulta Knowledge Platform si necesita guía
   → Aplica playbook si existe

6. Resolución
   → Responde al cliente
   --> Categoriza el caso
   --> Marca como resuelto

7. Cierre
   --> Timeline registra automáticamente todas las acciones
   --> Auditoría completa disponible
```

### Journey del Supervisor

```
1. Dashboard OCC
   → Ve KPIs globales: MTTR, SLA, health score, casos abiertos
   → Ve health del sistema

2. Exploración
   → Filtra por estado, prioridad, asesor
   → Identifica casos fuera de SLA

3. Acción
   → Reasigna casos críticos
   → Contacta asesores
   → Revisa timeline de casos específicos

4. Cierre de jornada
   → Revisa reporte del día
   → Identifica tendencias
```

---

## Capítulo 4: Task Flows

### Gestionar un caso

```
Inicio: Workspace del cliente abierto
  1. Revisar resumen del cliente (dominio, empresa, estado)
  2. Consultar diagnóstico disponible (logs, flags, providers)
  3. Si necesita más información → ejecutar acción de diagnóstico
  4. Clasificar caso (categoría + subcategoría)
  5. Responder al cliente
  6. Si está resuelto → marcar como resuelto
  7. Si no → mantener abierto, asignar siguiente acción
Fin: Caso actualizado, timeline registrado
```

### Consultar cliente

```
Inicio: Búsqueda universal (Ctrl+K)
  1. Escribir dominio, correo o ticket
  2. Sistema detecta tipo automáticamente
  3. Resultados ordenados por relevancia
  4. Seleccionar resultado
  5. Customer Workspace se abre
Fin: Cliente identificado, información visible
```

### Escalar incidencia

```
Inicio: Caso abierto en estado complejo
  1. Diagnosticar causa raíz
  2. Si requiere otro equipo → cambiar estado a "esperando_proveedor"
  3. Agregar nota con detalle del escalamiento
  4. Timeline registra escalamiento
Fin: Caso escalado, notificación enviada
```

---

## Capítulo 5: Decision Flows

### Priorizar caso

| Información necesaria | Criterios | Resultado |
|---|---|---|
| SLA del cliente, severidad, impacto | Crítico si SLA < 4h o múltiples clientes afectados | Prioridad: baja, media, alta, crítica |

### Asignar asesor

| Información necesaria | Criterios | Resultado |
|---|---|---|
| Carga actual del asesor, especialidad, disponibilidad | El sistema sugiere, el supervisor confirma | Asesor asignado al caso |

### Resolver caso

| Información necesaria | Criterios | Resultado |
|---|---|---|
| Diagnóstico completo, categoría asignada, respuesta enviada | ¿El problema está solucionado? ¿El cliente confirmó? | Caso marcado como resuelto |

---

## Capítulo 6: Information Architecture

### Jerarquía de información

```
1. Dominio (identificador único)
2. Resumen del cliente (empresa, producto, país, estado)
3. Contexto del caso (estado, prioridad, SLA)
4. Diagnóstico (logs, flags, providers)
5. Conversación (mensajes, timeline)
6. Historial (tickets anteriores, eventos)
```

### Reglas de organización

| Nivel | Contenido | Comportamiento |
|---|---|---|
| **Resumen** | Datos clave del cliente | Siempre visible en header |
| **Contexto** | Estado del caso, SLA | Visible en panel derecho |
| **Detalle** | Conversación, diagnóstico | Bajo demanda por pestañas |
| **Historial** | Timeline, eventos | Bajo demanda |

---

## Capítulo 7: Interaction Patterns

| Patrón | Comportamiento |
|---|---|
| **Búsqueda** | Debounce 300ms, resultados en tiempo real, type detection automático |
| **Filtros** | Chips colapsables con conteo, aplicar/limpiar visible |
| **Timeline** | Lista cronológica descendente, eventos agrupados por día |
| **Detalle** | Panel lateral o sección expandible, nunca modal |
| **Panel lateral** | Información contextual, módulos colapsables |
| **Confirmación** | Modal de confirmación para acciones destructivas |
| **Estado vacío** | Mensaje claro + acción sugerida |
| **Carga** | Skeleton component, nunca spinner genérico |
| **Error** | Mensaje claro + acción de reintento |
| **Éxito** | Feedback inmediato sin interrumpir el flujo |

---

## Capítulo 8: Consistency Rules

| Regla | Descripción |
|---|---|
| **Misma estructura de entidad** | Toda entidad tiene: resumen → detalle → timeline |
| **Misma búsqueda** | La búsqueda universal funciona igual desde cualquier módulo |
| **Mismos filtros** | Todos los filtros usan el mismo patrón de chips colapsables |
| **Mismo timeline** | Todos los timelines comparten formato, eventos y navegación |
| **Mismas tablas** | Misma paginación, ordenamiento, selección y exportación |
| **Mismos botones de acción** | Las acciones principales están en la misma posición relativa |
| **Misma confirmación** | Todas las acciones destructivas usan el mismo modal de confirmación |
| **Mismo manejo de errores** | Todos los errores usan el mismo formato y las mismas opciones de reintento |

---

## Capítulo 9: Accessibility

| Estándar | Requisito mínimo |
|---|---|
| **Contraste** | WCAG AA (relación de contraste ≥ 4.5:1 para texto normal) |
| **Navegación por teclado** | Todas las acciones accesibles por Tab + Enter |
| **Estados visibles** | Hover, focus, active, disabled claramente diferenciados |
| **Mensajes claros** | Errores en lenguaje natural, no técnico |
| **Jerarquía visual** | Tamaño de fuente, color y spacing consistentes |
| **aria-labels** | Todos los iconos y botones sin texto tienen aria-label |

---

## Capítulo 10: UX Governance

| Regla | Aplica a |
|---|---|
| Toda nueva pantalla responde una pregunta del negocio | Nuevas funcionalidades |
| Toda funcionalidad conduce a una acción | Nuevas funcionalidades |
| No crear experiencias aisladas | Nuevos módulos |
| Toda mejora respeta este Blueprint | Todo el desarrollo |
| Los patrones se reutilizan, no se recrean | Todo el desarrollo |
| Toda acción modificadora se audita | Todo el desarrollo |
| Toda entidad tiene timeline | Nuevas entidades |
| Toda búsqueda usa el patrón universal | Nuevos módulos |

---

*Documento oficial — COPE UX Blueprint v1.0*
