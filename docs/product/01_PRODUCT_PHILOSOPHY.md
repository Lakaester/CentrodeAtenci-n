# Filosofía del Producto COPE

## Propósito de este documento

Definir la filosofía, los objetivos estratégicos y la visión de producto de COPE. Este documento establece el marco conceptual dentro del cual se toman todas las decisiones de producto. Cualquier funcionalidad, cambio o priorización debe alinearse con lo aquí definido.

---

## 1. ¿Qué es COPE?

COPE es una plataforma de atención al cliente diseñada específicamente para operaciones de facturación electrónica, integraciones y soporte técnico en el ecosistema de restaurantes y afines.

No es un CRM genérico. No es un help desk tradicional. Es una plataforma especializada que entiende el dominio de facturación electrónica, las integraciones con agregadores (PedidosYa, Rappi, Uber Eats) y las operaciones de soporte técnico de productos SaaS.

### 1.1 Definición oficial

> COPE es el sistema de gestión de atenciones que centraliza, contextualiza y acelera la resolución de solicitudes de clientes, independientemente del canal de origen, utilizando un modelo de dominio rico que entiende el negocio de facturación electrónica y operaciones de restaurantes.

---

## 2. Filosofía

### 2.1 El dominio primero

COPE se construye desde el conocimiento del negocio hacia el código. Cada concepto del sistema existe primero en el lenguaje del equipo de atención, luego en el modelo de dominio y finalmente en el código. No se implementa nada que no tenga un correlato directo con el negocio.

### 2.2 La atención es la unidad fundamental

El centro de COPE es la Atención. Una atención comienza cuando un cliente contacta y termina cuando se resuelve su solicitud. Todo el sistema está diseñado para dar contexto, herramientas y seguimiento a ese proceso. No existen tickets, casos, solicitudes o incidencias como entidades separadas. Todo converge en la Atención.

### 2.3 El canal es un detalle de implementación

El cliente puede contactar por WhatsApp, Messenger, correo electrónico, llamada telefónica o API. Para COPE, el canal es solo un atributo de la Atención. La plataforma unifica todos los canales bajo un mismo modelo de atención, permitiendo que el asesor trabaje de forma consistente independientemente del origen.

### 2.4 El diagnóstico es evolutivo

Una atención rara vez tiene un diagnóstico único desde el inicio. El modelo de COPE permite múltiples hipótesis simultáneas que evolucionan a medida que se recopila información. El sistema no fuerza un diagnóstico único prematuro, sino que acompaña al asesor en el proceso de descubrimiento.

### 2.5 La trazabilidad es automática

Cada acción que se realiza durante una atención queda registrada automáticamente como una actividad. El timeline no es un registro que el asesor deba mantener, sino una construcción automática a partir de las actividades. Si una acción no genera una actividad, no ocurrió.

### 2.6 El resultado es independiente del estado del ticket

El resultado de una atención (resuelto, parcial, escalado, pendiente, sin respuesta, duplicado) es una conclusión del proceso de atención, no un reflejo del estado del ticket. Un ticket puede estar cerrado pero la atención puede haber quedado pendiente.

---

## 3. Objetivos estratégicos

### 3.1 Objetivo primordial

Reducir el tiempo de resolución de atenciones de clientes en un 40% mediante la contextualización automática, el diagnóstico asistido y la trazabilidad completa.

### 3.2 Objetivos específicos

| Objetivo | Métrica | Horizonte |
|----------|---------|-----------|
| Centralizar todos los canales de atención en una sola interfaz | 100% de atenciones unificadas | V1 |
| Proveer contexto completo del cliente al asesor | 100% de atenciones con cliente360 | V1 |
| Eliminar la necesidad de cambiar entre sistemas | 0 alternancias durante una atención | V1 |
| Automatizar la construcción del timeline | 100% de actividades registradas automáticamente | V1 |
| Soportar diagnósticos con múltiples hipótesis | Sin límite de hipótesis por atención | V1 |
| Permitir que la IA asista sin depender de ella | IA como adaptador, no como núcleo | V2 |

---

## 4. Principios de producto

### 4.1 Principios funcionales

| Principio | Descripción |
|-----------|-------------|
| **Centralidad de la atención** | Toda la interfaz, toda la lógica, todos los datos giran en torno a la atención. No hay pantallas, módulos o funcionalidades fuera de este contexto. |
| **Contexto sin búsqueda** | El asesor nunca debe buscar información del cliente. Cuando selecciona una atención, todo el contexto relevante debe estar presente. |
| **Acción con un clic** | Las herramientas que el asesor necesita deben estar a un clic de distancia. No más de tres clics para cualquier acción. |
| **Traza automática** | El asesor no debe preocuparse por registrar lo que hace. El sistema lo hace por él. |
| **Diagnóstico acompañado** | El sistema sugiere, el asesor decide. Las hipótesis son colaborativas, no impuestas. |
| **Resultado explícito** | Toda atención debe concluir con un resultado explícito, no implícito. Si no hay resultado, la atención no está completa. |

### 4.2 Principios técnicos

| Principio | Descripción |
|-----------|-------------|
| **Modelo de dominio rico** | El código debe reflejar fielmente el negocio. No hay modelos anémicos ni datos sin comportamiento. |
| **Arquitectura limpia** | Las capas están separadas y las dependencias apuntan hacia adentro. El dominio no sabe de Express, Prisma ni del frontend. |
| **API primero** | Toda funcionalidad se expone como API REST antes de ser consumida por el frontend. |
| **Validación en el borde** | Las entradas se validan en los DTOs con Zod. El dominio recibe datos ya validados. |
| **Persistencia desacoplada** | Los repositorios son interfaces. La implementación concreta (memoria, PostgreSQL, etc.) es intercambiable. |
| **Eventos implícitos** | Las acciones de dominio generan eventos sin que el código de dominio se acople a un bus de eventos. |

---

## 5. Actores del sistema

### 5.1 Asesor de atención

Es el usuario principal. Gestiona atenciones de clientes, diagnostica problemas, aplica soluciones y registra resultados. Trabaja exclusivamente dentro del contexto de una atención.

### 5.2 Supervisor

Visualiza métricas, revisa atenciones del equipo, identifica cuellos de botella y asegura calidad. No modifica atenciones directamente.

### 5.3 Cliente

Es la persona o empresa que solicita atención. No accede directamente al sistema; interactúa a través de los canales de comunicación (WhatsApp, Messenger, correo).

### 5.4 Sistema

Ejecuta acciones automáticas: registro de actividades, construcción del timeline, cálculos de SLA, notificaciones. No tiene voluntad propia; responde a eventos del dominio.

---

## 6. Visión futura

### 6.1 V1 — Consolidación del dominio (actual)

- Atención como agregado raíz.
- Diagnóstico con múltiples hipótesis.
- Timeline automático desde actividades.
- Resultado independiente del ticket.
- Contexto completo del cliente (cliente360).
- Integración con canales: WhatsApp, Messenger, correo.

### 6.2 V2 — Asistencia inteligente

- IA como asistente de diagnóstico.
- Sugerencia de hipótesis basada en atenciones similares.
- Detección automática de patrones y reincidencias.
- Predicción de tiempo de resolución.

### 6.3 V3 — Automatización proactiva

- Playbooks automatizados por categoría de atención.
- Cierre automático de atenciones con criterios definidos.
- Integración con sistemas externos para resolución automática.
- Self-service para clientes en atenciones de baja complejidad.

---

## 7. Relación con otros sistemas

COPE no reemplaza sistemas existentes. Se integra con ellos:

| Sistema | Rol | Tipo de integración |
|---------|-----|---------------------|
| Whaticket | Canal WhatsApp | Adaptador de entrada |
| Meta Business | Canal Messenger | Adaptador de entrada |
| Zendesk | Canal correo/API | Adaptador de entrada |
| Restafact | Consulta de facturación | Herramienta embebida |
| Dashboard FE | Visualización FE | Herramienta embebida |
| Microservice | Datos del cliente | Proveedor de datos |
| NotebookLM | Base de conocimiento | Herramienta de consulta |
| PostgreSQL | Persistencia principal | Repositorio |

---

## 8. Criterios de éxito

Una funcionalidad se considera exitosa cuando:

1. El modelo de dominio la representa fielmente.
2. La API la expone correctamente.
3. El frontend la consume sin fricción.
4. La traza queda registrada automáticamente.
5. El resultado es verificable.

---

*Última actualización: 2026-07-15*
*Versión: 1.0.0*
