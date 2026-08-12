# Case Management

## Objetivo

Centralizar el ciclo completo de resolución de un problema, independientemente del sistema externo donde exista el ticket.

## Principios

- Un Case NO es un Ticket Zendesk.
- Un Ticket puede estar asociado a un Case.
- Un Case puede involucrar múltiples Providers.
- Todo cambio genera historial.
- Todo cambio es auditable.

## Workflow

```
Nuevo → En análisis → Diagnóstico → Esperando cliente/proveedor
    → Implementando solución → Validación → Resuelto → Cerrado
                              ↑                       ↓
                              └── Reabierto ←─────────┘
```

## Componentes

| Componente | Responsabilidad |
|---|---|
| CaseManager | Orquesta operaciones del caso |
| CaseRegistry | Registro central de casos |
| WorkflowEngine | Transiciones de estado válidas |
| HistoryService | Registro de historial |
| SLAService | Cálculo de SLA |
| ReportService | Generación de reportes |
