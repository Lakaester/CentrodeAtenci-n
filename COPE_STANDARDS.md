# COPE — Estándares de Desarrollo

## Reglas Inmutables del Proyecto

### Flujo obligatorio de todo Sprint

```
Dominio → Sprint → Auditoría previa → Implementación → Pruebas → Auditoría técnica → Validación funcional → Merge
```

### Principios de Arquitectura

1. **Compatibilidad hacia atrás** — No se podrá romper compatibilidad. Todo cambio debe ser reversible mediante rollback.
2. **Componentes reutilizables** — Todo componente debe ser reutilizable. No se permitirá duplicación de código.
3. **Modelo de Dominio** — Toda integración debe respetar el Modelo de Dominio de COPE.
4. **Auditoría cada 5 Sprints** — Se realizará una auditoría completa de arquitectura, código, rendimiento, deuda técnica y experiencia de usuario antes de continuar agregando funcionalidades.
5. **Validación visual** — Ningún Sprint será considerado finalizado hasta entregar una representación visual funcional que permita al Product Owner validar la experiencia de uso y aprobar la implementación.

### Criterios de Evaluación por Sprint

Cada decisión debe responder:
- ¿Reduce el tiempo de diagnóstico?
- ¿Reduce el cambio entre plataformas?
- ¿Reduce clics?
- ¿Hace más fácil entender el contexto?

Si alguna respuesta es NO, replantear el diseño.

### Record de Sprints Completados

| Sprint | Descripción | Estado |
|---|---|---|
| ZD-004 | Migración a Zendesk Views API | ✅ |
| WKS-001 | Workspace de Atención (primera versión) | ✅ |
| UX-001 | Restauración del Workspace Omnicanal | ✅ |
| UX-000 | Workspace Operativo COPE (4 áreas) | ✅ |
| UX-001A | Humanización del lenguaje de COPE | ✅ |
| WS-002 | Renderizador Universal de Mensajes y Adjuntos | ✅ |
| WS-002 (fix) | Renderizado correcto según autor del mensaje | ✅ |
| WS-002 (fix2) | Interpretación inteligente de firmas y HTML | ✅ |

### Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion + React Router + TanStack Query + ECharts
- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Integraciones:** Zendesk API (Views API como fuente oficial), PostgreSQL (v_unificado_norm)
- **Infra:** Docker (PostgreSQL + pgAdmin)
