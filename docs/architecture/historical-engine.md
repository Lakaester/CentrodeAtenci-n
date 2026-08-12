# Historical Ticket Engine — COPE

> Arquitectura completa para la transicion de un sistema basado en estado actual a un sistema basado en eventos historicos.

---

## Indice de Documentos

| Documento | Contenido |
|-----------|-----------|
| [ticket-lifecycle.md](ticket-lifecycle.md) | Auditoria del flujo de estados de Zendesk, Meta y Whaticket |
| [historical-model.md](historical-model.md) | Modelo de datos: tablas, indices, volumen estimado |
| [event-engine.md](event-engine.md) | Catalogo de 10 eventos del ciclo de vida del ticket |
| [historical-repository.md](historical-repository.md) | Contrato de interfaces para consultas historicas |
| [snapshot-engine.md](snapshot-engine.md) | Comparativa Snapshots Diarios vs Event Sourcing. Recomendacion: modelo hibrido. |
| [historical-kpis.md](historical-kpis.md) | 9 nuevos KPIs habilitados por el motor historico |
| [migration-plan.md](migration-plan.md) | Ruta de migracion incremental en 7 fases (12 semanas) |

---

## Arquitectura General

```
CANALES EXTERNOS                    COPE BACKEND                         COPE FRONTEND
────────────────                    ────────────                         ─────────────
Zendesk API ──► cambios de estado ──► EventBus ──► HistoricalRepository
                                               │
Meta API    ──► cambios de estado ──►          │     ┌─ ticket_status_history
                                               ├─────┤
Whaticket   ──► (futuro)          ──►          │     └─ ticket_status_snapshot
                                                      │
                                               ┌──────┘
                                               │
                                    ┌──────────┴──────────┐
                                    │ HistoricalRepository │
                                    │  getBacklogAtDate()  │────► Dashboard Resumen Ejecutivo
                                    │  getReopenCount()    │────► Dashboard Asesores
                                    │  getTimeInStatus()   │────► Dashboard Supervisor
                                    │  getTransitions()    │────► Auditoria
                                    └─────────────────────┘
```

---

## Principios

1. **Incremental.** Nunca se rompe un dashboard existente. Los nuevos KPIs se agregan sin eliminar los anteriores.

2. **Hibrido.** Snapshots diarios para rendimiento en dashboards + Event Sourcing para precision en auditoria.

3. **Read-only.** El motor historico solo escribe en `ticket_status_history`. No modifica `v_unificado_norm`.

4. **Compatibilidad.** Los dashboards actuales siguen funcionando con `estado_homologado`. Los nuevos usan `ticket_status_snapshot`.

5. **Toggle.** Feature flag `USE_HISTORICAL_KPIS` permite activar/desactivar sin deploy.

---

## Lo que se gana

| Antes | Despues |
|-------|---------|
| Solo estado actual del ticket | Historial completo de cambios |
| "At. en proceso" usa estado de HOY | Estado real al cierre del periodo |
| Backlog estimado via fecha de creacion | Backlog exacto al 31 de julio |
| Sin trazabilidad de cambios | Cada transicion con timestamp, usuario y origen |
| Sin capacidad de auditoria | Auditoria completa de cambios de estado |
| 0 KPIs historicos | 9 nuevos KPIs (backlog, reaperturas, tiempos por estado, SLA historico, embudo de conversion, aging real) |

---

## Estado

| Fase | Estado |
|------|--------|
| FASE 1 — Auditoria flujo de estados | ✅ Completado |
| FASE 2 — Modelo historico | ✅ Completado |
| FASE 3 — Event Engine | ✅ Completado |
| FASE 4 — Historical Repository | ✅ Completado |
| FASE 5 — Snapshot Engine | ✅ Completado |
| FASE 6 — KPIs historicos | ✅ Completado |
| FASE 7 — Plan de migracion | ✅ Completado |

**Proxima etapa:** Implementacion de Fase 0 (Infraestructura) — creacion de tablas, indices, job diario, instrumentacion de eventos.
