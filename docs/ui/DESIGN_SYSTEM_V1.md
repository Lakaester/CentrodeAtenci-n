# COPE Design System v1

## Principios visuales

| Principio | Aplicación |
|-----------|------------|
| Máximo aprovechamiento del ancho | 4 columnas: sidebar 60px / bandeja 24% / conversación 44% / workspace 32% |
| Alta densidad de información | Filas compactas, sin tarjetas, separación por tipografía |
| Conversación primero | El centro visual es el chat. Ocupa el mayor ancho. |
| Cliente siempre visible | Workspace derecho permanentemente abierto |
| Sin modal ni ventanas nuevas | Todo en una sola vista |

---

## Layout (4 columnas)

```
┌──────┬────────────────┬──────────────────┬──────────────────┐
│SIDEBAR│   BANDEJA      │  CONVERSACIÓN    │   WORKSPACE      │
│ 60px  │   24%          │  44%             │   32%            │
│       │                │                  │                  │
│  Logo │ [Filtros]      │  #ID · Estado    │  Cliente         │
│       │                │  Asunto          │  Cliente 360°    │
│  Dash │  ┌──────────┐  │  ─────────────── │  Diagnóstico     │
│  Aten │  │ Fila 1   │  │  Bubble cliente  │  Herramientas    │
│  Cli  │  │ Fila 2   │  │  Bubble agente   │  Guías           │
│  Rep  │  │ Fila 3   │  │  Bubble cliente  │  Actividades     │
│  Conf │  └──────────┘  │                  │  Resultado       │
│       │                │                  │                  │
└──────┴────────────────┴──────────────────┴──────────────────┘
```

---

## Design Tokens

### Espaciado

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 2px | Entre icono y texto |
| `space-2` | 4px | Padding interno compacto |
| `space-3` | 8px | Entre elementos de fila |
| `space-4` | 12px | Entre secciones del workspace |
| `space-5` | 16px | Padding de columnas |

### Tipografía

| Elemento | Tamaño | Peso | Color |
|----------|--------|------|-------|
| Nombre en fila | 13px | 500 | `#1E293B` |
| Asunto en fila | 11px | 400 | `#64748B` |
| Metadatos | 10px | 400 | `#94A3B8` |
| Título conversación | 13px | 600 | `#1E293B` |
| Cuerpo chat | 13px | 400 | `#1E293B` |
| Etiqueta módulo | 9px | 600 | `#94A3B8` (uppercase) |
| Valor campo | 12px | 500 | `#1E293B` |

### Colores

| Rol | Hex | Uso |
|-----|-----|-----|
| Primary | `#2563EB` | Acento, activo |
| Text primary | `#1E293B` | Títulos, valores |
| Text secondary | `#64748B` | Metadatos |
| Text tertiary | `#94A3B8` | Labels, placeholders |
| Border | `#E2E8F0` | Separadores de columna |
| Border light | `#F1F5F9` | Separadores de fila |
| Bubble agent | `#2563EB` | Fondo burbuja asesor |
| Bubble client | `#F1F5F9` | Fondo burbuja cliente |
| Hover row | `#F8F9FA` | Hover en bandeja |
| Active row | `#EFF6FF` | Fila seleccionada |

### Alturas

| Elemento | Alto |
|----------|------|
| Fila de bandeja | 56px |
| Header conversación | 52px |
| Barra de pestañas | 36px |

---

## Componentes

### ConversationRow
- Formato: fila compacta con borde inferior
- Sin bordes redondeados
- Avatar circular (28px)
- Indicador de estado (dot)
- Hover: `#F8F9FA`
- Active: `#EFF6FF`

### ChatBubble
- Sin bordes externos
- Cliente: fondo `#F1F5F9`, alineación izquierda
- Asesor: fondo `#2563EB`, texto blanco, alineación derecha
- Sin sombras
- Label "Nota interna" / "Respuesta pública" en tamaño 10px

### WorkspacePanel
- Sin bordes entre secciones
- Separación por espaciado (12px)
- Títulos de sección en 9px uppercase
- Valores en 12px medium

---

## Patrones de UX

| Patrón | Inspiración | Implementación COPE |
|--------|-------------|-------------------|
| Inbox rows | Front, Intercom | Filas sin tarjetas, border-bottom |
| Chat bubbles | Intercom, HubSpot | Sin bordes, colores planos |
| Workspace fijo | HubSpot Inbox | Panel derecho nunca se oculta |
| Filtros en header | Linear | Filtros tipo pill en cabecera de bandeja |
| Scroll invisible | Linear, Notion | `scrollbar-width: none` en todos los paneles |

---

*Documento generado automáticamente por COPE Product Development Standard*
*Design System v1 — Sprint 35*
