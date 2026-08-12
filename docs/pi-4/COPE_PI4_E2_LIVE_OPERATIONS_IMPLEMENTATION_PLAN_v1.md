# COPE PI-4 · Epic 2 — Live Operations

## Implementation Plan v1.0

**Estado:** Draft → Para aprobación

---

## Objetivo

Construir el módulo **Live Operations**, orientado al monitoreo operativo en tiempo casi real de la plataforma COPE.

A diferencia del Executive Dashboard (visión analítica), este módulo estará diseñado para supervisar la operación en curso, facilitando la detección temprana de cuellos de botella, incumplimientos de SLA y sobrecarga operativa.

### Objetivos del Epic

Al finalizar este Epic, un supervisor deberá poder responder inmediatamente:

- ¿Cuántos tickets están activos?
- ¿Qué asesores están disponibles?
- ¿Qué canal presenta mayor carga?
- ¿Qué SLA están próximos a vencer?
- ¿Qué clientes requieren atención inmediata?
- ¿Dónde existe saturación operativa?

---

## Dependencias

### Reutilizar obligatoriamente

- Dashboard Foundation
- KPI Framework
- Charts Framework
- Filters Framework
- Widgets Framework
- Backend Integration Pattern
- Design System
- ErrorBoundary
- DashboardShell
- DashboardGrid
- DashboardSection

No se permitirá crear versiones paralelas de estos componentes.

---

## Arquitectura objetivo

```
LiveOperationsPage
        │
        ▼
Operational Widgets
        │
        ▼
Shared Frameworks
(KPI / Charts / Filters / Widgets)
        │
        ▼
Hooks
        │
        ▼
Services
        │
        ▼
API Client
        │
        ▼
Backend
```

---

## Packs del Epic

### Pack 1 — Live Operations Foundation

**Objetivo:** Crear la estructura visual del módulo.

**Alcance:**
- LiveOperationsPage
- Layout principal
- DashboardShell reutilizado
- DashboardGrid reutilizado
- DashboardSection reutilizado
- Zonas de monitoreo
- Responsive
- Estados base

**No incluye:**
- Backend
- KPIs
- Alertas
- Cola
- Agentes
- Gráficos

---

### Pack 2 — Operational KPI Layer

**Objetivo:** Mostrar indicadores operativos.

**Ejemplos:**
- Tickets Activos
- Tickets Pendientes
- SLA en Riesgo
- Asesores Activos
- Tiempo Medio de Espera
- Conversaciones Simultáneas

Utilizar exclusivamente el **KPI Framework** existente.

---

### Pack 3 — Live Queue & Agent Monitoring

**Objetivo:** Visualizar la operación actual.

**Incluye:**
- Cola de atención
- Estado de asesores
- Distribución de carga
- Prioridades
- Clientes esperando

No crear tablas nuevas si los Frameworks actuales son suficientes.

---

### Pack 4 — Operational Visualizations

**Objetivo:** Construir visualizaciones orientadas al monitoreo.

**Ejemplos:**
- Volumen por canal
- Distribución por prioridad
- Evolución reciente
- Heatmap de carga
- Tendencia de SLA

Utilizar únicamente el **Charts Framework**.

---

### Pack 5 — Operational Alerts

**Objetivo:** Incorporar monitoreo de eventos críticos.

**Ejemplos:**
- SLA vencido
- SLA próximo a vencer
- Cola saturada
- Canal crítico
- Cliente con espera excesiva

Las alertas deben ser consumibles por futuros módulos.

---

### Pack 6 — Backend Integration

Implementar:
- DTO
- Mapper
- Service
- React Query Hook
- Integración con API

Mantener el patrón utilizado en Executive Dashboard.

---

### Pack 7 — Enterprise QA

Auditoría completa del Epic.

Revisión de:
- Arquitectura
- Performance
- Reutilización
- Responsive
- Estados
- TypeScript
- Design System

---

### Pack 8 — Production Readiness

Preparación final para producción.

**Incluye:**
- Limpieza
- Hardening
- Validaciones
- Eliminación de deuda técnica menor
- Certificación del módulo

---

## Riesgos

### Alta frecuencia de actualización
La primera versión utilizará React Query con refetch periódico.
No se implementarán WebSockets ni Server-Sent Events en este Epic.

### Saturación visual
La pantalla debe priorizar:
- Alertas
- Estado actual
- Acciones
Los gráficos serán complementarios.

### Escalabilidad
Todos los componentes nuevos deberán ser reutilizables por futuros módulos como Supervisor Workspace y Alerts Center.

---

## Definition of Done

El Epic se considerará completado cuando:

- [ ] Todos los Packs estén aprobados.
- [ ] No existan errores TypeScript en el módulo.
- [ ] El build sea exitoso.
- [ ] Los Frameworks existentes se reutilicen sin duplicación.
- [ ] Se respeten los principios de Architecture Freeze.
- [ ] El módulo esté preparado para producción.

---

## Criterios de aceptación

- Arquitectura consistente.
- Bajo acoplamiento.
- Alta cohesión.
- Componentes reutilizables.
- Sin dependencias circulares.
- Responsive.
- Estados loading, empty, error y success.
- Integración desacoplada mediante DTO, Mapper, Service y Hook.
- Preparación para crecimiento hacia Supervisor Workspace, Alerts Center y Operational Analytics.

---

## Veredicto

**Implementation Plan v1.0: ✅ APROBADO**

Este plan mantiene la línea arquitectónica de PI-3 y aprovecha los Frameworks ya construidos, reduciendo duplicación y deuda técnica.

---

**Siguiente paso:** Con el plan aprobado, avanzaremos al flujo habitual:

→ PI-4 · Epic 2 · Pack 1 — Live Operations Foundation
