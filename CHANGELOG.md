# Changelog

## AGENT-001 — Sincronización de Agentes + Asignación

### Nuevo
- `GET /api/zendesk/agents` — endpoint con cache de 5 min que lista agentes activos de Zendesk
- `AgentStore.ts` — caché local de agentes con sincronización automática al iniciar backend
- `AssignModal.tsx` — modal moderno con buscador, avatar, rol y estado para asignar tickets
- Asignación escribe directamente en Zendesk vía PUT /tickets/{id}/assign
- `assigneeName` ahora se resuelve en la bandeja (inbox) desde el assignee_id de Zendesk
- Botón "Asignar" en WorkspaceArea ya no usa `prompt()`

### Técnico
- Eliminado completamente el `prompt()` del navegador para IDs de agente
- 11 agentes sincronizados desde Zendesk (admins + agents)
- Cache con TTL de 5 minutos, refrescable vía `?sync=true`

## WKS-001 — Workspace de Atención (Primera versión funcional)

### Nuevo
- Layout de 3 columnas en `/atenciones`: Bandeja | Workspace | Cliente 360
- Al hacer clic en un ticket de la bandeja se abre el Workspace en la columna central
- Workspace muestra: asunto, estado, prioridad, canal, ID, fechas, cliente, email
- Conversación estilo chat (cliente izquierda, agente derecha) con hora, autor, tipo, adjuntos
- Chips de estado, prioridad, canal e ID sobre la conversación
- Customer360Panel con datos del cliente (nombre, email, empresa, teléfono, ID, etc.)
- Skeleton mientras carga el ticket
- Componente Retry en caso de error
- Cancelación de petición anterior al cambiar de ticket (AbortController)
- Ticket seleccionado permanece resaltado en la bandeja
- Componentes independientes: `TicketWorkspace`, `ConversationPanel`, `ConversationMessage`, `ConversationSkeleton`, `Customer360Panel`, `ConversationHeader`, `WorkspaceEmptyState`, `WorkspaceErrorState`

### Técnico
- Nuevo hook `useTicketDetail` con AbortController para cancelación
- Consume `/api/zendesk/tickets/{id}` y `/api/zendesk/tickets/{id}/comments`

## ZD-004 — Migración a Zendesk Views API

### Cambios
- `GET /api/zendesk/inbox` ahora consulta vistas oficiales en vez de `/api/v2/tickets.json`
- Nueva fuente: `views/360199057454/tickets.json` (no resueltos)
- Nuevas fuente: `views/360199057434/tickets.json` (recién resueltos)
- Clasificación automática: Pendientes (new/pending), Abiertos (open/hold), Recién resueltos (solved)
- Constantes de vistas en `ZendeskViewIds.ts`
- Documentación técnica en `modules/zendesk/README.md`
