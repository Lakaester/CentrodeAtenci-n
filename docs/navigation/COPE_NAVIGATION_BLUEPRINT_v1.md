# COPE NAVIGATION BLUEPRINT v1.0

**Fecha:** 2026-07-18
**Versión:** 1.0
**Fase:** PI-3 Foundations
**Dependencias:** Product Blueprint v1.0, Domain Blueprint v1.0, UX Blueprint v1.0
**Estado:** Oficial

---

## Capítulo 1: Navigation Principles

| # | Principio | Descripción |
|---|---|---|
| 1 | **Refleja el dominio** | La navegación replica la estructura del Domain Blueprint. Cada bounded context tiene representación en la navegación. |
| 2 | **Una funcionalidad, un lugar** | Cada funcionalidad existe en una única ubicación. No hay accesos duplicados ni redundancia. |
| 3 | **Contexto continuo** | El usuario nunca pierde el contexto al navegar entre módulos. |
| 4 | **Minimizar clics** | Las tareas frecuentes requieren máximo 2 clics desde cualquier pantalla. |
| 5 | **Consistencia** | Todos los módulos comparten la misma estructura de navegación y patrones de interacción. |
| 6 | **Profundidad predecible** | La jerarquía máxima es de 3 niveles. Más allá requiere rediseño del módulo. |

---

## Capítulo 2: Application Map

```
COPE
├── Dashboard (Inicio)
├── Atenciones (Workspace)
│   ├── Bandeja (Inbox)
│   ├── Workspace
│   └── Cliente 360
├── Clientes
│   ├── Búsqueda
│   └── Customer Workspace
├── Reportes
│   ├── Resumen Ejecutivo
│   ├── Operación
│   ├── Asesores
│   ├── Categorías
│   ├── Clientes
│   ├── WhatsApp
│   ├── Zendesk
│   └── Tendencias
├── Administración [Admin/Supervisor]
│   ├── Configuración
│   ├── Plugins
│   ├── Health
│   └── Eventos (DevTools)
├── Conocimiento
│   ├── Artículos
│   ├── Playbooks
│   ├── FAQs
│   └── Procedimientos
└── Operaciones [Supervisor]
    └── Centro de Operaciones (OCC)
```

### Acceso por rol

| Módulo | Asesor | Supervisor | Admin | Gerencia |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Atenciones | ✅ | ✅ | ✅ | ❌ |
| Clientes | ✅ | ✅ | ✅ | ❌ |
| Reportes | ✅ | ✅ | ✅ | ✅ |
| Administración | ❌ | ✅ | ✅ | ❌ |
| Conocimiento | ✅ | ✅ | ✅ | ❌ |
| Operaciones | ❌ | ✅ | ✅ | ✅ |

---

## Capítulo 3: Module Structure

### Dashboard

| Atributo | Descripción |
|---|---|
| **Objetivo** | Primer contacto del usuario con la plataforma |
| **Responsabilidad** | Mostrar resumen personalizado según el rol |
| **Información principal** | Casos pendientes, métricas del día, alertas |
| **Acciones** | Ir a Atenciones, acceder a caso |
| **Relaciones** | → Atenciones, → Clientes, → OCC |

### Atenciones

| Atributo | Descripción |
|---|---|
| **Objetivo** | Workspace principal del asesor |
| **Responsabilidad** | Gestionar casos activos |
| **Submódulos** | Bandeja (inbox), Workspace, Cliente 360 |
| **Información principal** | Tickets pendientes, conversación, diagnóstico, datos del cliente |
| **Acciones** | Responder, categorizar, asignar, resolver, diagnosticar |
| **Relaciones** | → Clientes, → Conocimiento |

### Clientes

| Atributo | Descripción |
|---|---|
| **Objetivo** | Gestión de clientes |
| **Responsabilidad** | Búsqueda, consulta y edición de datos del cliente |
| **Submódulos** | Búsqueda, Customer Workspace |
| **Información principal** | Datos del cliente, historial, dominios asociados |
| **Acciones** | Vincular dominio, ver historial, abrir caso |
| **Relaciones** | → Atenciones, → Conocimiento |

### Reportes

| Atributo | Descripción |
|---|---|
| **Objetivo** | Visualización de datos agregados |
| **Responsabilidad** | Proveer insights sobre la operación |
| **Submódulos** | 8 reportes (Resumen, Operación, Asesores, Categorías, Clientes, WhatsApp, Zendesk, Tendencias) |
| **Información principal** | KPIs, gráficos, tablas, tendencias |
| **Acciones** | Filtrar, exportar, navegar a detalle |

### Administración

| Atributo | Descripción |
|---|---|
| **Objetivo** | Gestión de la plataforma |
| **Responsabilidad** | Configuración, plugins, health, monitoreo |
| **Submódulos** | Configuración, Plugins, Health, Eventos |
| **Información principal** | Estado del sistema, configuración actual |
| **Acciones** | Configurar, instalar plugins, monitorear health |
| **Visibilidad** | Solo Admin y Supervisor |

### Conocimiento

| Atributo | Descripción |
|---|---|
| **Objetivo** | Consulta de conocimiento institucional |
| **Responsabilidad** | Centralizar procedimientos, guías, FAQs |
| **Submódulos** | Artículos, Playbooks, FAQs, Procedimientos |
| **Información principal** | Artículos versionados con búsqueda |
| **Acciones** | Buscar, crear, aprobar, publicar |

### Operaciones (OCC)

| Atributo | Descripción |
|---|---|
| **Objetivo** | Consola de supervisión operativa |
| **Responsabilidad** | Monitorear KPIs, health, actividad en tiempo real |
| **Información principal** | KPIs globales, health del sistema, casos por estado |
| **Acciones** | Refrescar, inspeccionar, navegar a detalle |
| **Visibilidad** | Supervisor, Admin, Gerencia |

---

## Capítulo 4: Navigation Flows

### Recorridos principales

```
1. Dashboard → Atenciones → Workspace → Cliente 360
   [Inicio]    [Bandeja]    [Resolver caso]  [Ver datos cliente]

2. Dashboard → Atenciones → Workspace → Conocimiento
   [Inicio]    [Bandeja]    [Diagnóstico]    [Consultar guía]

3. Clientes → Búsqueda → Customer Workspace → Atenciones
   [Buscar]    [Resultados]  [Ver datos]      [Abrir caso]

4. Reportes → Detalle → Cliente
   [KPIs]     [Tabla]   [Customer Workspace]

5. Administración → Plugins → Configuración
   [Lista]         [Detalle] [Parámetros]

6. Operaciones (OCC) → Atenciones → Caso
   [KPIs]             [Bandeja]   [Detalle]
```

### Flujos transversales

```
Búsqueda Universal (Ctrl+K)
  → Cualquier módulo
  → Resultados con enlace directo
  → Abre el contexto correspondiente
```

---

## Capítulo 5: Global Navigation

### Elementos globales

| Elemento | Responsabilidad | Módulos |
|---|---|---|
| **Sidebar** | Navegación principal entre módulos | Todos |
| **Búsqueda Global** | Acceso a cualquier entidad por dominio, correo o ticket (Ctrl+K) | Todos |
| **Perfil** | Usuario actual, rol, cerrar sesión | Todos |
| **Notificaciones** | Alertas del sistema (futuro) | Todos |

### Reglas de la sidebar

| Regla | Descripción |
|---|---|
| **Siempre visible** | La sidebar nunca se oculta completamente |
| **Secciones colapsables** | Los grupos de navegación pueden colapsarse |
| **Módulo activo resaltado** | El módulo actual tiene indicador visual |
| **Sin scroll** | La sidebar no tiene scroll interno |
| **Iconos + texto** | Cada entrada tiene icono y label |

---

## Capítulo 6: Contextual Navigation

| Patrón | Comportamiento |
|---|---|
| **Breadcrumbs** | Solo en páginas con profundidad > 2 niveles |
| **Tabs** | Navegación entre secciones de una misma entidad |
| **Paneles relacionados** | Datos de otras entidades visibles sin cambiar de página |
| **Drill-down** | Clic en dato agregado → detalle completo |
| **Drill-up** | Desde detalle → volver al agregado |
| **Cross-navigation** | Desde un Case → Customer Workspace → Tickets anteriores |

---

## Capítulo 7: Search Strategy

| Aspecto | Estrategia |
|---|---|
| **Búsqueda global** | Ctrl+K desde cualquier pantalla, type detection automático |
| **Búsqueda contextual** | Filtros específicos dentro de cada módulo |
| **Resultados** | Lista ordenada por relevancia (RankingEngine) |
| **Persistencia** | Filtros se mantienen al navegar dentro del mismo módulo |
| **Historial** | Últimas 10 búsquedas guardadas en localStorage |
| **Acceso directo** | Enter en resultado único abre el contexto directamente |

---

## Capítulo 8: URL & Routing Strategy

### Convenciones

```
/ [módulo] / [submódulo] / [identificador] / [acción]
```

### Ejemplos

| Ruta | Descripción |
|---|---|
| `/` | Dashboard |
| `/atenciones` | Bandeja de atención |
| `/clientes` | Búsqueda de clientes |
| `/reportes/operacion` | Reporte de operación |
| `/admin/plugins` | Administración de plugins |
| `/conocimiento/articulos` | Artículos de knowledge |

### Reglas

| Regla | Descripción |
|---|---|
| **Rutas planas** | Máximo 3 niveles de profundidad |
| **Identificadores** | Strings (dominio, ID numérico) |
| **Parámetros** | Query params para filtros (no en path) |
| **Persistencia** | El estado del módulo se mantiene al navegar internamente |
| **Navegación profunda** | URL directamente accesible desde búsqueda global |

---

## Capítulo 9: Permission-Based Navigation

| Módulo | Asesor | Supervisor | Admin | Gerencia |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Atenciones | ✅ | ✅ | ✅ | ❌ |
| Clientes | ✅ | ✅ | ✅ | ❌ |
| Reportes | ✅ | ✅ | ✅ | ✅ |
| Configuración | ❌ | ✅ | ✅ | ❌ |
| Plugins | ❌ | ✅ | ✅ | ❌ |
| Health | ❌ | ✅ | ✅ | ❌ |
| Eventos (DevTools) | ❌ | ❌ | ✅ | ❌ |
| Conocimiento | ✅ | ✅ | ✅ | ❌ |
| OCC | ❌ | ✅ | ✅ | ✅ |

### Reglas

| Regla | Descripción |
|---|---|
| **Visibilidad condicional** | Los módulos no accesibles no se muestran en la navegación |
| **Sin mensajes "no autorizado"** | Si no tienes acceso, no ves la opción |
| **Roles jerárquicos** | Admin > Supervisor > Asesor (hereda permisos hacia abajo) |
| **Sin excepciones por usuario** | Los permisos se asignan por rol, no por persona |

---

## Capítulo 10: Navigation Governance

| Regla | Descripción |
|---|---|
| Toda nueva funcionalidad debe ubicarse dentro de un módulo existente | No se crean nuevos módulos sin aprobación |
| No crear accesos duplicados | Una funcionalidad existe en un solo lugar |
| No romper la jerarquía de 3 niveles | Si se necesitan 4 niveles, rediseñar el módulo |
| Consistencia con Domain Blueprint | Los nombres de módulos deben coincidir con los bounded contexts |
| Consistencia con UX Blueprint | Todos los patrones de navegación deben reutilizar los existentes |
| Aprobación requerida para nuevos módulos | Un nuevo módulo requiere ADR + Architecture Review |

---

*Documento oficial — COPE Navigation Blueprint v1.0*
