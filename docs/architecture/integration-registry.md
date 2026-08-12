# Integration Registry — Arquitectura de Integraciones

## Principio

COPE es una plataforma modular. Cada sistema externo es un **Adapter** registrado en un **Integration Registry**. El sistema nunca conoce implementaciones concretas; siempre trabaja mediante interfaces.

## Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    IntegrationRegistry                    │
│  register()  unregister()  get()  list()  exists()       │
└──────────────────┬──────────────────────────────────────┘
                   │
      ┌────────────┼────────────┬────────────┬──────────┐
      ▼            ▼            ▼            ▼          ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
│ Printer │ │Microserv.│ │RestaFact │ │Zendesk │ │...Adapter│
│ Adapter │ │ Adapter  │ │ Adapter  │ │ Adapter │ │          │
└─────────┘ └──────────┘ └──────────┘ └────────┘ └──────────┘
```

## ¿Qué es un Adapter?

Un Adapter implementa `IntegrationAdapter`:

```typescript
interface IntegrationAdapter {
  getName(): string;
  getCapabilities(): IntegrationCapability[];
  isAvailable(): boolean;
  connect(ctx: CustomerContext): Promise<boolean>;
  execute(action: string, params: unknown): Promise<unknown>;
  disconnect(): Promise<void>;
  health(): Promise<{ ok: boolean; message?: string }>;
}
```

## ¿Qué es un Registry?

Es el único responsable de administrar adaptadores. No contiene lógica de negocio. Solo registro y consulta.

## ¿Cómo registrar una integración?

```typescript
registry.register(new PrinterAdapter());
registry.register(new MicroserviceAdapter());
```

## ¿Cómo agregar una integración nueva?

1. Crear el Adapter (implementa `IntegrationAdapter`).
2. Registrarlo en el Registry.
3. El resto del sistema no se modifica.

## Lazy Loading

Toda integración se ejecuta únicamente bajo demanda. Quedan prohibidos:
- Consultas automáticas al abrir una página.
- Polling.
- Refresh automático.
- Background requests.

## Flujo completo

```
Frontend → dominio → CustomerContextProvider → CustomerContext
                                                    │
                                                    ▼
                                         IntegrationService
                                         (solo conoce Registry)
                                                    │
                                          ┌─────────┴──────────┐
                                          ▼                    ▼
                                   PrinterAdapter      MicroserviceAdapter
                                   (bajo demanda)      (bajo demanda)
```

## Responsabilidades

| Componente | Responsabilidad |
|---|---|
| IntegrationAdapter | Interfaz con el sistema externo |
| IntegrationRegistry | Administrar adaptadores registrados |
| IntegrationService | Consumir adaptadores vía Registry (nunca directamente) |
| CustomerContextProvider | Resolver dominio → CustomerContext |
