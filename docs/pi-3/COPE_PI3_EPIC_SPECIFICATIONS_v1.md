# COPE PI-3 EPIC SPECIFICATIONS v1.0

**Fecha:** 2026-07-18
**Versión:** 1.0
**Fase:** PI-3 Planning
**Dependencias:** Todos los Blueprints v1.0
**Estado:** Oficial

---

## Epic 1: Executive Dashboard

### 1. Objetivo del negocio
Proporcionar al asesor una vista consolidada de su jornada laboral en el primer contacto con la plataforma.

### 2. Problema que resuelve
El asesor iniciaba su jornada sin visibilidad de sus casos pendientes, métricas del día ni prioridades. Debía navegar manualmente a cada sección para entender su carga de trabajo.

### 3. Valor entregado
Reducción del tiempo de orientación inicial de 3 minutos a 15 segundos.

### 4. Alcance
- Resumen del día con métricas personales y del equipo
- KPIs del asesor (casos abiertos, resueltos hoy, tiempo promedio)
- Alertas y casos prioritarios
- Acceso rápido al Workspace de atención

### 5. Fuera de alcance
- Dashboard de supervisor (Epic 3)
- Reportes históricos (Epic 5)
- Alertas personalizables

### 6. Dependencias
- UX Blueprint (capítulo 3: User Journeys)
- Design System (capítulo 4: KPI, Card, Alert)
- Navigation Blueprint (ruta `/dashboard`)

### 7. Casos de uso
| CU-01 | Ver resumen del día | Asesor |
|---|---|---|
| CU-02 | Ver KPIs personales | Asesor |
| CU-03 | Acceder a caso prioritario | Asesor |
| CU-04 | Ir a Atenciones | Asesor |

### 8. Historias de usuario
| ID | Historia |
|---|---|
| US-01 | Como asesor, quiero ver mis casos pendientes al iniciar sesión para priorizar mi jornada. |
| US-02 | Como asesor, quiero ver mis KPIs del día (resueltos, tiempo promedio, SLA) para medir mi rendimiento. |
| US-03 | Como asesor, quiero ver alertas de casos urgentes para atenderlos de inmediato. |
| US-04 | Como asesor, quiero un acceso directo al Workspace de atención para comenzar a operar. |

### 9. Reglas de negocio
BR-005, BR-003

### 10. Eventos del dominio
CaseCreated, CaseResolved, AlertRaised

### 11. Entidades
Case, Customer, Alert, Metric

### 12. Roles
Asesor, Supervisor, Admin

### 13. Flujo principal
```
Login → Dashboard → Ver KPIs → Click en caso prioritario → Workspace
```

### 14. Criterios de aceptación
- KPIs del asesor visibles en menos de 2 segundos
- Lista de casos pendientes priorizada por SLA
- Click en caso abre el Workspace directamente
- Sin navegación adicional requerida

### 15. Riesgos
- Performance de KPIs si hay muchos casos

### 16. Métricas de éxito
- Tiempo desde login hasta primer caso atendido: < 30 segundos

### 17. KPIs
- Casos abiertos asignados
- Resueltos hoy
- Tiempo promedio de resolución
- SLA cumplimiento personal

### 18. Definition of Done
- Dashboard implementado con KPIs reales
- Navegación a Workspace funcional
- Tiempo de carga < 2s
- Pruebas unitarias + integración

---

## Epic 2: Live Operations

### 1. Objetivo del negocio
Mostrar en tiempo real la actividad operativa del equipo de soporte.

### 2. Problema que resuelve
El supervisor no tenía visibilidad de lo que estaba ocurriendo en el momento. Debía preguntar manualmente a cada asesor o revisar reportes desactualizados.

### 3. Valor entregado
Detección de anomalías operativas en menos de 30 segundos.

### 4. Alcance
- Timeline de actividad en vivo del equipo
- Eventos por asesor, caso y acción
- Filtros por tipo de evento y asesor
- Integración con EventBus para eventos en tiempo real

### 5. Fuera de alcance
- WebSockets (futuro PI-5)
- Alertas automáticas (Epic 6)

### 6. Dependencias
- EventBus (core congelado)
- TimelineService
- UX Blueprint (capítulo 4: Task Flows)
- Design System (capítulo 4: Timeline)

### 7. Casos de uso
| CU-05 | Ver actividad en vivo del equipo | Supervisor |
|---|---|---|
| CU-06 | Filtrar eventos por asesor | Supervisor |
| CU-07 | Ver detalle de evento | Supervisor |

### 8. Historias de usuario
| ID | Historia |
|---|---|
| US-05 | Como supervisor, quiero ver la actividad del equipo en tiempo real para detectar anomalías. |
| US-06 | Como supervisor, quiero filtrar eventos por asesor para evaluar su carga de trabajo. |

### 9. Reglas de negocio
BR-008 (evento obligatorio)

### 10. Eventos del dominio
CaseCreated, CaseAssigned, CaseResolved, ConversationStarted, DecisionGenerated

### 11. Entidades
Case, Advisor, Event, Timeline

### 12. Roles
Supervisor, Admin

### 13. Flujo principal
```
OCC → Live Operations → Timeline de eventos → Filtrar → Detalle
```

### 14. Criterios de aceptación
- Eventos visibles en menos de 5 segundos después de ocurridos
- Filtros funcionales por asesor y tipo de evento
- Timeline actualizable sin recargar página

### 15. Riesgos
- Volumen de eventos podría afectar performance

### 16. Métricas de éxito
- Tiempo entre evento y visualización: < 5 segundos

### 17. KPIs
- Eventos por minuto
- Asesores activos

### 18. Definition of Done
- Timeline de eventos funcional
- Filtros implementados
- Integración con EventBus probada

---

## Epic 3: Supervisor Workspace

### 1. Objetivo del negocio
Proporcionar al supervisor una consola unificada para monitorear y gestionar la operación.

### 2. Problema que resuelve
El supervisor no tenía un lugar único para supervisar casos, equipo, SLA y salud del sistema.

### 3. Valor entregado
Reducción del tiempo de supervisión de 30 minutos a 5 minutos por jornada.

### 4. Alcance
- Dashboard OCC con KPIs globales
- Health del sistema
- Casos por estado
- Actividad reciente
- Navegación a detalle de caso

### 5. Fuera de alcance
- Reportes históricos (Epic 5)
- Alert center (Epic 6)
- Gestión de horarios del equipo

### 6. Dependencias
- Health Platform (core congelado)
- Case Manager (core congelado)
- Navigation Blueprint (ruta `/operations`)
- UX Blueprint (capítulo 3: Supervisor Journey)

### 7. Casos de uso
| CU-08 | Ver dashboard OCC | Supervisor |
|---|---|---|
| CU-09 | Monitorear salud del sistema | Supervisor |
| CU-10 | Inspeccionar caso crítico | Supervisor |
| CU-11 | Ver KPIs globales | Supervisor, Gerencia |

### 8. Historias de usuario
| ID | Historia |
|---|---|
| US-07 | Como supervisor, quiero ver KPIs globales en un solo lugar para evaluar la operación. |
| US-08 | Como supervisor, quiero ver la salud del sistema para detectar problemas técnicos. |
| US-09 | Como supervisor, quiero ver casos por estado para identificar cuellos de botella. |

### 9. Reglas de negocio
BR-003 (SLA), BR-006 (core congelado)

### 10. Eventos del dominio
CaseCreated, CaseResolved, ProviderError, DecisionGenerated

### 11. Entidades
Case, Provider, Health, Metric, KPI

### 12. Roles
Supervisor, Admin, Gerencia

### 13. Flujo principal
```
OCC → Dashboard → Ver KPIs → Health → Casos por estado → Inspeccionar caso
```

### 14. Criterios de aceptación
- KPIs globales calculados en menos de 3 segundos
- Health checks ejecutados y visibles
- Casos por estado actualizados en tiempo real
- Navegación a detalle de caso funcional

### 15. Riesgos
- Health checks podrían afectar performance del core

### 16. Métricas de éxito
- Tiempo de carga del dashboard OCC: < 3 segundos

### 17. KPIs
- MTTR, SLA, health score, casos abiertos, providers disponibles

### 18. Definition of Done
- Dashboard OCC implementado
- Health checks visibles
- Casos por estado funcional
- KPIs calculados correctamente

---

## Epic 4: Customer Workspace

### 1. Objetivo del negocio
Proporcionar un workspace completo y contextual del cliente donde el asesor pueda operar sin cambiar de pantalla.

### 2. Problema que resuelve
El asesor debía cambiar entre múltiples pantallas para ver datos del cliente, historial, diagnóstico y acciones disponibles.

### 3. Valor entregado
Reducción del 40% en tiempo de diagnóstico gracias a la información contextual unificada.

### 4. Alcance
- Workspace con 6 pestañas (Resumen, Diagnóstico, Ambiente, Tickets, Timeline, IA)
- Header permanente con datos del cliente (dominio, empresa, producto, país, estado)
- Catálogo de acciones reutilizable
- Timeline integrado
- IA panel preparado

### 5. Fuera de alcance
- Diagnóstico automático (Decision Engine ya existe)
- Respuesta automática (futuro)

### 6. Dependencias
- CustomerResolver (core congelado)
- Decision Engine (core congelado)
- Knowledge Platform (core congelado)
- Design System (capítulo 3: Split View Layout)
- Navigation Blueprint (ruta `/clientes/:dominio`)

### 7. Casos de uso
| CU-12 | Ver resumen del cliente | Asesor |
|---|---|---|
| CU-13 | Ejecutar diagnóstico | Asesor |
| CU-14 | Consultar ambiente del cliente | Asesor |
| CU-15 | Ver timeline del cliente | Asesor |
| CU-16 | Vincular dominio | Asesor |

### 8. Historias de usuario
| ID | Historia |
|---|---|
| US-10 | Como asesor, quiero ver toda la información del cliente en un solo lugar para diagnosticar rápido. |
| US-11 | Como asesor, quiero ejecutar acciones de diagnóstico desde el workspace sin cambiar de pantalla. |
| US-12 | Como asesor, quiero ver el timeline del cliente para entender su historial. |

### 9. Reglas de negocio
BR-001 (dominio único)

### 10. Eventos del dominio
CustomerFound, CustomerUpdated, DecisionGenerated

### 11. Entidades
Customer, Case, Conversation, Event, Timeline

### 12. Roles
Asesor, Supervisor

### 13. Flujo principal
```
Búsqueda → Resultado → Workspace → Resumen → Diagnóstico → Acción → Timeline
```

### 14. Criterios de aceptación
- Workspace cargado en menos de 2 segundos
- 6 pestañas funcionales
- Header con datos del cliente siempre visible
- Acciones ejecutables sin recargar

### 15. Riesgos
- CustomerResolver sin datos reales (conexión mock)

### 16. Métricas de éxito
- Tiempo de diagnóstico por caso: reducción del 40%

### 17. KPIs
- Tiempo en workspace por caso
- Acciones ejecutadas por sesión

### 18. Definition of Done
- Workspace con 6 pestañas implementado
- Acciones reutilizables funcionales
- Timeline del cliente visible

---

## Epic 5: Operational Analytics

### 1. Objetivo del negocio
Proporcionar reportes operativos que permitan analizar tendencias, productividad y calidad del servicio.

### 2. Problema que resuelve
Los reportes existentes eran estáticos y no permitían filtrar por fecha, canal, asesor ni categoría.

### 3. Valor entregado
Toma de decisiones basada en datos con menos de 3 clics.

### 4. Alcance
- Resumen Ejecutivo con KPIs, tendencias y comparativas
- Reporte de Operación con heatmap de carga
- Reporte de Asesores con ranking y productividad
- Reporte de Categorías con Pareto y SLA
- Reporte de Clientes con top clientes y tendencias
- Reporte de WhatsApp con métricas del canal
- Reporte de Zendesk con backlog y SLA
- Reporte de Tendencias con evolución semanal/mensual
- Filtros globales (período, subcanal, país, asesor, categoría, dominio)

### 5. Fuera de alcance
- Exportación avanzada (PDF, Excel)
- Reportes personalizados por el usuario

### 6. Dependencias
- v_unificado_norm (BD existente)
- Navigation Blueprint (rutas `/reportes/*`)
- Design System (capítulo 6: Table Patterns)
- FilterBar existente

### 7. Casos de uso
| CU-17 | Ver resumen ejecutivo | Todos |
|---|---|---|
| CU-18 | Ver reporte de operación | Supervisor |
| CU-19 | Ver reporte de asesores | Supervisor |
| CU-20 | Ver reporte de categorías | Supervisor |
| CU-21 | Filtrar reportes | Todos |

### 8. Historias de usuario
| ID | Historia |
|---|---|
| US-13 | Como gerente, quiero ver KPIs ejecutivos con comparativa contra el período anterior. |
| US-14 | Como supervisor, quiero ver la carga operativa por hora y día para optimizar turnos. |
| US-15 | Como supervisor, quiero ver el ranking de asesores por productividad. |

### 9. Reglas de negocio
BR-003 (SLA)

### 10. Eventos del dominio
CaseResolved, CaseCreated

### 11. Entidades
Case, Customer, Ticket, Metric

### 12. Roles
Todos

### 13. Flujo principal
```
Reportes → Seleccionar reporte → Filtrar → Ver KPIs → Exportar
```

### 14. Criterios de aceptación
- 8 reportes funcionales
- Filtros globales aplican a todos los reportes
- KPIs con comparativa vs período anterior
- Tiempo de carga < 3 segundos

### 15. Riesgos
- Performance de consultas SQL en v_unificado_norm

### 16. Métricas de éxito
- Reportes cargados en menos de 3 segundos

### 17. KPIs
- Total casos, MTTR, SLA, top asesores, top categorías, tendencias

### 18. Definition of Done
- 8 reportes implementados y funcionales
- Filtros globales operativos
- KPIs calculados correctamente

---

## Epic 6: Alerts Center

### 1. Objetivo del negocio
Centralizar todas las alertas operativas y técnicas en un solo lugar.

### 2. Problema que resuelve
Las alertas estaban dispersas (SLA, health, providers) y no existía un centro unificado para revisarlas.

### 3. Valor entregado
Reducción del tiempo de respuesta ante incidentes críticos de 30 minutos a 5 minutos.

### 4. Alcance
- Alertas de SLA violado
- Alertas de health (provider caído, memoria crítica)
- Alertas de casos críticos
- Lista de alertas con severidad, estado y fecha
- Acción para ir al detalle de la alerta

### 5. Fuera de alcance
- Notificaciones push
- Reglas de alerta configurables por el usuario

### 6. Dependencias
- Health Platform (core congelado)
- SLAService (core congelado)
- EventBus (eventos ProviderError)
- Design System (capítulo 4: Alert, Status)

### 7. Casos de uso
| CU-22 | Ver centro de alertas | Supervisor |
|---|---|---|
| CU-23 | Filtrar alertas por severidad | Supervisor |
| CU-24 | Ir al detalle de alerta | Supervisor |

### 8. Historias de usuario
| ID | Historia |
|---|---|
| US-16 | Como supervisor, quiero ver todas las alertas en un solo lugar para priorizar mi atención. |
| US-17 | Como supervisor, quiero saber qué proveedores están caídos para escalar técnicamente. |

### 9. Reglas de negocio
BR-003 (SLA)

### 10. Eventos del dominio
ProviderError, AlertRaised

### 11. Entidades
Alert, Provider, Case, Health

### 12. Roles
Supervisor, Admin

### 13. Flujo principal
```
OCC → Alertas → Lista → Filtrar → Detalle → Acción
```

### 14. Criterios de aceptación
- Alertas visibles inmediatamente
- Filtros por severidad funcionales
- Navegación a detalle de alerta

### 15. Riesgos
- Volumen de alertas podría ser alto

### 16. Métricas de éxito
- Tiempo de respuesta a incidentes críticos: < 5 minutos

### 17. KPIs
- Alertas activas por severidad
- Tiempo de resolución de alertas

### 18. Definition of Done
- Centro de alertas funcional
- Alertas de health, SLA y providers visibles
- Filtros implementados

---

## Epic 7: Global Timeline

### 1. Objetivo del negocio
Proporcionar una vista unificada del timeline de toda la plataforma.

### 2. Problema que resuelve
Cada entidad tenía su propio timeline, pero no existía una vista global que permitiera entender la secuencia completa de eventos.

### 3. Valor entregado
Trazabilidad completa de cualquier evento en menos de 5 segundos.

### 4. Alcance
- Timeline global con eventos de todas las entidades
- Filtros por tipo de evento, entidad y fecha
- Navegación a detalle del evento
- Integración con EventBus

### 5. Fuera de alcance
- WebSockets (futuro PI-5)
- Replay de eventos

### 6. Dependencias
- EventBus (core congelado)
- TimelineService
- Design System (capítulo 4: Timeline)

### 7. Casos de uso
| CU-25 | Ver timeline global | Supervisor |
|---|---|---|
| CU-26 | Filtrar eventos por tipo | Supervisor |
| CU-27 | Navegar a detalle de evento | Supervisor |

### 8. Historias de usuario
| ID | Historia |
|---|---|
| US-18 | Como supervisor, quiero ver el timeline global de la plataforma para entender la secuencia de eventos. |

### 9. Reglas de negocio
BR-008 (evento obligatorio)

### 10. Eventos del dominio
Todos

### 11. Entidades
Event, Timeline, Case, Customer

### 12. Roles
Supervisor, Admin

### 13. Flujo principal
```
OCC → Timeline → Filtrar → Seleccionar evento → Detalle
```

### 14. Criterios de aceptación
- Timeline global funcional
- Filtros por tipo y fecha
- Navegación a detalle

### 15. Riesgos
- Volumen de eventos

### 16. Métricas de éxito
- Trazabilidad de cualquier evento en < 5 segundos

### 17. KPIs
- Eventos por tipo
- Eventos por hora

### 18. Definition of Done
- Timeline global implementado
- Filtros funcionales
- Navegación a detalle

---

## Priorización recomendada

| Prioridad | Epic | Justificación |
|---|---|---|
| **P1** | Epic 4: Customer Workspace | Core de la experiencia del asesor. Dependencia de otros epics. |
| **P2** | Epic 1: Executive Dashboard | Primera pantalla del asesor. Bajo esfuerzo, alto impacto. |
| **P3** | Epic 5: Operational Analytics | Reportes existentes, solo falta consolidar filtros. |
| **P4** | Epic 2: Live Operations | Depende de EventBus (ya funcional). |
| **P5** | Epic 3: Supervisor Workspace | Depende de OCC parcialmente implementado. |
| **P6** | Epic 6: Alerts Center | Depende de Health Platform y SLAService. |
| **P7** | Epic 7: Global Timeline | Depende de EventBus y TimelineService. |

---

## Roadmap PI-3

### Release 1 (Semanas 1-2)
- Customer Workspace (Epic 4)
- Executive Dashboard (Epic 1)

### Release 2 (Semanas 3-4)
- Operational Analytics (Epic 5)
- Live Operations (Epic 2)

### Release 3 (Semanas 5-6)
- Supervisor Workspace (Epic 3)
- Alerts Center (Epic 6)
- Global Timeline (Epic 7)

---

*Documento oficial — COPE PI-3 Epic Specifications v1.0*
