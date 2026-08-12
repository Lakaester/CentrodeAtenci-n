# COPE PI-3 EPIC 1 — IMPLEMENTATION PLAN v1.0

**Epic:** Executive Dashboard
**Prioridad:** P2
**Release:** 1
**Dependencias:** Todos los Blueprints v1.0 + PI-3 Epic Specifications v1.0
**Estado:** Planificación

---

## Pack 1: Dashboard Foundation

### Objetivo
Establecer la estructura base del Executive Dashboard que servirá como contenedor para todos los widgets, KPIs y gráficos.

### Alcance
- Ruta `/dashboard` mapeada al componente DashboardPage
- Layout base del dashboard con grid de 3 columnas
- Header del dashboard con saludo, fecha y nombre del asesor
- Esqueleto (skeleton) para estado de carga
- Estado vacío para cuando no hay datos
- Navegación desde `/` hacia el dashboard (redirección)

### Fuera de alcance
- KPIs reales (Pack 2)
- Gráficos (Pack 3)
- Filtros (Pack 4)
- Datos del backend (Pack 6)

### Dependencias
- `CopeLayout` existente (sidebar + header)
- Router (ya tiene ruta `/dashboard` apuntando a `Inicio.tsx`)
- Design System (Layout System, Empty State, Skeleton)

### Riesgos
- Ninguno — es solo estructura visual sin datos

### Componentes afectados
| Componente | Acción |
|---|---|
| `Inicio.tsx` | Reemplazar contenido actual por nuevo DashboardPage |
| `CopeLayout.tsx` | Sin cambios |

### Servicios afectados
Ninguno — aún no se integra con backend

### Hooks afectados
Ninguno — datos mockeados internamente

### Estado esperado
El dashboard se renderiza con un grid vacío de 3 columnas, header con saludo y skeletons visibles durante la carga.

### Definition of Done
- Ruta `/dashboard` funcional
- Grid de 3 columnas implementado
- Header con saludo + fecha + nombre del asesor
- Skeleton visible durante carga simulada
- Estado vacío visible si no hay datos

### Criterios de aceptación
- El dashboard se renderiza sin errores
- La navegación desde `/` redirige a `/dashboard`
- El skeleton se muestra durante la carga
- El layout es responsivo (3 columnas → 2 → 1)

### Estrategia de pruebas
- Prueba de renderizado del layout
- Prueba de estados (carga, vacío)
- Prueba de responsividad

### Estrategia de rollback
Revertir cambios en `Inicio.tsx`. La ruta `/dashboard` seguirá funcionando.

---

## Pack 2: Executive KPIs

### Objetivo
Implementar los indicadores clave del asesor en el dashboard: casos abiertos, resueltos hoy, tiempo promedio, SLA personal.

### Alcance
- KPIWidget componente reutilizable (label, valor, delta, tendencia)
- Grid de KPIs en el dashboard (4 cards)
- KPIs mockeados inicialmente (Pack 6 los conectará a datos reales)
- Tooltip con detalle del KPI
- Indicador de tendencia (↑, ↓, →) con color

### Fuera de alcance
- KPIs reales del backend (Pack 6)
- Gráficos (Pack 3)
- Filtros (Pack 4)

### Dependencias
- Design System (capítulo 4: KPI, Card)
- Pack 1 (Dashboard Foundation)

### Riesgos
- Mock data podría diferir del formato real del backend

### Componentes afectados
| Componente | Acción |
|---|---|
| `DashboardPage.tsx` | Agregar grid de KPIs |
| `KPIWidget.tsx` | Nuevo componente |

### Servicios afectados
Ninguno — datos mockeados

### Hooks afectados
`useDashboard.ts` — nuevo hook con data mock + loading simulado

### Estado esperado
4 KPIs visibles en el dashboard: casos abiertos, resueltos hoy, tiempo promedio de resolución, cumplimiento SLA. Cada uno con valor, label y tendencia.

### Definition of Done
- KPIWidget implementado
- Grid de 4 KPIS funcional
- Tooltips informativos
- Indicadores de tendencia visibles

### Criterios de aceptación
- KPIs se renderizan correctamente
- Tooltips funcionales
- Tendencia visible con color correcto (verde/subida, rojo/bajada)
- Responsivo (4 → 2 → 1 columna)

### Estrategia de pruebas
- Prueba de renderizado de KPIWidget
- Prueba de colores de tendencia
- Prueba de tooltip

### Estrategia de rollback
Remover KPIWidget y el grid de KPIs del DashboardPage

---

## Pack 3: Executive Charts

### Objetivo
Agregar gráficos visuales al dashboard para mostrar tendencias y distribución de casos.

### Alcance
- Gráfico de tendencia diaria (líneas: últimos 7 días)
- Gráfico de distribución por estado (dona: abiertos, pendientes, resueltos)
- Gráfico de carga por hora (barras)
- ECharts como librería de visualización (ya existe en el proyecto)
- Tooltips interactivos en cada gráfico

### Fuera de alcance
- Datos reales del backend (Pack 6)
- Exportación de gráficos
- Personalización por el usuario

### Dependencias
- ECharts (ya instalado en frontend)
- Design System (capítulo 4: Card)
- Pack 1 (Foundation)

### Riesgos
- Complejidad de configuración de ECharts

### Componentes afectados
| Componente | Acción |
|---|---|
| `DashboardPage.tsx` | Agregar grid de gráficos debajo de KPIs |
| `TrendChart.tsx` | Nuevo componente — gráfico de líneas |
| `DistributionChart.tsx` | Nuevo componente — gráfico de dona |
| `HourlyChart.tsx` | Nuevo componente — gráfico de barras |

### Servicios afectados
Ninguno — datos mockeados

### Hooks afectados
`useDashboard.ts` — agregar data mock para gráficos

### Estado esperado
3 gráficos visibles debajo de los KPIs, con datos mock que muestren tendencias y distribución.

### Definition of Done
- 3 gráficos implementados con ECharts
- Tooltips funcionales
- Layout responsivo
- Gráficos ocupan el ancho disponible

### Criterios de aceptación
- Gráficos se renderizan correctamente
- Tooltips funcionales
- Sin errores en consola de ECharts
- Responsivos

### Estrategia de pruebas
- Prueba de renderizado de cada gráfico
- Prueba de cambio de datos

### Estrategia de rollback
Remover componentes de gráficos del DashboardPage

---

## Pack 4: Global Filters

### Objetivo
Agregar filtros globales al dashboard que permitan al asesor filtrar por período, canal y categoría. Los filtros deben persistir al navegar a otras secciones.

### Alcance
- Filtro de período (fecha inicio / fecha fin)
- Filtro de canal (dropdown con opciones)
- Filtro de categoría (dropdown con opciones)
- Botón "Aplicar" y "Limpiar"
- Integración con FilterContext existente
- Persistencia de filtros al navegar entre reportes

### Fuera de alcance
- Filtros avanzados (Pack futuro)
- Guardado de preferencias de filtros

### Dependencias
- `FilterContext` (ya existe)
- `FilterBar` (ya existe — verificar integración)
- Design System (capítulo 4: Filter Bar)
- Pack 1 (Foundation)

### Riesgos
- FilterContext podría no estar preparado para los nuevos filtros

### Componentes afectados
| Componente | Acción |
|---|---|
| `DashboardPage.tsx` | Agregar FilterBar en la parte superior |
| `FilterBar.tsx` | Verificar que los filtros necesarios están disponibles |
| `FilterContext.tsx` | Sin cambios (ya soporta los filtros) |

### Servicios afectados
Ninguno — los filtros afectan consultas del backend (Pack 6)

### Hooks afectados
`useDashboard.ts` — consumir FilterContext

### Estado esperado
Filtros visibles en la parte superior del dashboard. Al cambiar un filtro y presionar "Aplicar", los KPIs y gráficos se actualizan (con datos mock por ahora).

### Definition of Done
- FilterBar visible en el dashboard
- Filtro de período funcional
- Filtro de canal funcional
- Filtro de categoría funcional
- Botón "Aplicar" actualiza los datos mostrados
- Botón "Limpiar" resetea los filtros

### Criterios de aceptación
- Filtros se renderizan correctamente
- Al aplicar filtros, los datos cambian (mock)
- Al limpiar, los datos vuelven al estado inicial
- Filtros persisten al navegar entre reportes

### Estrategia de pruebas
- Prueba de renderizado de filtros
- Prueba de cambio de filtros
- Prueba de persistencia

### Estrategia de rollback
Remover FilterBar del DashboardPage

---

## Pack 5: Dashboard Widgets

### Objetivo
Agregar widgets informativos al dashboard: casos prioritarios, actividad reciente y acceso rápido a módulos.

### Alcance
- Widget de "Casos Prioritarios" — lista de los 5 casos más urgentes por SLA
- Widget de "Actividad Reciente" — últimas 5 acciones del asesor
- Widget de "Acceso Rápido" — botones a Atenciones, Clientes, Reportes
- Todos los widgets con datos mock

### Fuera de alcance
- Widgets configurables por el usuario
- Widgets de terceros

### Dependencias
- Design System (capítulo 4: Card, Alert)
- Pack 1 (Foundation)
- Pack 2 (KPIs)

### Riesgos
- Ninguno — datos mock

### Componentes afectados
| Componente | Acción |
|---|---|
| `DashboardPage.tsx` | Agregar widgets debajo de KPIs y gráficos |
| `PriorityCasesWidget.tsx` | Nuevo componente |
| `RecentActivityWidget.tsx` | Nuevo componente |
| `QuickAccessWidget.tsx` | Nuevo componente |

### Servicios afectados
Ninguno — datos mockeados

### Hooks afectados
`useDashboard.ts` — agregar data mock para widgets

### Estado esperado
3 widgets visibles debajo de los gráficos, con datos mock y navegación funcional en "Acceso Rápido".

### Definition of Done
- Widget de casos prioritarios funcional
- Widget de actividad reciente funcional
- Widget de acceso rápido funcional con navegación
- Layout responsivo

### Criterios de aceptación
- Widgets se renderizan correctamente
- Casos prioritarios ordenados por SLA
- Actividad reciente ordenada por fecha descendente
- Acceso rápido navega a los módulos correctos

### Estrategia de pruebas
- Prueba de renderizado de cada widget
- Prueba de navegación en acceso rápido

### Estrategia de rollback
Remover widgets del DashboardPage

---

## Pack 6: Backend Integration

### Objetivo
Conectar el dashboard con datos reales del backend, reemplazando todos los datos mock.

### Alcance
- Crear endpoint `GET /api/dashboard/executive` que devuelva KPIs, tendencias, distribución y casos prioritarios
- Implementar DashboardService en backend
- Implementar DashboardController
- Conectar el frontend al endpoint real
- Remover todos los datos mock
- Manejar estados de carga, error y vacío

### Fuera de alcance
- Cache de dashboard
- WebSockets para datos en tiempo real

### Dependencias
- v_unificado_norm (BD existente)
- Configuration Platform (para límites de SLA)
- Case Manager (core congelado)
- Packs 1-5 (frontend)

### Riesgos
- Performance de consultas SQL en v_unificado_norm
- El endpoint podría ser lento si no está optimizado

### Componentes afectados
| Componente | Acción |
|---|---|
| `useDashboard.ts` | Remover mock data, conectar al endpoint real |
| `DashboardPage.tsx` | Pasar datos reales a todos los widgets |

### Servicios afectados
| Servicio | Acción |
|---|---|
| `DashboardService` | Nuevo — lógica de agregación de KPIs |
| `DashboardController` | Nuevo — endpoint GET /api/dashboard/executive |

### Hooks afectados
`useDashboard.ts` — reemplazar mock data por llamada API real

### Estado esperado
El dashboard muestra datos reales del backend. KPIs, gráficos, casos prioritarios y actividad reciente se cargan desde la API.

### Definition of Done
- Endpoint `GET /api/dashboard/executive` funcional
- DashboardService implementado
- DashboardController implementado
- Frontend consume endpoint real
- Estados de carga y error manejados
- Sin datos mock

### Criterios de aceptación
- KPIs calculados correctamente desde la BD
- Gráficos con datos reales
- Casos prioritarios ordenados por SLA
- Tiempo de carga < 3 segundos
- Estado de error visible si el backend falla

### Estrategia de pruebas
- Prueba unitaria de DashboardService
- Prueba de integración del endpoint
- Prueba de frontend con datos reales

### Estrategia de rollback
Volver a datos mock temporalmente

---

## Pack 7: QA

### Objetivo
Ejecutar pruebas funcionales y de integración del Executive Dashboard completo.

### Alcance
- Pruebas unitarias de todos los componentes nuevos
- Pruebas de integración del endpoint
- Pruebas de frontend con datos mock y reales
- Pruebas de responsividad
- Pruebas de estados (carga, error, vacío)
- Corrección de bugs detectados

### Fuera de alcance
- Pruebas de carga
- Pruebas de seguridad

### Dependencias
- Packs 1-6 completados

### Riesgos
- Bugs podría retrasar el cierre del Epic

### Componentes afectados
Todos los componentes del dashboard

### Estado esperado
Dashboard completamente funcional, probado y libre de bugs críticos.

### Definition of Done
- 100% de pruebas unitarias pasando
- Pruebas de integración del endpoint pasando
- Sin bugs críticos ni altos
- Dashboard probado en Chrome, Firefox, Edge

### Criterios de aceptación
- Todos los tests pasan
- Dashboard funciona sin errores en consola
- Responsivo en 1366, 1440 y 1920px

### Estrategia de pruebas
- `npm run test` para unitarias
- Pruebas manuales para responsividad

### Estrategia de rollback
N/A — solo pruebas

---

## Pack 8: Hardening

### Objetivo
Endurecer el Executive Dashboard para producción: performance, seguridad, accesibilidad y documentación.

### Alcance
- Revisión de performance (carga < 2s, Core Web Vitals)
- Verificación de accesibilidad (contraste, teclado, aria-labels)
- Documentación del dashboard en ADR si aplica
- Actualización de CHANGELOG
- Code review final

### Fuera de alcance
- Cambios funcionales
- Nuevas características

### Dependencias
- Packs 1-7 completados
- Architecture Freeze v1.0

### Riesgos
- Problemas de performance podrían requerir optimización de consultas SQL

### Componentes afectados
Todos los componentes del dashboard

### Estado esperado
Dashboard listo para producción.

### Definition of Done
- Performance dentro del budget (< 2s)
- Accesibilidad verificada
- CHANGELOG actualizado
- Code review aprobado

### Criterios de aceptación
- Lighthouse performance ≥ 90
- Lighthouse accessibility ≥ 90
- Sin errores de accesibilidad graves
- CHANGELOG documenta el nuevo dashboard

### Estrategia de pruebas
- Lighthouse CI
- Code review manual

### Estrategia de rollback
N/A — solo hardening

---

## Resumen de Implementation Packs

| Pack | Nombre | Esfuerzo | Dependencias | Entregable |
|---|---|---|---|---|
| 1 | Dashboard Foundation | Bajo | — | Layout base con skeleton |
| 2 | Executive KPIs | Bajo | Pack 1 | 4 KPIs con tendencia |
| 3 | Executive Charts | Medio | Pack 1 | 3 gráficos ECharts |
| 4 | Global Filters | Bajo | Pack 1 | FilterBar integrado |
| 5 | Dashboard Widgets | Medio | Pack 1, 2 | 3 widgets informativos |
| 6 | Backend Integration | Alto | Packs 1-5 | Endpoint + datos reales |
| 7 | QA | Medio | Packs 1-6 | Tests + bugs corregidos |
| 8 | Hardening | Bajo | Packs 1-7 | Dashboard listo para producción |

---

*Documento oficial — COPE PI-3 Epic 1 Implementation Plan v1.0*
