# Conversation Workspace v2 — Specification

## Sprint 37

### Objetivo

Convertir el panel central del Workspace en una experiencia de trabajo profesional, no solo en un visor de mensajes.

---

## Componentes creados

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| `ConversationHeader` | `ConversationHeader.tsx` | Cabecera fija con cliente, dominio, canal, ticket ID, estado, prioridad, SLA, fechas, tiempo abierto |
| `QuickSummary` | `QuickSummary.tsx` | Panel compacto: primer/último contacto, cantidad de respuestas, tiempo de primera respuesta |
| `MessageTimeline` | `MessageTimeline.tsx` | Timeline con tipos visuales (cliente, asesor, nota interna, evento, adjunto). Búsqueda interna. Separadores por día. |
| `ContextActions` | `ContextActions.tsx` | 8 botones contextuales (todos deshabilitados): Responder, Nota interna, Asignar, Cambiar estado, Categorizar, Crear DEV, Programar Meet, Escalar |

---

## Tipos de mensaje en el Timeline

| Tipo visual | Icono | Color | Estilo |
|-------------|-------|-------|--------|
| Cliente | MessageSquare | `#1E293B` | Fondo `#F1F5F9`, alineación izquierda |
| Asesor | User | `#2563EB` | — |
| Nota interna | Shield | `#D97706` | Fondo amber-50, borde amber-200, etiqueta "🔒 Nota interna" |
| Evento | RefreshCw | `#94A3B8` | Itálico, centrado |
| Adjunto | Paperclip | `#64748B` | — |

## Separadores automáticos

- Por día: "Hoy", "Ayer", "miércoles 15 de julio"
- Línea horizontal con texto centrado

## Acciones contextuales (preparadas, sin implementar)

Responder · Nota interna · Asignar · Cambiar estado · Categorizar · Crear DEV · Programar Meet · Escalar

Todas aparecen como botones deshabilitados con estilo `bg-[#F1F5F9] text-[#94A3B8]`.

---

*Documento generado automáticamente por COPE Product Development Standard*
