# Ticket Core

## ¿Qué es un Ticket COPE?
Un **Ticket** es la representación única de cualquier solicitud de atención, independientemente del canal de origen (Whaticket, Meta, Zendesk, Correo, API). El frontend nunca debe saber de qué canal proviene: solo trabaja con Tickets COPE.

## Relación con otros módulos

| Módulo | Relación |
|--------|----------|
| **Workspace** | El workspace se adapta según la categoría del ticket |
| **Timeline** | Cada cambio de estado del ticket se registra en el timeline |
| **Plugins** | Los plugins se ejecutan según el canal y categoría del ticket |
| **Diagnóstico** | El motor de diagnóstico analiza el ticket y sugiere categoría |
| **IA** | La IA sugiere respuestas, detecta riesgos y predice resolución |

## Estados estándar (4)

```
PENDIENTE ──► EN_PROCESO ──► RESUELTO ──► CERRADO
    │              │              │
    └──────────────┴──────────────┘
                      │
                      ▼
                   CERRADO (cancelado)
```

## Canales de origen

| Canal | Fuente externa |
|-------|---------------|
| whaticket | Whaticket API (WhatsApp Business) |
| meta | Meta Business API (Facebook/Instagram) |
| zendesk | Zendesk API |
| correo | Correo electrónico |
| api | API externa |

## Prioridades

| Prioridad | Score | SLA máximo | Color |
|-----------|-------|-----------|-------|
| BAJA | 10 | 48h | 🔵 |
| MEDIA | 30 | 24h | 🟡 |
| ALTA | 60 | 8h | 🔴 |
| CRÍTICA | 90 | 2h | 🛑 |

## Evolución hacia Casos

El Ticket Core es la base sobre la que se construirán los **Casos** en el futuro. Un Caso será un ticket que ha pasado por diagnóstico, tiene un workspace asociado, un timeline completo y múltiples interacciones.

La diferencia clave:
- **Ticket**: solicitud de atención entrante
- **Caso**: ticket con contexto completo (diagnóstico, workspace, timeline, playbook)

Para evolucionar sin romper compatibilidad:
1. Todo ticket puede convertirse en caso
2. Todo caso contiene un ticket
3. Las APIs existentes siguen funcionando sobre tickets
4. Las nuevas APIs trabajarán sobre casos

## Componentes

| Archivo | Propósito |
|---------|-----------|
| `TicketStatus.ts` | 4 estados + transiciones válidas |
| `TicketPriority.ts` | 4 niveles con score, SLA y color |
| `TicketChannel.ts` | 5 canales externos con configuración |
| `Ticket.ts` | Clase Ticket con 30+ campos |
| `TicketMapper.ts` | Conversión Whaticket/Meta/Zendesk → Ticket |
| `TicketFactory.ts` | Creación de tickets desde parámetros |
| `TicketLifecycle.ts` | 7 acciones oficiales (aceptar, asignar, resolver, cerrar...) |
