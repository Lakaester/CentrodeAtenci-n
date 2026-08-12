# UX-001: Reestructuración de Navegación

## Problema detectado

Existían dos sistemas de navegación controlando la misma información:

```
Barra lateral:                     Pestañas en Bandeja:
┌─────────────────────┐            ┌──────────────────────┐
│ ATENCIONES          │            │ Pendientes │ En      │
│   Dashboard         │            │ proceso    │ Cerrados│
│   Bandeja           │            └──────────────────────┘
│   Mis Tickets       │ ← redundante con tabs
│   Pendientes        │ ← redundante con tabs
│   En Proceso        │ ← redundante con tabs
│   Resueltos         │ ← redundante con tabs
│ CLIENTES            │
│ REPORTES            │
│ CONFIGURACIÓN       │
└─────────────────────┘
```

**Problemas:**
- 6 items en sidebar para lo que es una sola funcionalidad (Atenciones)
- Los filtros de estado vivían en dos lugares: sidebar y pestañas internas
- Cada estado tenía su propia ruta (`/atenciones/pendientes`, `/atenciones/en-proceso`, etc.)
- El usuario no sabía si cambiar de pestaña o de item del menú

---

## Solución aplicada

### Antes

```
SIDEBAR
├── Dashboard
├── ATENCIONES
│   ├── Dashboard
│   ├── Bandeja
│   ├── Mis Tickets
│   ├── Pendientes
│   ├── En Proceso
│   └── Resueltos
├── CLIENTES
├── REPORTES
├── ZENDESK
├── CONFIGURACIÓN
└── AYUDA
```

### Después

```
SIDEBAR
├── DASHBOARD
├── ATENCIONES
│   └── Bandeja          ← Único punto de entrada
├── CLIENTES
├── REPORTES
├── CONOCIMIENTO
├── CONFIGURACIÓN
└── [Usuario / Ayuda / Cerrar sesión] en footer
```

### Bandeja (única pantalla)

```
┌──────────────────────────────────────────────────┐
│ Todas │ Sin asignar │ Mis Atenciones │ Esperando │
│ Cliente │ Resueltas │ Cerradas                    │
├──────────────────────────────────────────────────┤
│ [Buscar...]  [Canal: ▼] [Estado: ▼] [Categoría] │
├──────────────────────────────────────────────────┤
│ Lista de tickets                                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Decisiones de UX

| Decisión | Justificación |
|----------|--------------|
| **Eliminar rutas por estado** | Cada estado es un filtro, no una pantalla. Siguen el patrón de Linear y Front. |
| **Unificar en una sola Bandeja** | El usuario siempre sabe dónde están sus tickets. No hay ambigüedad. |
| **Filtros tipo "pill" en primera fila** | Misma UX que Intercom: los filtros son botones, no tabs. Se ven los conteos. |
| **Barra de filtros en segunda fila** | Separación clara entre "qué ver" (filtro de vista) y "cómo filtrar" (canal, estado, categoría). |
| **Eliminar "Dashboard" del grupo ATENCIONES** | Dashboard es un módulo separado, no una vista de Atenciones. |
| **Agregar "CONOCIMIENTO"** | Nueva sección para guías y base de conocimiento. |
| **Mover ZENDESK a su propia ruta** | Zendesk es un canal, no un filtro de la bandeja principal. Se accede directamente. |
| **Footer compacto** | Usuario, Ayuda y Cerrar sesión no son módulos del sistema, son opciones de usuario. |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `config/cope-navigation.ts` | Simplificado: DASHBOARD, ATENCIONES/Bandeja, CLIENTES, REPORTES, CONOCIMIENTO, CONFIGURACIÓN. Eliminados Mis Tickets, Pendientes, En Proceso, Resueltos. |
| `components/atenciones/BandejaInteligente.tsx` | Nuevos filtros: Todas, Sin asignar, Mis Atenciones, Esperando Cliente, Resueltas, Cerradas. Barra de filtros con Canal, Estado, Categoría, Búsqueda. |
| `router/index.tsx` | Eliminadas rutas `/atenciones/mis-tickets`, `/atenciones/pendientes`, `/atenciones/en-proceso`, `/atenciones/resueltos`. |

---

## Comparativa

| Aspecto | Antes | Después |
|---------|-------|---------|
| Items en sidebar | 10 | 6 |
| Rutas de Atenciones | 5 | 1 |
| Fuentes de verdad para filtros | 2 (sidebar + tabs) | 1 (Bandeja) |
| Clics para ver tickets | 1-2 | 1 |
| Categorías de filtro | 3 (canal, país, categoría) | 4 (canal, estado, categoría, búsqueda) |

---

## Inspiración UX

| Producto | Patrón aplicado |
|----------|----------------|
| **Linear** | Sidebar minimalista, solo módulos |
| **Front** | Filtros "pil" con conteos en la bandeja |
| **Intercom** | Filtros de vista en fila superior, barra de filtros debajo |
| **Jira** | Jerarquía clara: proyecto → filtros → issues |

---

*Documento generado automáticamente por COPE Product Development Standard*
*UX-001 — Reestructuración de Navegación*
