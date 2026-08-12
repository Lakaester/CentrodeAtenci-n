# Event-Driven Architecture

## Principio

Ningún módulo depende directamente de otro. La comunicación ocurre mediante eventos publicados en un Event Bus.

## Flujo

```
Publisher → EventBus → Subscribers
               │
               ▼
         AutomationEngine
               │
         ┌─────┴─────┐
         ▼           ▼
    ActionRegistry  ReplayService
```

## Componentes

| Componente | Responsabilidad |
|---|---|
| EventBus | Publicar, suscribir, despachar eventos |
| EventRegistry | Registrar y documentar eventos |
| AutomationEngine | Escuchar eventos y ejecutar reglas |
| ActionRegistry | Registrar acciones ejecutables |
| ReplayService | Reproducir eventos para reconstruir sesiones |
