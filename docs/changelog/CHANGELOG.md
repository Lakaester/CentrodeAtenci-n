# Changelog

## [23.0.0] — 2026-07-18 — PRODUCT BLUEPRINT v1.0

### Added
- COPE PRODUCT BLUEPRINT v1.0 — documento oficial de producto
- 12 capítulos: Visión, Usuarios, Dominio, Casos de Uso, Capacidades, UX, Navegación, Roadmap, Reglas, Métricas, Visión 3 años
- Roadmap funcional PI-3 a PI-7 definido
- Perfiles de usuario (Asesor, Supervisor, QA, Admin, Gerencia)
- 11 métricas de producto definidas

### Product
- `docs/product/COPE_PRODUCT_BLUEPRINT_v1.md` — referencia oficial del producto
- Finalizada etapa de arquitectura. Inicia etapa de producto.

## [22.0.0] — 2026-07-18 — ARCHITECTURE FREEZE v1.0

### Added
- ADR-021: Architecture Freeze v1.0
- Architecture Map (context map, capas, dependencias permitidas/prohibidas)
- Governance Rules (core protection, development rules, process)
- Frozen Inventory (16 core components, 10 public contracts)
- Freeze Checklist (12/12 completado)

### Changed
- `core/` — 16 componentes oficialmente congelados
- `modules/` — designado como destino exclusivo para nuevas funcionalidades
- `docs/architecture/` — 3 nuevos documentos (map, governance, inventory, checklist)

## [21.0.0] — 2026-07-18 — SPRINT HARDENING 2

### Added
- ObservabilityService: punto único para emitir eventos (Logger + Audit + Timeline + Health + Heartbeat)
- Event Classification: domain, platform, infrastructure events documentado
- Seguridad: rate limiter (100 req/min por IP), security headers (HSTS, XSS, nosniff, CSP)
- `security.middleware.ts` con securityHeaders y rateLimiter
- Observability Platform documentada (modelo unificado + integración futura con OpenTelemetry/Prometheus/Grafana)
- CI/CD Pipeline documentado (Lint → Build → Test → Quality Gate → Artifact → Deploy → Smoke Test → Rollback)
- Technical Debt Report actualizado

### Changed
- `app.ts` — ahora usa securityHeaders, rateLimiter y disable x-powered-by
- `core/observability/` — nuevo módulo consolidado

## [20.0.0] — 2026-07-18 — SPRINT HARDENING 1

### Added
- ADR-019: Congelamiento de arquitectura (moderna vs legacy)
- Error handling unificado: DomainError, ApplicationError, InfrastructureError
- Error middleware actualizado con toErrorResponse()
- God Services auditados (dashboard.service.ts: 15 métodos — candidato a refactor)
- RBAC: authMiddleware, requireRole, optionalAuth con 3 roles
- Aislamiento de Prisma: toda interacción solo desde repositories/
- Reporte de hardening: `docs/architecture/hardening-report.md`
- 38 tests pasando, 0 roturas de compatibilidad

### Changed
- `error.middleware.ts` — ahora usa errores tipados con código, tipo y timestamp
- `core/errors/types.ts` — nuevo módulo centralizado de errores

## [19.0.0] — 2026-07-18 — PI-3 / FASE 18

### Added
- Operations Control Center (OCC): consola de supervisión operativa
- OperationsService: consume Health, Case Management y KPIs del Core
- Dashboard backend con KPIs (health score, SLA, casos abiertos, providers, MTTR)
- Frontend OCC con KPIWidget, HealthWidget y casos por estado
- ADR-018: Operations Control Center como módulo de supervisión operativa

### Architecture
- `backend/src/modules/operations/` — módulo de operaciones
- `frontend/src/modules/operations/` — dashboard visual
- `GET /api/operations/dashboard` — dashboard consolidado

## [18.0.0] — 2026-07-18 — PI-3 / FASE 17

### Added
- Health Monitoring Platform: monitoreo unificado de componentes
- HealthRegistry: registro de health checks desacoplados
- HealthAggregator: genera reportes consolidados con estados (healthy, degraded, warning, unhealthy, offline)
- CoreChecks: api, event-bus, memory, uptime
- HeartbeatService: heartbeats por componente con detección de caída
- Liveness / Readiness endpoints (preparados para Kubernetes)
- ADR-017: Health Monitoring Platform

### Architecture
- `backend/src/core/health/` — plataforma de monitoreo
- `GET /api/health/report` — reporte consolidado
- `GET /api/health/liveness` — liveness check
- `GET /api/health/readiness` — readiness check (503 si unhealthy)
- `GET /api/health/heartbeats` — heartbeats activos

## [17.0.0] — 2026-07-18 — PI-3 / FASE 16

### Added
- Configuration Platform: ConfigurationRegistry como fuente única de configuración
- SchemaValidator: valida tipo, obligatoriedad, rango, formato, opciones
- EnvProvider: acceso a process.env (ningún módulo debe acceder directamente)
- VersionManager: historial de cambios por clave
- ConfigurationAudit: auditoría de todas las operaciones
- ADR-016: Configuration Platform como fuente única de configuración

### Architecture
- `backend/src/core/configuration/` — plataforma completa de configuración
- `GET /api/config` — listar configuraciones
- `POST /api/config` — crear/actualizar
- `GET /api/config/:key` — obtener
- `GET /api/config/:key/history` — historial de cambios
- `GET /api/config/audits` — auditoría

## [16.0.0] — 2026-07-18

### M2-S1: Seguridad
- AuthService con autenticación JWT simplificada + API key
- AuthMiddleware: authMiddleware, requireRole, optionalAuth
- POST /api/security/login — login simple
- GET /api/security/me — usuario autenticado

### M2-S2: Persistencia
- JsonFileAdapter: persistencia a JSON para eventos, auditoría y timeline
- IPersistenceAdapter: interfaz genérica (save, list, findBy, count)

### M2-S3: Performance
- PUT method en ZendeskClient ahora con retry (3 intentos, backoff 2s/4s/8s)
- MemoryCache: caché en memoria con TTL configurable

### M2-S4: Barrel exports
- 13 barrel exports creados en core/*/index.ts
- securityRouter registrado en /api/security

## [15.0.0] — 2026-07-18

### Added
- Plugin SDK: interfaces públicas para Logger, Audit, Timeline, EventBus, Customer, Decision, Knowledge, Cases, Workflows
- PluginManager: orquesta registro, ciclo de vida, capacidades y health
- PluginRegistry: registro central con búsqueda por capacidad
- LifecycleManager: install, enable, disable, remove con transiciones validadas
- CapabilityResolver: resuelve qué plugins ofrecen cada capacidad
- PluginSDK con 9 módulos del core expuestos como interfaces
- ADR-015: Plugin Architecture
- ADR-016: SDK Público
- ADR-017: Capability Resolver

### Architecture
- `backend/src/core/plugins/` — sistema completo de plugins
- `POST /api/plugins` — instalar plugin
- `GET /api/plugins` — listar
- `GET /api/plugins/capabilities` — capacidades disponibles
- `POST /api/plugins/:id/enable|disable` — ciclo de vida
- `GET /api/plugins/:id/health` — health check

## [14.0.0] — 2026-07-18

### Added
- Workflow Engine: motor de procesos con definiciones versionables
- 8 tipos de step: manual, automatic, conditional, parallel, approval, wait, notification, validation
- WorkflowRegistry para definiciones con búsqueda
- StepExecutor con ejecución por tipo de step
- Instancias de workflow con contexto y estado (running, paused, completed, failed, abandoned)
- WorkflowMetrics: total ejecuciones, completados, fallos, abandonos, duración promedio
- ADR-014: Workflow Engine como motor de procesos de COPE

### Architecture
- `backend/src/core/workflows/` — motor completo de workflows
- `POST /api/workflows/definitions` — crear definición
- `GET /api/workflows/definitions` — listar
- `POST /api/workflows/instances` — iniciar instancia
- `POST /api/workflows/instances/:id/execute` — ejecutar paso
- `GET /api/workflows/metrics/:definitionId` — métricas

## [13.0.0] — 2026-07-18

### Added
- Case Management: modelo operativo propio de COPE independiente de tickets externos
- 10 estados: nuevo → en_analisis → diagnosticado → esperando_cliente/proveedor → implementando → validacion → resuelto → cerrado → reabierto
- WorkflowEngine con transiciones validadas (evita estados inválidos)
- SLAService con límites por prioridad (crítica: 4h, alta: 8h, media: 24h, baja: 72h)
- HistoryService con registro completo de cada transición
- CaseRegistry con búsqueda por texto, dominio, asignado y estado
- ADR-013: Case Management como modelo operativo de COPE

### Architecture
- `backend/src/core/cases/` — gestión completa de casos
- `POST /api/cases` — crear caso
- `GET /api/cases` — listar
- `GET /api/cases/search?q=` — buscar
- `GET /api/cases/:id` — obtener
- `POST /api/cases/:id/transition` — cambiar estado
- `GET /api/cases/:id/sla` — calcular SLA
- `GET /api/cases/:id/history` — historial
- `GET /api/cases/stats` — estadísticas

## [12.0.0] — 2026-07-18

### Added
- Knowledge Platform: artículos versionados con flujo de aprobación
- KnowledgeEngine: orquesta artículos, búsqueda, versionado y aprobación
- KnowledgeRegistry: registro central de artículos con búsqueda por texto, tags y keywords
- VersionManager: versionado semver de cada artículo
- ApprovalService: flujo Draft → In Review → Approved → Published → Archived
- 5 categorías: articles, playbooks, procedures, faqs, known_issues
- ADR-012: Knowledge Platform

### Architecture
- `backend/src/core/knowledge/` — motor completo de conocimiento
- `POST /api/knowledge/articles` — crear artículo
- `GET /api/knowledge/articles?q=` — buscar
- `GET /api/knowledge/articles/:id` — obtener
- `PATCH /api/knowledge/articles/:id/status` — cambiar estado
- `GET /api/knowledge/stats` — estadísticas

## [11.0.0] — 2026-07-18

### Added
- EventBus asincrónico con publish, subscribe, unsubscribe, dispatch, exists, list, getHistory
- EventEnvelope estandarizado con eventId, correlationId, version, severity, payload, metadata
- EventRegistry con 18 tipos de eventos registrados
- AutomationEngine con ActionRegistry para ejecutar acciones automáticas
- ReplayService para reconstrucción de sesiones por correlationId
- DevTools UI: visor de eventos en vivo, filtro por tipo/provider, historial
- ADR-010: Event-Driven Architecture
- ADR-011: Automation Engine

### Architecture
- `backend/src/core/events/` — EventBus, Registry, ReplayService
- `backend/src/core/automation/` — AutomationEngine, ActionRegistry
- `frontend/src/modules/devtools/` — Developer Tools para eventos
- `GET /api/dev/events/history` — historial de eventos
- `GET /api/dev/events/types` — tipos registrados
- `GET /api/dev/events/subscriptions` — suscripciones activas

## [10.0.0] — 2026-07-18

### Added
- Decision Engine: motor de diagnóstico determinístico basado en reglas
- RuleRegistry: registro central de reglas
- BaseRule: clase abstracta con evaluación de condiciones (eq, neq, gt, gte, lt, lte, contains, exists)
- DiskSpaceRule: primera regla implementada (env-001)
- RuleEngine: evaluación batch de reglas contra un contexto
- DecisionResult con hallazgos, riesgos, recomendaciones y confianza
- ADR-009: Decision Engine como capa de diagnóstico determinístico

### Architecture
- `backend/src/core/decision-engine/` — motor completo
- `docs/rules/` — documentación de reglas por categoría
- `POST /api/decision/evaluate` — endpoint de evaluación
- `GET /api/decision/rules` — listar reglas registradas

## [8.0.0] — 2026-07-18

### Added
- Universal Search con detección automática de tipo (domain, email, phone, ruc, ticket, local_id, device_id)
- SearchEngine: orquesta detección, providers, merge y ranking
- TypeDetector: identifica automáticamente el tipo de búsqueda
- MergeEngine: fusiona resultados y elimina duplicados
- RankingEngine: asigna puntaje de relevancia por reglas
- CustomerMemorySearchProvider: primer provider funcional
- SearchProvider interface para futuros providers
- UniversalSearchModal con debounce de 300ms, historial reciente, Ctrl+K
- ADR-008: Universal Search como punto único de entrada

### Architecture
- `backend/src/modules/search/` — motor completo de búsqueda
- `frontend/src/modules/search/` — interfaz de búsqueda universal
- `docs/search/` — documentación del módulo

## [7.0.0] — 2026-07-18

### Added
- Customer Workspace como punto único de operación
- WorkspaceLayout con header permanente (dominio, empresa, producto, país, estado)
- Pestañas: Resumen, Diagnóstico, Ambiente, Tickets, Timeline, IA
- Catálogo de acciones reutilizable (ActionsCatalog)
- ADR-007: Customer Workspace como punto único de operación

### Architecture
- `frontend/src/modules/customer-workspace/` — módulo completo del workspace
- `docs/architecture/customer-workspace.md` — documentación de arquitectura

## [6.0.0] — 2026-07-18

### Added
- Platform Services: Logger, Audit, Rollback, Release, Health, Timeline
- Orchestrators module with registry
- Architecture Decision Records (ADR 001–006)
- Observability documentation

### Architecture
- `src/core/platform/` — servicios transversales de plataforma
- `src/core/orchestrators/` — motor de orquestación
- `docs/adr/` — decisiones arquitectónicas documentadas

## [3.0.0] — 2026-07-18

### Added
- PrinterAdapter funcional (IntegrationAdapter)
- CustomerResolver integrado con PrinterService
- Bootstrap de integraciones al iniciar backend
- Frontend envía dominio, no datos técnicos

### Changed
- PrinterService usa CustomerResolver en lugar de valores hardcodeados
- Endpoints de Printer requieren dominio en body/query

## [2.6.0] — 2026-07-18

### Added
- Integration Registry (register, unregister, get, list, exists)
- IntegrationAdapter interfaz base
- PrinterAdapter placeholder
- Principio de lazy loading

## [2.5.0] — 2026-07-18

### Added
- CustomerContextProvider y CustomerResolver
- Módulo core/customer con tipos, DTOs, repositorio
- Documentación de identidad por dominio
- Ruta POST /api/customer/resolve

## [1.0.0] — 2026-07-15

### Added
- Primer release de la plataforma
