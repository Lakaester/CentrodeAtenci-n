# Customer Workspace

## Objetivo

Punto de entrada único para todas las operaciones del asesor. El usuario nunca navega directamente hacia Providers. Siempre trabaja dentro del contexto de un cliente, identificado por su dominio.

## Flujo

```
Asesor
   │
   ▼
Customer Workspace (dominio)
   │
   ├── Resumen      → CustomerContext + Providers
   ├── Diagnóstico   → Orchestrators
   ├── Ambiente      → Environment Providers
   ├── Tickets       → Zendesk / Historial
   ├── Timeline      → TimelineService
   └── IA            → DiagnosisResult
```

## Componentes

| Componente | Propósito |
|---|---|
| WorkspaceLayout | Header permanente con datos del cliente |
| ResumenTab | Vista consolidada del cliente |
| DiagnosticoTab | Ejecuta orquestadores |
| AmbienteTab | Providers del entorno (Printer, FE, etc.) |
| TicketsTab | Historial de tickets |
| TimelineTab | TimelineService visual |
| IATab | DiagnosisResult + recomendaciones |

## Relaciones

- **CustomerContext**: Identidad + conexión del cliente.
- **Providers**: Acciones ejecutables (Printer, Microservice, etc.).
- **Orchestrators**: Coordinan múltiples providers.
- **TimelineService**: Registra eventos funcionales.
- **IA**: Recibe DiagnosisResult y muestra próximos pasos.
