# COPE DOMAIN BLUEPRINT v1.0

**Fecha:** 2026-07-18
**Versión:** 1.0
**Fase:** PI-3 Foundations
**Dependencias:** Product Blueprint v1.0, Architecture Freeze v1.0
**Estado:** Oficial

---

## Capítulo 1: Ubiquitous Language

### Customer (Cliente)
- **Definición:** Persona o empresa que recibe soporte a través de COPE. Se identifica únicamente por su **dominio**.
- **Responsabilidad:** Ser el centro de toda operación. Todos los casos, conversaciones y diagnósticos pertenecen a un Customer.
- **Qué NO significa:** No es un ticket. No es un contacto de Zendesk. No es un usuario del sistema.
- **Ejemplos:** "restaurant.pe", "cliente.restaurant.pe", "midominio.com"

### Case (Caso)
- **Definición:** Ciclo completo de resolución de un problema. Independiente del canal por el que llega la solicitud.
- **Responsabilidad:** Centralizar toda la información, acciones, timeline y diagnóstico de una atención.
- **Qué NO significa:** No es un ticket de Zendesk. No es una conversación de WhatsApp. Un ticket puede estar asociado a un Case, pero el Case vive en COPE.
- **Ejemplos:** Caso por facturación electrónica, Caso por caída de servidor.

### Ticket
- **Definición:** Representación externa de una solicitud proveniente de un sistema de tickets (Zendesk, WhatsApp, Meta).
- **Responsabilidad:** Sincronizar el estado entre el sistema externo y el Case de COPE.
- **Qué NO significa:** No es el caso. No es la fuente de verdad del diagnóstico.
- **Ejemplos:** Ticket #32454 de Zendesk, conversación de WhatsApp.

### Advisor (Asesor)
- **Definición:** Usuario del sistema que atiende casos. Puede ser agente, supervisor o administrador.
- **Responsabilidad:** Diagnosticar, resolver y documentar casos.
- **Qué NO significa:** No es un cliente. No es un sistema externo.
- **Ejemplos:** "Lidia Ceferino (agente)", "Victor Castagnino (admin)"

### Conversation (Conversación)
- **Definición:** Intercambio de mensajes entre el asesor y el cliente dentro de un Case.
- **Responsabilidad:** Mantener el historial completo de la comunicación.
- **Qué NO significa:** No es el Case. No es un ticket.
- **Ejemplos:** Hilo de correos, chat de WhatsApp.

### Message (Mensaje)
- **Definición:** Unidad mínima de comunicación dentro de una Conversation.
- **Responsabilidad:** Transportar información entre el asesor y el cliente.
- **Qué NO significa:** No es una nota interna. Las notas internas son un tipo especial de mensaje.
- **Ejemplos:** Respuesta pública, nota interna, mensaje automático.

### Workflow (Flujo de trabajo)
- **Definición:** Proceso operativo versionable que orquesta pasos para resolver un tipo específico de caso.
- **Responsabilidad:** Estandarizar la resolución de problemas recurrentes.
- **Qué NO significa:** No es un caso. No es una automatización sin supervisión.
- **Ejemplos:** Workflow de diagnóstico de impresora, Workflow de activación de facturación electrónica.

### Knowledge (Conocimiento)
- **Definición:** Activo institucional versionado y aprobado que documenta procedimientos, guías, FAQs y problemas conocidos.
- **Responsabilidad:** Ser la fuente de verdad del conocimiento operativo.
- **Qué NO significa:** No es documentación técnica del sistema. No es un artículo informal.
- **Ejemplos:** Procedimiento de activación FE, FAQ de integración Rappi.

### Provider (Proveedor)
- **Definición:** Sistema externo conectado a COPE que provee información o ejecuta acciones.
- **Responsabilidad:** Ejecutar operaciones en el entorno del cliente (impresoras, servidores, facturación).
- **Qué NO significa:** No es un plugin. No es un adaptador.
- **Ejemplos:** Printer Provider, Microservice Provider, Facturación Electrónica Provider.

### Plugin
- **Definición:** Capacidad instalable que extiende la funcionalidad de COPE sin modificar el Core.
- **Responsabilidad:** Agregar nuevas capacidades de forma desacoplada.
- **Qué NO significa:** No es un provider. No es una integración directa.
- **Ejemplos:** Plugin de diagnóstico IA, Plugin de reportes personalizados.

### Event (Evento)
- **Definición:** Ocurrencia significativa dentro de la plataforma. Puede ser de dominio, plataforma o infraestructura.
- **Responsabilidad:** Notificar a otros componentes sin acoplamiento directo.
- **Qué NO significa:** No es un log. No es una métrica.
- **Ejemplos:** CaseCreated, CustomerFound, DecisionGenerated.

### Timeline (Línea de tiempo)
- **Definición:** Secuencia cronológica de eventos funcionales asociados a un Customer o Case.
- **Responsabilidad:** Proporcionar trazabilidad completa de la relación con el cliente.
- **Qué NO significa:** No es un log técnico. No es una auditoría.
- **Ejemplos:** Eventos de consulta de logs, cambios de configuración, diagnósticos ejecutados.

### Health (Salud)
- **Definición:** Estado operativo de un componente del sistema en un momento dado.
- **Responsabilidad:** Indicar si un componente funciona correctamente.
- **Qué NO significa:** No es una métrica de negocio. No es un KPI.
- **Ejemplos:** "api: healthy", "memory: warning (85%)", "event-bus: healthy"

---

## Capítulo 2: Domain Model

### Customer
| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador único |
| dominio | string | Identificador principal (único) |
| email | string | Correo principal de contacto |
| empresa | string | Razón social |
| pais | string | País |

### Case
| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador único |
| status | enum | nuevo, en_analisis, diagnosticado, esperando_cliente, esperando_proveedor, implementando, validacion, resuelto, cerrado, reabierto |
| dominio | string | Dominio del cliente asociado |
| priority | enum | baja, media, alta, critica |

### Ticket
| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | ID del sistema externo |
| source | string | Zendesk, WhatsApp, Meta |
| status | string | Estado en el sistema origen |

### WorkflowDefinition
| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador único |
| name | string | Nombre del workflow |
| version | string | Semver |
| status | enum | draft, active, archived |

### KnowledgeArticle
| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador único |
| title | string | Título del artículo |
| category | enum | playbook, procedure, faq, known_issue |
| status | enum | draft, in_review, approved, published, archived |

### Provider
| Atributo | Tipo | Descripción |
|---|---|---|
| name | string | Nombre del provider |
| type | string | printer, microservice, fe |
| status | enum | connected, disconnected, error |

### Plugin
| Atributo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador único |
| name | string | Nombre del plugin |
| version | string | Semver |
| status | enum | installed, enabled, disabled, error |

### Event
| Atributo | Tipo | Descripción |
|---|---|---|
| eventId | string | UUID único |
| eventType | string | Tipo de evento |
| correlationId | string | Trazabilidad entre eventos |
| timestamp | string | ISO 8601 |

---

## Capítulo 3: Context Map

| Contexto | Responsabilidad | Entidades propietarias |
|---|---|---|
| **Customer** | Identidad y datos del cliente | Customer, CustomerMemory |
| **Operations** | Gestión del día a día | Case, Ticket, Conversation, Message |
| **Communications** | Comunicación multicanal | Conversation, Message, Channel |
| **Knowledge** | Conocimiento institucional | KnowledgeArticle, Playbook, FAQ |
| **Automation** | Automatización de procesos | WorkflowDefinition, WorkflowInstance |
| **Analytics** | Reportes y métricas | Dashboard, Metric, KPI |
| **Platform** | Core técnico | Event, Plugin, Provider, Configuration, Health |
| **Identity** | Usuarios y permisos | Advisor, Role, Permission |

### Dependencias permitidas entre contextos

```
Customer → Operations, Communications, Analytics
Operations → Knowledge, Automation, Platform
Communications → Platform
Knowledge → Platform
Automation → Platform
Analytics → Platform
Platform → Identity
```

### Dependencias prohibidas

```
Platform → Customer
Platform → Operations
Platform → Knowledge
Knowledge → Operations (sin mediación de Platform)
```

---

## Capítulo 4: Ownership Matrix

| Entidad | Contexto propietario | Contextos consumidores |
|---|---|---|
| Customer | Customer | Operations, Analytics |
| Case | Operations | Analytics, Automation |
| Ticket | Communications | Operations |
| Conversation | Communications | Operations, Analytics |
| Message | Communications | Operations |
| WorkflowDefinition | Automation | Operations |
| WorkflowInstance | Automation | Operations |
| KnowledgeArticle | Knowledge | Operations, Automation |
| Provider | Platform | Operations, Automation |
| Plugin | Platform | Operations |
| Event | Platform | Todos |
| Configuration | Platform | Todos |
| Health | Platform | Operations, Analytics |
| Advisor | Identity | Todos |

---

## Capítulo 5: Business Rules Catalog

| ID | Nombre | Tipo | Prioridad | Contexto | Condición | Resultado |
|---|---|---|---|---|---|---|
| BR-001 | Dominio único | Invariante | Alta | Customer | Un dominio no puede pertenecer a dos clientes | Rechazar duplicado |
| BR-002 | Transición válida | Invariante | Alta | Operations | Solo transiciones definidas en VALID_TRANSITIONS | Rechazar transición inválida |
| BR-003 | SLA por prioridad | Cálculo | Media | Operations | Caso crítico: 4h, alta: 8h, media: 24h, baja: 72h | Marcar como breached si excede |
| BR-004 | Categoría antes de resolver | Validación | Alta | Operations | No se puede resolver un caso sin categoría | Bloquear resolución |
| BR-005 | Asignación antes de responder | Validación | Media | Operations | No se puede responder sin asesor asignado | Bloquear respuesta |
| BR-006 | Core congelado | Gobierno | Crítica | Platform | Core no se modifica sin ADR | Rechazar cambio |
| BR-007 | Plugin no modifica core | Gobierno | Alta | Platform | Plugin no puede alterar comportamiento del core | Sandbox |
| BR-008 | Evento obligatorio | Invariante | Media | Platform | Toda acción modificadora genera evento | Auditoría automática |

---

## Capítulo 6: Domain Events Catalog

| Evento | Descripción | Publisher | Consumers |
|---|---|---|---|
| CaseCreated | Se creó un nuevo caso | Operations | Automation, Analytics, Platform |
| CaseAssigned | Se asignó un asesor al caso | Operations | Automation, Analytics |
| CaseResolved | El caso se marcó como resuelto | Operations | Automation, Analytics, Knowledge |
| CaseReopened | El caso se reabrió | Operations | Automation |
| CustomerFound | Cliente encontrado en búsqueda | Customer | Operations, Analytics |
| CustomerUpdated | Datos del cliente actualizados | Customer | Operations |
| ConversationStarted | Nueva conversación iniciada | Communications | Operations, Analytics |
| WorkflowStarted | Instancia de workflow iniciada | Automation | Operations, Analytics |
| KnowledgePublished | Nuevo artículo publicado | Knowledge | Operations |
| ProviderConnected | Provider conectado | Platform | Operations, Health |
| ProviderError | Error en provider | Platform | Operations, Health, Analytics |
| DecisionGenerated | Diagnóstico del Decision Engine | Platform | Operations, Analytics |

---

## Capítulo 7: Lifecycle Catalog

### Case Lifecycle

```
nuevo → en_analisis → diagnosticado → esperando_cliente/cliente_proveedor → implementando → validacion → resuelto → cerrado
                                                                                                                    ↓
                                                                                                               reabierto → en_analisis
```

| Transición | Permitida | Genera evento |
|---|---|---|
| nuevo → en_analisis | ✅ | CaseAssigned |
| diagnosticado → implementando | ✅ | — |
| validacion → resuelto | ✅ | CaseResolved |
| resuelto → cerrado | ✅ | — |
| cerrado → reabierto | ✅ | CaseReopened |
| nuevo → cerrado | ❌ | — |
| implementando → nuevo | ❌ | — |

### Customer Lifecycle

```
creación → activo → desactivado
```

### WorkflowDefinition Lifecycle

```
draft → active → archived
```

### KnowledgeArticle Lifecycle

```
draft → in_review → approved → published → archived
                       ↓
                  rejected
```

---

## Capítulo 8: Glossary

| Término | Definición |
|---|---|
| Case | Ciclo completo de resolución de un problema |
| Customer | Cliente identificado por dominio |
| Ticket | Representación externa de una solicitud |
| Advisor | Usuario que atiende casos |
| Supervisor | Usuario que monitorea la operación |
| Conversation | Intercambio de mensajes |
| Message | Unidad mínima de comunicación |
| Workflow | Proceso operativo versionable |
| Knowledge | Conocimiento institucional versionado |
| Provider | Sistema externo conectado |
| Plugin | Capacidad instalable |
| Event | Ocurrencia significativa en la plataforma |
| Timeline | Secuencia cronológica de eventos |
| Health | Estado operativo de un componente |
| SLA | Acuerdo de nivel de servicio |
| MTTR | Tiempo promedio de resolución |
| FCR | Resolución en primer contacto |
| Domain | Identificador único del cliente |
| CorrelationId | Trazabilidad entre eventos relacionados |
| Configuration | Parámetro del sistema centralizado |
| Decision Engine | Motor de diagnóstico determinístico |
| Integration Registry | Registro de adaptadores del sistema |
| Action Registry | Registro de acciones automatizables |
| Orchestrator | Coordinador de múltiples adaptadores |
| Capability | Funcionalidad declarada por un plugin |
| Workspace | Vista contextual del cliente |

---

*Documento oficial — COPE Domain Blueprint v1.0*
