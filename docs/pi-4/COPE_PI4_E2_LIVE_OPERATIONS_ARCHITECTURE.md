# Live Operations — Arquitectura Final

**PI-4 · Epic 2 · Módulo:** Live Operations
**Estado:** Producción ✅
**Versión:** 1.0

---

## Flujo de datos

```
LiveOperationsPage
  └── useLiveOperations()            ← ORQUESTADOR ÚNICO
        ├── useLiveOperationsData()  ← 1 SOLA LLAMADA React Query
        │     └── fetchOperacion()   ← GET /dashboard/operacion (refetch 30s)
        ├── useOperationalKpis(dtos) ← transforma → KpiData[]
        ├── useOperationalCharts(dto)← transforma → ChartGroup
        ├── useQueue(dtos)           ← transforma → QueueItemUI[]
        ├── useAgents(dtos)          ← transforma → AgentUI[]
        └── useOperationalAlerts(dtos)← transforma → AlertUI[]
              ↓
        Props distribuidas a áreas hijas
```

## Capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **DTO** | `dto/*.dto.ts` | Tipos puros del backend/mock |
| **Mapper** | `mappers/*.ts` | Transformación pura DTO → UI Contract |
| **Registry** | `registry/*.ts` | Iconos, colores, config de severidad |
| **Service** | `services/*.ts` | Llamadas HTTP delgadas |
| **Hook** | `hooks/useLiveOperations.ts` | Orquestador principal |
| **Hook** | `hooks/useLiveOperationsData.ts` | React Query centralizado |
| **Hook** | `hooks/use*.ts` (5) | Transformación pura (reciben datos por params) |
| **Mock** | `mocks/*.mock.ts` | Datos de fallback cuando backend no tiene endpoint |
| **Component** | `components/*.tsx` | UI que recibe todo por props |

## Rutas

| Ruta | Página |
|---|---|
| `/live-operations` | `LiveOperationsPage` |

## Frameworks reutilizados (PI-3)

| Framework | Componentes usados |
|---|---|
| Dashboard Shell | `DashboardShell` |
| Dashboard Grid | `DashboardGrid` |
| Dashboard Section | `DashboardSection` |
| Error Boundary | `DashboardErrorBoundary` |
| Skeleton | `SkeletonGrid` |
| KPI Framework | `KpiGrid` |
| Charts Framework | `DonutChart`, `HorizontalBarChart`, `AreaChart`, `BarChart`, `ChartGrid` |
| Widget Framework | `DashboardWidget` |

## Dependencias externas

| Dependencia | Uso |
|---|---|
| `@tanstack/react-query` | Cache, refetch, loading/error states |
| `@/lib/api` | Axios instance |
| `@/lib/filters` | `filtersToParams`, `DashboardFilters` |
| `@/contexts/FilterContext` | Global filter state |

## Fallbacks documentados

| Sección | Backend | Estrategia de fallback |
|---|---|---|
| KPIs operativos | Parcial (`operacion.kpis`) | `mocks/kpis.mock.ts` |
| Charts | Parcial (`tendenciaDiaria`) | `mocks/charts.mock.ts` |
| Cola de atención | No existe | `mocks/queue.mock.ts` |
| Agentes | No existe | `mocks/agents.mock.ts` |
| Alertas | No existe | `mocks/alerts.mock.ts` |

## Estados

| Estado | Condición | UI |
|---|---|---|
| Loading | `isLoading === true` | `SkeletonGrid` |
| Error | `isError === true` | Mensaje de error + botón reintentar |
| Empty | No hay datos | "Sin datos" / "Cola vacía" / "Sin alertas" |
| Success | Datos disponibles | KPIs, charts, listas, alertas |

## Accesibilidad

- `role="list"` en listas de cola, agentes y alertas
- `aria-label` descriptivo en cada lista
- `aria-live="polite"` en el indicador de actualización
- Jerarquía de encabezados: `DashboardSection` (h2) → `ChartHeader` (h3)
- Contraste: colores del Design System

## Rendimiento

- `React.memo` en `QueueCard`, `AgentCard`, `AlertCard`
- `useMemo` en mappers de todos los hooks de dominio
- Una sola consulta React Query (`useLiveOperationsData` llamada una vez)
- Refetch automático cada 30s con `refetchInterval`
