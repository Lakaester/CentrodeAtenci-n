# Migration Plan — COPE Historical Engine

> Ruta de migracion de dashboards desde el estado actual (`estado_homologado`) hacia el motor historico (`ticket_status_history` + `ticket_status_snapshot`).

---

## Principio rector

**Ningun dashboard se rompe.** La migracion es incremental: cada dashboard adopta el motor historico sin perder la capacidad de consultar el estado actual. Durante la transicion, ambos sistemas coexisten.

---

## Orden de Migracion

### Fase 0 — Infraestructura (pre-requisito)

| Tarea | Descripcion |
|-------|-------------|
| Crear tablas | `ticket_status_history` + `ticket_status_snapshot` en PostgreSQL |
| Crear indices | 5 indices en `ticket_status_history`, 2 en `ticket_status_snapshot` |
| Job diario | Cron/trigger que ejecuta el snapshot a las 00:05 UTC |
| Event Bus | Integrar `StatusChanged` events con `EventBus` existente |
| Instrumentar | `ZendeskClient.cambiarEstado()`, `MetaService.closeTicket()`, `AssignTicketUseCase`, `CloseTicketUseCase`, `ResolveTicketUseCase` emiten eventos |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| Ningun dashboard afectado | Bajo | Medio (3-5 dias) | Acceso DBA a PostgreSQL |

---

### Fase 1 — Resumen Ejecutivo

| KPI actual | KPI migrado | Cambio |
|-----------|------------|--------|
| Total Atenciones (sin cambios) | — | — |
| Cerrados (sin cambios) | — | — |
| Cumplimiento SLA | SLA Historico | `estado_homologado` actual → fecha real de primera respuesta |
| Tiempo promedio (sin cambios) | — | — |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| 1 KPI cambia definicion | Bajo | Bajo (1-2 dias) | Fase 0 completa |

---

### Fase 2 — Asesores

| KPI actual | KPI migrado | Cambio |
|-----------|------------|--------|
| At. en proceso | Backlog por asesor | `estado_homologado != 'cerrado'` → estado al cierre del periodo |
| At. cerradas | Cerradas historicas | `estado_homologado = 'cerrado'` → realmente cerradas al cierre |
| At. atendidas | Total historico | Suma correcta de cerradas + en proceso historicas |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| Matriz completa cambia | Medio | Medio (3-4 dias) | Fase 0 completa, Fase 1 validada |

---

### Fase 3 — Pais

| KPI actual | KPI migrado | Cambio |
|-----------|------------|--------|
| At. en proceso | Backlog por pais | Misma logica que Asesores, agrupado por pais |
| At. cerradas | Cerradas historicas por pais | Idem |
| Tabla Pais por Canal | Sin cambios | — |
| Grafico evolucion | Sin cambios | — |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| Matriz WHATSAPP/CORREO cambia | Medio | Medio (2-3 dias) | Fase 2 validada (comparte `MetricsMatrix`) |

---

### Fase 4 — Categorias

| KPI actual | KPI migrado | Cambio |
|-----------|------------|--------|
| Totales por categoria (sin cambios) | — | — |
| Tendencia diaria (sin cambios) | — | — |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| Sin cambios en KPIs existentes | Bajo | Bajo (1 dia) | Fase 0 (solo agregar nuevos KPIs) |

---

### Fase 5 — Tendencias

| KPI nuevo | Descripcion |
|-----------|-------------|
| Curva de Backlog Diario | Area chart del backlog diario |
| Conversion Funnel | Embudo de estados (creados → asignados → respondidos → resueltos → cerrados) |
| Reaperturas por periodo | Cantidad de reaperturas en el mes |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| Solo KPIs nuevos | Bajo | Medio (3-4 dias) | Fase 0 completa |

---

### Fase 6 — Supervisor

| KPI nuevo | Descripcion |
|-----------|-------------|
| Tiempo por Estado (por asesor) | Desglose de tiempo en cada estado |
| Aging Real (por asesor) | Tiempo desde creacion hasta cierre |
| Conversion Funnel (por asesor) | Embudo de estados por asesor |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| Solo KPIs nuevos | Bajo | Medio (3-4 dias) | Fase 2 validada (usa datos de asesores) |

---

### Fase 7 — Live Operations

| KPI nuevo | Descripcion |
|-----------|-------------|
| Tiempo por Estado (tiempo real) | Estado actual + duracion desde ultimo cambio |
| Backlog en tiempo real | Tickets abiertos ahora |
| Alertas de aging | Tickets con >48h sin respuesta |

| Impacto | Riesgo | Esfuerzo | Dependencias |
|---------|--------|----------|-------------|
| Solo KPIs nuevos | Bajo | Medio (3-4 dias) | Fase 0 completa |

---

## Timeline Estimada

```
Semana 1-2:  Fase 0 (Infraestructura)
Semana 3:    Fase 1 (Resumen Ejecutivo)
Semana 4-5:  Fase 2 (Asesores)
Semana 6:    Fase 3 (Pais)
Semana 7:    Fase 4 (Categorias)
Semana 8-9:  Fase 5 (Tendencias)
Semana 10-11: Fase 6 (Supervisor)
Semana 12:   Fase 7 (Live Operations)

Total: 12 semanas (3 meses)
```

---

## Reglas de Migracion

1. **Nunca eliminar** un KPI existente. Solo agregar el equivalente historico con un nuevo nombre o sufijo `(historico)`.

2. **Coexistencia.** Durante la migracion, el dashboard muestra ambos valores (actual + historico) para que el usuario valide la diferencia.

3. **Toggle.** Usar un feature flag (`USE_HISTORICAL_KPIS`) para activar/desactivar los nuevos KPIs sin deploy.

4. **Validacion cruzada.** Despues de migrar un dashboard, comparar los valores de "en proceso (actual)" vs "en proceso (historico)" durante 1 semana. La diferencia debe ser cercana a 0 en periodos recientes y diverger solo en periodos antiguos (donde el estado actual ya no es confiable).

5. **Rollback.** Si el historico produce valores incorrectos, desactivar el toggle y volver al estado actual.

---

## Compatibilidad Garantizada

| Componente | Afectado? |
|-----------|-----------|
| Dashboards existentes | No (solo se agregan KPIs nuevos) |
| APIs existentes | No (nuevos endpoints para consultas historicas) |
| DTOs actuales | No (nuevos DTOs para respuestas historicas) |
| React Query | No (nuevas queries, sin invalidar existentes) |
| Providers | No (nuevo `HistoricalProvider`) |
| Modulos omnicanal | No |
| Sidebar / Layout | No |
| `MetricsMatrix` | No (componente compartido sin cambios) |
