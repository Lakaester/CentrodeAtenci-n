# Collaboration Platform — Arquitectura Final

**PI-4 · Epic 4 · Módulo:** Collaboration Platform
**Estado:** Producción ✅
**Versión:** 1.0

---

## Flujo de datos

```
CollaborationPage
  └── useCollaboration() ← ORQUESTADOR ÚNICO
        ├── useCollaborationData() ← 1 SOLA LLAMADA React Query (refetch 30s)
        │     └── fetchCollaboration(filters) → GET /dashboard/collaboration
        │         └── isCollaborationResponse() type guard
        ├── useActivityFeed(dtos?)           → ActivityUI[]
        ├── useInternalNotes(dtos?)          → NoteUI[]
        ├── useMentions(dtos?)               → MentionUI[]
        ├── useFollowers(dtos?)              → FollowerUI[]
        └── useTimeline(dtos?)               → TimelineUI[]
              ↓
        Props distribuidas a 5 áreas (sin hooks en componentes)
```

## Capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| **DTO** | `dto/*.dto.ts` | Tipos puros con uniones discriminadas |
| **Mapper** | `mappers/*.ts` | Transformación pura DTO → UI Contract. Sin JSX, sin React, sin estilos. |
| **Registry** | `registry/*.ts` | Configuración pura: colores, labels, prioridad. Sin lógica de negocio. |
| **Service** | `services/collaborationService.ts` | HTTP + Type Guard. Sin `any`, sin casts inseguros. |
| **Data Hook** | `hooks/useCollaborationData.ts` | React Query centralizado + `dataUpdatedAt` |
| **Orchestrator** | `hooks/useCollaboration.ts` | 1 llamada a React Query → 5 hooks de dominio |
| **Domain Hooks** | `hooks/use*.ts` (5) | Reciben DTOs, aplican mapper, retornan `[]` si undefined |
| **Component** | `components/*.tsx` | Solo props. Sin hooks. React.memo en cards. |

## Rutas

| Ruta | Página |
|---|---|
| `/collaboration` | `CollaborationPage` |

## DTOs

| DTO | Tipos clave |
|---|---|
| `ActivityDTO` | `ActivityType` (10), `ActivityPriority` (3), `ActivityStatus` (3) |
| `InternalNoteDTO` | `NoteCategory` (8), `NoteStatus` (2), `Visibility` (3) |
| `MentionDTO` | `MentionStatus` (3), `MentionPriority` (3) |
| `FollowerDTO` | `FollowerReason` (6) |
| `TimelineDTO` | `TimelineEventType` (14), `TimelineSource` (5) |

## Domain Hooks

| Hook | Parámetro | Retorno |
|---|---|---|
| `useActivityFeed` | `ActivityDTO[]` | `ActivityUI[]` |
| `useInternalNotes` | `InternalNoteDTO[]` | `NoteUI[]` |
| `useMentions` | `MentionDTO[]` | `MentionUI[]` |
| `useFollowers` | `FollowerDTO[]` | `FollowerUI[]` |
| `useTimeline` | `TimelineDTO[]` | `TimelineUI[]` |

## Backend Integration

| Endpoint | Estado | Service |
|---|---|---|
| `GET /dashboard/collaboration` | Endpoint no existe aún → `[]` en cada colección | `fetchCollaboration()` con type guard |

## Estados

| Estado | Condición | UI |
|---|---|---|
| Loading | `isLoading === true` | `SkeletonGrid` |
| Error | `isError === true` | Mensaje + botón reintentar |
| Success | Datos disponibles | 5 áreas con contenido |

## Performance

- `React.memo` en 5 cards: `ActivityCard`, `NoteCard`, `MentionCard`, `FollowerCard`, `TimelineCard`
- `useMemo` en mappers de hooks de dominio
- Una sola consulta React Query (`useCollaborationData`)
- Refetch automático cada 30s
- Mock data NO incluido en production build (5 imports eliminados)

## Accesibilidad

- `role="list"` + `aria-label` en ActivityList, NotesList, MentionsList, FollowersList, TimelineList
- `role="listitem"` en cards
- `aria-label="No leído"` en MentionCard
- `aria-live="polite"` en LiveRefreshIndicator
- Jerarquía de encabezados: `DashboardSection` (h2)
