# COPE DESIGN SYSTEM v1.0

**Fecha:** 2026-07-18
**Versión:** 1.0
**Fase:** PI-3 Foundations
**Dependencias:** Product Blueprint v1.0, UX Blueprint v1.0, Navigation Blueprint v1.0
**Estado:** Oficial

---

## Capítulo 1: Design Principles

| # | Principio | Descripción |
|---|---|---|
| 1 | **Consistencia** | Un mismo patrón se usa igual en toda la plataforma. No hay excepciones visuales por módulo. |
| 2 | **Claridad** | Cada elemento comunica su propósito sin ambigüedad. No hay decoración sin función. |
| 3 | **Jerarquía** | La información más importante es visualmente dominante. Lo secundario se subordina. |
| 4 | **Escaneabilidad** | El usuario puede identificar la información relevante en menos de 3 segundos. |
| 5 | **Contexto antes que detalle** | Resumen primero, detalle bajo demanda. |
| 6 | **Acción antes que decoración** | Toda interfaz prioriza la acción del usuario sobre la estética. |
| 7 | **Minimalismo funcional** | Todo elemento visible tiene un propósito. Si no es necesario, no está. |

---

## Capítulo 2: Visual Language

### Tipografía

| Uso | Familia | Estilo |
|---|---|---|
| Interfaz general | Sistema (SF Pro, Segoe UI, Roboto) | Sin serifa |
| Código | Mono (JetBrains Mono, SF Mono, Consolas) | Monospace |
| Jerarquía | Regular, Medium, Semibold | Sin bold innecesario |

### Espaciado

| Token | Valor | Uso |
|---|---|---|
| 3xs | 2px | Iconos, borders |
| 2xs | 4px | Padding interno compacto |
| xs | 8px | Padding entre elementos relacionados |
| sm | 12px | Padding de cards, gap entre secciones |
| md | 16px | Padding estándar |
| lg | 24px | Separación entre secciones |
| xl | 32px | Separación entre módulos |
| 2xl | 48px | Separación de página |

### Iconografía

| Regla | Descripción |
|---|---|
| Tamaño | 12px (inline), 14px (acciones), 16px (navegación), 20px (encabezados), 24px (estados) |
| Estilo | Outline, trazo fino (1.5px), esquinas rectas |
| Consistencia | Un mismo concepto usa el mismo icono en toda la plataforma |
| Accesibilidad | Todo icono sin texto acompañante tiene aria-label |

### Elevación

| Nivel | Uso |
|---|---|
| 0 | Superficie plana (fondo de página) |
| 1 | Cards, contenedores |
| 2 | Sidebar, header |
| 3 | Dropdowns, selectores |
| 4 | Modals, drawers |
| 5 | Notificaciones toast |

### Bordes

| Uso | Radio |
|---|---|
| Cards | 8px |
| Botones | 6px |
| Inputs | 6px |
| Badges | 4px |
| Modals | 12px |

### Densidad

| Modo | Interlineado | Padding | Altura de fila |
|---|---|---|---|
| Normal | 1.5 | md (16px) | 40px |
| Compacto | 1.3 | sm (12px) | 32px |

---

## Capítulo 3: Layout System

| Layout | Cuándo usar | Estructura |
|---|---|---|
| **Página** | Contenido informativo, reportes | Header + contenido de ancho completo |
| **Dashboard** | KPIs, resúmenes | Grid de cards (3 columnas) |
| **Detalle** | Entidad específica | Header fijo + scroll de contenido + panel lateral opcional |
| **Panel lateral** | Información contextual | Sidebar de 288px (w-72) adjunto al detalle |
| **Modal** | Confirmaciones, formularios cortos | Overlay + centrado, ancho máximo 480px |
| **Drawer** | Contenido adicional sin perder contexto | Panel deslizable desde la derecha, 480px |
| **Split View** | Workspace de atención | 3 columnas: bandeja (288px) + contenido (flex-1) + panel (288px) |

---

## Capítulo 4: Component Catalog

### Card
| Atributo | Descripción |
|---|---|
| **Objetivo** | Contenedor de información relacionada |
| **Cuándo usar** | KPIs, resúmenes, elementos de lista |
| **Cuándo NO** | Formularios largos, contenido denso |
| **Estructura** | Borde sutil, bg blanco, padding md, radio 8px |

### KPI
| Atributo | Descripción |
|---|---|
| **Objetivo** | Mostrar un indicador numérico clave |
| **Cuándo usar** | Dashboards, resúmenes ejecutivos |
| **Cuándo NO** | Tablas, listas |
| **Estructura** | Label (10px uppercase) + valor (lg, semibold) + delta opcional |

### Data Table
| Atributo | Descripción |
|---|---|
| **Objetivo** | Mostrar datos tabulares |
| **Cuándo usar** | Listas de entidades, reportes |
| **Cuándo NO** | Menos de 5 registros (usar cards) |
| **Estructura** | Header fijo con ordenamiento, filas con hover, paginación inferior |

### Timeline
| Atributo | Descripción |
|---|---|
| **Objetivo** | Mostrar secuencia cronológica de eventos |
| **Cuándo usar** | Historial de casos, actividad del cliente |
| **Cuándo NO** | Datos tabulares, reportes |
| **Estructura** | Línea vertical + dots + contenido, eventos agrupados por día |

### Badge
| Atributo | Descripción |
|---|---|
| **Objetivo** | Etiqueta de estado, categoría o canal |
| **Cuándo usar** | Estados, prioridades, canales |
| **Cuándo NO** | Acciones primarias |
| **Estructura** | Background + texto de 10-11px, radio 4px |

### Status
| Atributo | Descripción |
|---|---|
| **Objetivo** | Indicar estado de una entidad |
| **Cuándo usar** | Estado de casos, health checks |
| **Cuándo NO** | Categorías, canales |
| **Estructura** | Dot de color (8px) + label |

### Alert
| Atributo | Descripción |
|---|---|
| **Objetivo** | Notificar información importante |
| **Cuándo usar** | Errores, advertencias, confirmaciones |
| **Cuándo NO** | Mensajes de éxito temporales (usar Toast) |
| **Estructura** | Background + icono + texto + acción opcional, radio 6px |

### Filter Bar
| Atributo | Descripción |
|---|---|
| **Objetivo** | Filtrar datos en reportes |
| **Cuándo usar** | Reportes, dashboards |
| **Cuándo NO** | Workspace de atención (filtros separados) |
| **Estructura** | Chips colapsables + período + botones aplicar/limpiar |

### Search
| Atributo | Descripción |
|---|---|
| **Objetivo** | Búsqueda universal |
| **Cuándo usar** | Barra global, búsqueda contextual |
| **Cuándo NO** | Filtros específicos (usar FilterBar) |
| **Estructura** | Input con icono de lupa + debounce 300ms + resultados bajo demanda |

### Tabs
| Atributo | Descripción |
|---|---|
| **Objetivo** | Navegación entre secciones de una misma entidad |
| **Cuándo usar** | Customer Workspace, detalle de caso |
| **Cuándo NO** | Navegación entre módulos (usar sidebar) |
| **Estructura** | Línea inferior con indicador de pestaña activa |

### Accordion
| Atributo | Descripción |
|---|---|
| **Objetivo** | Secciones colapsables de información |
| **Cuándo usar** | Panel operativo, formularios largos |
| **Cuándo NO** | Navegación principal |
| **Estructura** | Header clickeable + contenido expandible, animación suave |

### Empty State
| Atributo | Descripción |
|---|---|
| **Objetivo** | Informar que no hay datos |
| **Cuándo usar** | Tablas sin resultados, búsqueda sin coincidencias |
| **Cuándo NO** | Estados de carga (usar Skeleton) |
| **Estructura** | Icono + mensaje + acción sugerida opcional |

### Loading State (Skeleton)
| Atributo | Descripción |
|---|---|
| **Objetivo** | Indicar carga de contenido |
| **Cuándo usar** | Pantallas que cargan datos asíncronos |
| **Cuándo NO** | Acciones rápidas (<300ms) |
| **Estructura** | Rectángulos animados (pulse) que reflejan la estructura final |

### Toast
| Atributo | Descripción |
|---|---|
| **Objetivo** | Feedback temporal de acciones |
| **Cuándo usar** | Operaciones exitosas, errores leves |
| **Cuándo NO** | Información crítica (usar Alert) |
| **Estructura** | Notificación flotante, auto-dismiss 3-5s |

---

## Capítulo 5: Entity Presentation

| Entidad | Resumen | Detalle | Timeline |
|---|---|---|---|
| **Case** | Estado, prioridad, SLA, cliente | Conversación, diagnóstico, acciones | Eventos del caso |
| **Customer** | Dominio, empresa, país, estado | Datos de contacto, dominios asociados | Historial de actividad |
| **Conversation** | Canal, fecha, participante | Mensajes en orden cronológico | — |
| **Workflow** | Nombre, versión, estado | Steps, configuración | Ejecuciones |
| **Knowledge** | Título, categoría, estado | Contenido, versiones, aprobaciones | Historial de cambios |
| **Alert** | Tipo, severidad, fecha | Detalle, origen, acciones | — |
| **Metric** | Nombre, valor, unidad | Historial, tendencia | — |

### Estructura común de entidad

```
┌─────────────────────────────────────────────┐
│  Encabezado (nombre + estado + acciones)     │
├─────────────────────────────────────────────┤
│  Resumen (cards con datos clave)            │
├─────────────────────────────────────────────┤
│  Detalle (tabs con información específica)   │
├─────────────────────────────────────────────┤
│  Timeline (historial de eventos)            │
└─────────────────────────────────────────────┘
```

---

## Capítulo 6: Table Patterns

| Aspecto | Regla |
|---|---|
| **Ordenamiento** | Click en header ordena asc/desc. Indicador visual visible. |
| **Filtros** | FilterBar sobre la tabla. Filtros persistentes al navegar. |
| **Búsqueda** | Input sobre la tabla con debounce. Busca en todas las columnas. |
| **Paginación** | 20 items por defecto, opciones: 20, 50, 100. |
| **Acciones** | Botones por fila al hacer hover. |
| **Exportación** | Botón de exportar fuera de la tabla. Formato CSV. |
| **Selección** | Checkbox por fila. Acciones batch visibles solo cuando hay selección. |
| **Columnas** | Mínimas necesarias. Sin scroll horizontal forzado. |

---

## Capítulo 7: Form Patterns

| Aspecto | Regla |
|---|---|
| **Validación** | En tiempo real (on blur). Errores visibles debajo del campo. |
| **Mensajes** | En lenguaje natural. Especifican el campo y el problema. |
| **Errores** | Borde rojo en el campo + mensaje inferior. |
| **Confirmaciones** | Modal de confirmación para acciones destructivas. |
| **Guardado** | Botón "Guardar" siempre visible. Loading state durante la operación. |
| **Edición** | Inline editing para campos simples. Modal para conjuntos de campos. |

---

## Capítulo 8: Feedback Patterns

| Estado | Componente | Duración |
|---|---|---|
| **Carga** | Skeleton | Hasta que los datos estén listos |
| **Éxito** | Toast | 3 segundos |
| **Advertencia** | Alert | Persistente hasta descartar |
| **Error** | Alert + Toast | Persistente + 5 segundos |
| **Confirmación** | Modal | Hasta que el usuario decida |
| **Vacío** | Empty State | Hasta que existan datos |

---

## Capítulo 9: Responsive Strategy

| Resolución | Prioridad | Comportamiento |
|---|---|---|
| **1920×1080** | ✅ Principal | Layout completo de 3 columnas |
| **1440×900** | ✅ Principal | Layout completo, sidebar colapsable |
| **1366×768** | ✅ Soporte | Layout completo, sidebar colapsado por defecto |
| **1024×768** | ⚠️ Adaptado | Panel lateral derecho oculto, accesible por botón |
| **<1024** | ❌ No soportado | Mensaje: "Resolución mínima: 1024px" |

---

## Capítulo 10: Design Governance

| Regla | Descripción |
|---|---|
| **Un componente, un lugar** | Cada componente existe una sola vez. No se duplican variantes por módulo. |
| **Modificar con aprobación** | Cambiar un componente existente requiere revisión del equipo de diseño. |
| **Agregar con justificación** | Un nuevo componente debe demostrar que no existe una alternativa reutilizable. |
| **Consistencia sobre creatividad** | Las excepciones visuales están prohibidas sin aprobación expresa. |
| **Documentación obligatoria** | Todo componente debe tener su uso documentado antes de ser implementado. |
| **Versiones** | El Design System se versiona independientemente del producto. |

---

*Documento oficial — COPE Design System v1.0*
