# Omnichannel Inbox Specification v1

## Principio

La Bandeja de COPE no muestra Tickets. Muestra Atenciones.

Cada Atención tiene un canal de origen, un ticket ID original y un estado original.

---

## Canales soportados

| Canal | Badge | Estado | Provider |
|-------|-------|--------|----------|
| Zendesk | `✉ Zendesk` | ✅ Integrado | `ZendeskProvider` |
| Meta | `🟢 Meta` | 🔧 Próximamente | — |
| Whaticket | `💬 Whaticket` | 🔧 Próximamente | — |
| Chat | `🎧 Chat` | 🔧 Próximamente | — |
| Correo | `📧 Correo` | 🔧 Próximamente | — |

---

## Arquitectura de renderizado

```
Bandeja (inbox única)
│
├── AtencionRow (fila genérica, muestra ChannelBadge)
│
├── ConversationRenderer
│   ├── ZendeskRenderer      ← activo
│   ├── MetaRenderer         ← placeholder
│   ├── WhaticketRenderer    ← placeholder
│   └── PlaceholderRenderer  ← default
│
└── WorkspacePanel (siempre visible)
    ├── Cliente
    ├── Cliente 360°
    ├── Diagnóstico
    ├── Herramientas
    ├── Guías
    ├── Actividades
    └── Resultado
```

---

## Componentes

| Componente | Propósito |
|-----------|-----------|
| `ChannelBadge` | Badge visual del canal (icono + nombre) |
| `ChannelDot` | Indicador compacto del canal |
| `ConversationRenderer` | Enruta al renderizador según el canal |
| `AtencionRow` | Fila de inbox omnicanal (sin referencia a Zendesk) |

---

## Placeholders

Los canales no integrados se muestran en la bandeja como botones deshabilitados con el texto "Próximamente".  
Nunca se oculta la arquitectura. El Product Owner debe ver que COPE nació multicanal.

---

## Cumplimiento DAP-017

| Requisito | Estado |
|-----------|--------|
| No hay nuevas ventanas | ✅ |
| No hay nuevos menús | ✅ |
| No hay nuevas barras laterales | ✅ |
| Todo encaja en el Workspace existente | ✅ |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprint 36 — Omnichannel Inbox Foundation*
