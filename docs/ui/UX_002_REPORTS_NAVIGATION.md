# UX-002: Reestructuración de navegación del módulo Reportes

## Problema detectado

El módulo Reportes tenía dos niveles de navegación:

```
ANTES:
┌─────────────────────┬──────────────────────────────┐
│  SIDEBAR PRINCIPAL  │  SIDEBAR SECUNDARIA (blanca) │
│                     │                              │
│  DASHBOARD          │  REPORTES                    │
│  ATENCIONES         │    Resumen                   │
│    Bandeja          │    Operación                 │
│  CLIENTES           │    País                      │
│  REPORTES       ──► │    Asesores                  │
│  CONOCIMIENTO       │    Categorías                │
│  CONFIGURACIÓN      │    Clientes                  │
│                     │    WhatsApp                  │
│                     │    Zendesk                   │
│                     │    Tendencias                │
└─────────────────────┴──────────────────────────────┘
```

**Problemas:**
- Dos sidebars reducían el espacio útil para gráficos y tablas
- Experiencia inconsistente: Atenciones usaba sidebar principal expandible, Reportes usaba sidebar secundaria
- El usuario debía navegar dos menús para cambiar de sección

---

## Solución aplicada

```
DESPUÉS:
┌─────────────────────┬──────────────────────────────────┐
│  SIDEBAR ÚNICA      │  CONTENIDO (ancho completo)      │
│                     │                                  │
│  DASHBOARD          │  [Filtros globales]              │
│  ATENCIONES         │                                  │
│    Bandeja          │  KPIs │ Gráficos │ Tablas        │
│  CLIENTES           │                                  │
│  REPORTES      ▼    │                                  │
│    Resumen          │                                  │
│    Operación        │                                  │
│    País             │                                  │
│    Asesores         │                                  │
│    Categorías       │                                  │
│    Clientes         │                                  │
│    WhatsApp         │                                  │
│    Zendesk          │                                  │
│    Tendencias       │                                  │
│  CONOCIMIENTO       │                                  │
│  CONFIGURACIÓN      │                                  │
└─────────────────────┴──────────────────────────────────┘
```

---

## Decisiones de UX

| Decisión | Justificación |
|----------|--------------|
| **REPORTES como grupo expandible** | Mismo patrón que ATENCIONES. Consistencia total. |
| **Eliminar DashboardLayout** | Ya no hay sidebar secundaria. El layout de reportes ahora usa el mismo `CopeLayout` que el resto del sistema. |
| **Sub-items directos en sidebar** | El usuario ve todas las opciones de reportes sin clics adicionales. |
| **Espacio recuperado** | +25% de ancho para gráficos y tablas al eliminar la sidebar blanca. |
| **Recordar estado expandido** | Si el usuario está en una ruta de reportes, el grupo REPORTES se abre automáticamente. |

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `config/cope-navigation.ts` | `REPORTES` convertido de `SidebarSingle` a `SidebarGroup` con 9 sub-items. Nuevos iconos. |
| `router/index.tsx` | Reportes movido de `DashboardLayout` (anidado) a `CopeLayout` (plano). Mismas rutas, mismo layout. |
| `components/layout/CopeSidebar.tsx` | Estado expandido de REPORTES se inicializa según la ruta activa. |
| `layouts/DashboardLayout.tsx` | **Eliminado** — ya no es necesario. |

---

## Comparativa

| Aspecto | Antes | Después |
|---------|-------|---------|
| Niveles de navegación | 2 | 1 |
| Sidebars visibles | 2 | 1 |
| Ancho para contenido | ~70% | ~100% |
| Layout consistente | No | Sí |
| Clics para cambiar de reporte | 2-3 | 1 |

---

*Documento generado automáticamente por COPE Product Development Standard*
*UX-002 — Reestructuración de navegación del módulo Reportes*
