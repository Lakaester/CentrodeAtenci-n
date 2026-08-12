# Supervisor Workspace — Arquitectura Final

**PI-4 · Epic 3 · Módulo:** Supervisor Workspace
**Estado:** Producción ✅
**Versión:** 1.0

---

## Flujo de datos

```
SupervisorPage
  └── useSupervisor() ← ORQUESTADOR ÚNICO
        ├── useSupervisorData() ← 1 SOLA LLAMADA React Query (refetch 30s)
        │     └── fetchSupervisor(filters) → GET /dashboard/supervisor
        │         └── Type Guard → isSupervisorResponse()
        ├── useAgentOverview(dtos?)          → AgentOverviewUI[]
        ├── useConversationMonitor(dtos?)    → ConversationUI[]
        ├── usePerformanceDashboard(dto?)    → { kpis: KpiData[], evolucion: LineData }
        └── useSupervisorActions(dtos?)      → ResolvedAction[]
              ↓
        Props distribuidas a 4 áreas (sin hooks en componentes)
```

## Capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **DTO** | `dto/*.dto.ts` | Tipos puros con uniones discriminadas |
| **Mapper** | `mappers/*.ts` | Transformación pura DTO → UI Contract. Sin JSX, sin estilos, sin iconos. |
| **Registry** | `registry/*.ts` | Configuración pura: colores, labels, prioridad. Sin lógica de negocio. |
| **Service** | `services/supervisorService.ts` | Llamada HTTP + Type Guard. Sin `any`, sin casts inseguros. |
| **Hook** | `hooks/useSupervisorData.ts` | React Query centralizado + `dataUpdatedAt` |
| **Hook** | `hooks/useSupervisor.ts` | Orquestador: 1 llamada a React Query, 4 hooks de dominio |
| **Hook** | `hooks/use*.ts` (4) | Transformación pura. Reciben datos por parámetro. Fallback mock propio. |
| **Mock** | `mocks/*.mock.ts` | Datos de fallback con fechas dinámicas |
| **Component** | `components/*.tsx` | Solo props. Sin hooks. React.memo en cards y listas. |

## Rutas

| Ruta | Página |
|---|---|
| `/supervisor` | `SupervisorPage` |

## DTOs

| DTO | Tipos clave |
|---|---|
| `AgentOverviewDTO` | `AgentStatus` = `"disponible" \| "ocupado" \| "pausa" \| "offline"` |
| `ConversationDTO` | `ConversationPriority` (3), `ConversationStatus` (5) |
| `PerformanceDTO` | `PerformanceMetricDTO` con trend opcional |
| `SupervisorActionDTO` | `ActionCategory` (5), `ActionPriority` (3) |

## Hooks

| Hook | Parámetro | Retorno | Fallback |
|---|---|---|---|
| `useAgentOverview` | `AgentOverviewDTO[]` | `AgentOverviewUI[]` | `MOCK_AGENT_OVERVIEW_DTOS` |
| `useConversationMonitor` | `ConversationDTO[]` | `ConversationUI[]` | `MOCK_CONVERSATION_DTOS` |
| `usePerformanceDashboard` | `PerformanceDTO` | `{ kpis, evolucion }` | `MOCK_PERFORMANCE_DTO` |
| `useSupervisorActions` | `SupervisorActionDTO[]` | `ResolvedAction[]` | `MOCK_ACTION_DTOS` |

## Frameworks reutilizados (PI-3 y PI-4)

| Framework | Componentes usados |
|---|---|
| Dashboard Shell | `DashboardShell` |
| Dashboard Grid | `DashboardGrid` |
| Dashboard Section | `DashboardSection` |
| Error Boundary | `DashboardErrorBoundary` |
| Skeleton | `SkeletonGrid` |
| KPI Framework | `KpiGrid` |
| Charts Framework | `AreaChart` |
| Widget Framework | `DashboardWidget` |
| Live Operations | `LiveRefreshIndicator`, `getOperationalKpiIcon` |

## Backend Integration

| Endpoint | Estado | Service |
|---|---|---|
| `GET /dashboard/supervisor` | Endpoint no existe aún → fallback a mocks | `fetchSupervisor()` con type guard |

## Fallbacks

| Sección | Endpoint | Fallback |
|---|---|---|
| Agent Overview | No existe | `mocks/agentOverview.mock.ts` — 6 asesores |
| Conversation Monitor | No existe | `mocks/conversation.mock.ts` — 6 conversaciones |
| Performance Dashboard | No existe | `mocks/performance.mock.ts` — 6 KPIs + evolución |
| Supervisor Actions | No existe | `mocks/supervisorActions.mock.ts` — 6 acciones |

## Estados

| Estado | Condición | UI |
|---|---|---|
| Loading | `isLoading === true` | `SkeletonGrid` |
| Error | `isError === true` | Mensaje de error + botón reintentar |
| Empty | No hay datos | "Sin asesores" / "Sin conversaciones" / etc. |
| Success | Datos disponibles | Cards, KPIs, charts, acciones |

## Performance

- `React.memo` en 6 componentes: `AgentOverviewCard`, `ConversationCard`, `SupervisorActionCard`, `AgentOverviewList`, `ConversationList`, `SupervisorActionsList`
- `useMemo` en mappers de hooks de dominio
- Una sola consulta React Query (`useSupervisorData` llamada una vez)
- Refetch automático cada 30s con `refetchInterval`

## Accesibilidad

- `role="list"` y `aria-label` en listas de asesores, conversaciones y acciones
- `role="listitem"` en cards
- Botón de reintentar con texto visible
- Jerarquía de encabezados: `DashboardSection` (h2) → Chart (h3)

## Type Safety

- 0 usos de `any` en el módulo
- Type guard `isSupervisorResponse()` valida respuesta del backend
- Uniones discriminadas en todos los DTOs
- Sin `as` casts inseguros
