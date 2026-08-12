# Conversation Engine v1

## Sprint 45

### Arquitectura

```
ConversationEngine (componente React)
  │
  ├── ConversationProvider (interface por canal)
  │   ├── ZendeskConversationProvider → estilo email
  │   ├── MetaConversationProvider     → estilo WhatsApp (futuro)
  │   └── WhaticketConversationProvider → estilo WhatsApp (futuro)
  │
  └── MensajeGenerico (tipo universal)
        ├── autor, autorTipo (cliente/asesor/sistema)
        ├── tipo (texto/evento/adjunto/sistema)
        ├── canal (zendesk/wameta/whaticket/correo/chat)
        ├── contenido, timestamp, adjuntos, estado
        └── esInterno (nota interna)
```

### Tipos de mensaje

| Tipo Visual | Descripción |
|-------------|-------------|
| Cliente | Burbuja gris, alineación izquierda |
| Asesor | Burbuja azul, alineación derecha |
| Nota interna | Burbuja amber, alineación derecha, 🔒 |
| Evento | Texto itálico centrado |
| Sistema | Texto itálico centrado |

### Providers implementados

| Provider | Canal | Estilo |
|----------|-------|--------|
| `ZendeskConversationProvider` | zendesk | Email (burbujas con borde redondeado) |
| `DefaultConversationProvider` | cualquier | Genérico (burbujas simples) |

---

# Context Action Engine v1

## Sprint 46

### Arquitectura

```
getAcciones(categoria: string) → ContextAction[]
```

### Acciones por categoría

| Categoría | Acciones disponibles | Acciones futuras |
|-----------|-------------------|-----------------|
| Facturación | Responder, Nota, Estado, Categorizar | Asignar (Restafact), Crear DEV |
| Integraciones | Responder, Nota, Estado, Asignar | Abrir Monitor |
| Software | Responder, Nota, Estado, Asignar | Crear DEV |
| Logística | Responder, Nota, Estado, Asignar | Dashboard Logística |
| Administrativo | Responder, Nota, Estado, Asignar | — |
| Default | Responder, Nota, Estado, Categorizar | — |

### Archivos creados

| Archivo | Engine |
|---------|--------|
| `ConversationTypes.ts` | Conversation Engine — tipos universales |
| `ConversationEngine.tsx` | Conversation Engine — renderizador genérico |
| `providers/ZendeskProvider.tsx` | Conversation Engine — provider Zendesk |
| `providers/DefaultProvider.tsx` | Conversation Engine — provider genérico |
| `ContextActionEngine.ts` | Context Action Engine — catálogo de acciones |
| `index.ts` | Export público |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Sprints 45-46*
