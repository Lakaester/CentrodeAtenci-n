# Rollback: Event Bus

Si el EventBus causa problemas, se puede deshabilitar temporalmente sin eliminar código.

## Deshabilitar EventBus

```typescript
// En bootstrap.ts, comentar la inicialización:
// export function initEvents() { ... }

// En routes/index.ts, comentar las rutas:
// apiRouter.use("/dev/events", eventRouter);
```

## Deshabilitar AutomationEngine

```typescript
// No registrar los handlers en el EventBus
// bus.subscribe("...", handler);
```

## Volver al comportamiento anterior

Los módulos funcionan sin eventos. El EventBus es una capa adicional opcional.
